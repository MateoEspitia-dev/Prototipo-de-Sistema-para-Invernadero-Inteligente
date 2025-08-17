from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import SensorData
from .serializers import SensorDataSerializer
import pandas as pd
from datetime import datetime, timedelta
import os
import numpy as np
import joblib
from django.conf import settings
from statsmodels.tsa.arima.model import ARIMA
import pytz  

# Rutas de los modelos ARIMA
MODELOS_PATH = os.path.join(settings.BASE_DIR, "models", "modelo_anomalias_savedmodel")
UMBRALES_PATH = os.path.join(settings.BASE_DIR, "models", "umbrales_savedmodel")

resultados_anomalias = {}  # Diccionario global para almacenar resultados

# Ruta del archivo CSV
csv_file = 'datos_sensores.csv'

def guardar_datos_en_csv(datos):
    """
    Guarda los datos de los sensores en un archivo CSV.
    :param datos: Diccionario con los datos de los sensores.
    """
    # DataFrame con los nuevos datos
    nuevos_datos = {
        'timestamp': [datos['timestamp']],
        'sensor_id': [datos['sensor_id']],
        'nombre': [datos['nombre']],
        'humedad': [datos['humedad']],
        'temperatura': [datos['temperatura']],
    }
    nuevos_datos_df = pd.DataFrame(nuevos_datos)

    # Guardar los datos en el archivo CSV
    if os.path.exists(csv_file):
        # Si el archivo existe, cargarlo y agregar los nuevos datos
        datos_existentes = pd.read_csv(csv_file)
        datos_completos = pd.concat([datos_existentes, nuevos_datos_df], ignore_index=True)
    else:
        # Si el archivo no existe, crear uno nuevo
        datos_completos = nuevos_datos_df

    # Guardar el DataFrame en el archivo CSV
    datos_completos.to_csv(csv_file, index=False)

class SensorDataCreateAPIView(APIView):
    def get(self, request, *args, **kwargs):
        # Recuperar todos los datos del sensor y serializarlos
        sensor_data = SensorData.objects.all()
        serializer = SensorDataSerializer(sensor_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        if isinstance(request.data, list):  # Verificar si los datos son una lista
            saved_data = []
            errors = []

            for sensor in request.data:
                serializer = SensorDataSerializer(data=sensor)
                if serializer.is_valid():
                    # Guardar los datos en la base de datos
                    serializer.save()

                    # Guardar los datos en el CSV
                    guardar_datos_en_csv({
                        'timestamp': sensor.get('timestamp', datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
                        'sensor_id': sensor.get('sensor_id'),
                        'nombre': sensor.get('nombre'),
                        'humedad': sensor.get('humedad', 0.0),  # Valor por defecto si no está presente
                        'temperatura': sensor.get('temperatura', 0.0),  # Valor por defecto si no está presente
                    })

                    saved_data.append(serializer.data)
                else:
                    errors.append(serializer.errors)

            if errors:
                return Response(
                    {"status": "partial_success", "saved_data": saved_data, "errors": errors},
                    status=status.HTTP_207_MULTI_STATUS,
                )

            return Response({"status": "success", "saved_data": saved_data}, status=status.HTTP_201_CREATED)
        else:
            return Response({"error": "El formato de datos debe ser un arreglo de objetos."}, status=status.HTTP_400_BAD_REQUEST)


class DetectAnomalyAPIView(APIView):
    def get(self, request, *args, **kwargs):
        global resultados_anomalias
        if resultados_anomalias:
            return Response(resultados_anomalias, status=status.HTTP_200_OK)
        else:
            return Response({"mensaje": "No hay resultados disponibles."}, status=status.HTTP_404_NOT_FOUND)
        
    def post(self, request, *args, **kwargs):
        try:
            modelos = joblib.load(MODELOS_PATH)
            umbrales = joblib.load(UMBRALES_PATH)
            print("Umbrales cargados:", umbrales)
        except Exception as e:
            return Response({"error": f"No se pudieron cargar los modelos ARIMA: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        # Reorganizacion de los datos para que coincidan con el formato nombre, valor, timestamp para los modelos
        try:
            # Adaptación para el nuevo formato JSON
            datos_lista = []
            ahora_tz = datetime.now(pytz.timezone('America/Bogota')) # Marca de tiempo con zona horaria
            for sensor in request.data:
                datos_lista.append({
                    'nombre': sensor['nombre'],
                    'temperatura': sensor['temperatura'],
                    'humedad': sensor['humedad'],
                    'timestamp': ahora_tz # Marca de tiempo con zona horaria
                })

            datos_df = pd.DataFrame(datos_lista)
            print("Datos recibidos:")
            print(datos_df)
        except Exception as e:
            return Response({"error": f"Error al procesar los datos: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        datos_reorganizados = self.reorganizar_datos(datos_df)
        print("Datos reorganizados:")
        print(datos_reorganizados)

        resultados = {}
        for index, row in datos_reorganizados.iterrows():
            nombre = row['nombre']
            valor = row['valor']
            timestamp = row['timestamp']
            print(f"Procesando: {nombre}, Valor: {valor}, Time: {timestamp}")

            # Llamar a detectar_anomalia con el valor correspondiente
            resultado = self.detectar_anomalia(modelos, umbrales, nombre, valor, timestamp)

            resultados[nombre] = resultado
            print(f"Resultado: {resultados[nombre]}")
            
        global resultados_anomalias
        resultados_anomalias = resultados  # Almacena los resultados
          # Agregar el dato original a los resultados para el front
        for nombre, resultado in resultados_anomalias.items():
            # Buscar el dato original correspondiente
            for sensor in request.data:
                sensor_nombre = sensor['nombre']
                if "Humedad" in nombre:
                    if "Interior" in nombre and "Interior" in sensor_nombre:
                        resultado['dato'] = sensor['humedad']
                        break
                    elif "Exterior" in nombre and "Exterior" in sensor_nombre:
                        resultado['dato'] = sensor['humedad']
                        break
                    elif "Suelo" in nombre and "Suelo" in sensor_nombre:
                        resultado['dato'] = sensor['humedad']
                        break
                elif sensor_nombre == nombre: # Para temperaturas
                    resultado['dato'] = sensor['temperatura']
                    break
                
        return Response(resultados, status=status.HTTP_200_OK)
    
    def reorganizar_datos(self, datos_df):
        """
        Reorganiza los datos para que coincidan con el formato nombre, valor, timestamp, y los valores reordenados
        según la lógica de los sensores. Este método es necesario para que los modelos ARIMA funcionen
        """
        ultimos_datos = []
        for index, row in datos_df.iterrows():
            nombre_sensor = row['nombre']
            temperatura = row['temperatura']
            humedad = row['humedad']
            timestamp = row['timestamp']
            
            # Agrega los datos de temperatura
            if temperatura is not None:
                ultimos_datos.append({
                    'nombre': nombre_sensor,
                    'valor': temperatura,
                    'timestamp': timestamp
                })
            
            # Agrega los datos de humedad
            if humedad is not None:
                if "Temperatura Interior" in nombre_sensor:
                    ultimos_datos.append({
                        'nombre': "Humedad Interior",
                        'valor': humedad,
                        'timestamp': timestamp
                    })
                elif "Temperatura Exterior" in nombre_sensor:
                    ultimos_datos.append({
                        'nombre': "Humedad Exterior",
                        'valor': humedad,
                        'timestamp': timestamp
                    })
                elif "Humedad de Suelo" in nombre_sensor:
                    ultimos_datos.append({
                        'nombre': nombre_sensor,
                        'valor': humedad,
                        'timestamp': timestamp
                    })
        
        ultimos_datos_df = pd.DataFrame(ultimos_datos)
        
        filas_a_eliminar = []
        for index, row in ultimos_datos_df.iterrows():
            nombre = row['nombre']
            valor = row['valor']
            if nombre == "Humedad de Suelo" and valor == 0.0:
                filas_a_eliminar.append(index)
            elif nombre == "Temperatura Agua" and valor == 0.0:
                filas_a_eliminar.append(index)
            elif nombre == "Temperatura Suelo" and valor == 0.0:
                filas_a_eliminar.append(index)

        return ultimos_datos_df.drop(filas_a_eliminar)

    def detectar_anomalia(self, modelos, umbrales, nombre, valor, timestamp):
        try:
            nuevo_dato = pd.DataFrame({
                'timestamp': [timestamp],
                'dato': [valor]
            })
            nuevo_dato['timestamp'] = pd.to_datetime(nuevo_dato['timestamp'])

            datos_entrenamiento = modelos[nombre].model.endog
            datos_completos = np.append(datos_entrenamiento, valor)

            modelo = ARIMA(datos_completos, order=modelos[nombre].model.order)
            modelo_fit = modelo.fit()

            try:
                prediccion = modelo_fit.predict(start=len(datos_completos) - 1, end=len(datos_completos) - 1)[0]
                print(f"Predicción para {nombre}: {prediccion}")
                # Verificar prediccion
                if np.isinf(prediccion) or np.isnan(prediccion):
                    prediccion = 0.0
            except Exception as e:
                print(f"Error al generar predicción: {e}")
                prediccion = 0.0

            residuo = valor - prediccion
            print(f"Residuo para {nombre}: {residuo}")
            # Verificar y reemplazar valores infinitos o NaN
            if np.isinf(residuo) or np.isnan(residuo):
                residuo = None  

            # Manejar valores None en el cálculo del valor absoluto
            if residuo is not None:
                try:
                    es_anomalia = abs(residuo) > umbrales[nombre]
                    residuo = float(residuo)
                except Exception as e:
                    print(f"Error al calcular anomalia o convertir residuo: {e}")
                    es_anomalia = False
                    residuo = None
            else:
                es_anomalia = False  

            return {"anomalia": bool(es_anomalia), "score": residuo}

        except Exception as e:
            return {"anomalia": False, "score": None, "error": str(e)}

    




