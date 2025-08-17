# -*- coding: utf-8 -*-
# Entrenamiento del modelo ARIMA para detección de anomalías
import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
import joblib
from google.colab import drive
import matplotlib.pyplot as plt

drive.mount('/content/drive')

read_csv = '/content/drive/MyDrive/datos_sensores_depurado.csv' 

datos = pd.read_csv('/content/drive/MyDrive/datos_sensores_depurado.csv')

# 2. Preprocesamiento
datos['timestamp'] = pd.to_datetime(datos['timestamp'])
datos = datos.sort_values(['nombre', 'timestamp'])

modelos = {}
# scalers = {}
umbrales = {}
variables = ["Temperatura Interior", "Humedad Interior", "Humedad Exterior", "Temperatura Exterior",
             "Temperatura Suelo", "Humedad de Suelo", "Temperatura Agua"]

for nombre in variables:
    datos_nombre = datos[datos['nombre'] == nombre]
    print("Datos originales:")
    print(datos_nombre.head())

    # Agregar por timestamp (o intervalos) para cada nombre
    datos_agregados = datos_nombre.groupby(pd.Grouper(key='timestamp', freq='10min'))['dato'].mean().reset_index()
    print("\nDatos agregados:")
    print(datos_agregados.head())

  # Identificación de parámetros ARIMA (ejemplo: p=1, d=1, q=1)
    p, d, q = 1, 1, 1

    # Entrenamiento del modelo ARIMA
    modelo = ARIMA(datos_agregados['dato'], order=(p, d, q))
    modelo_fit = modelo.fit()

    # Predicción
    predicciones = modelo_fit.predict()

    # Residuos
    residuos = datos_agregados['dato'] - predicciones

    # Ajuste de umbrales por variable
    if nombre == "Temperatura Interior":
        umbral = 5  # Umbral ajustado
    elif nombre == "Humedad Interior":
        umbral = 15  # Umbral ajustado
    elif nombre == "Humedad Exterior":
        umbral = 7.4  # Umbral ajustado
    elif nombre == "Temperatura Exterior":
        umbral = 5  # Umbral ajustado
    elif nombre == "Humedad de Suelo":
        umbral = 50  # Umbral ajustado
    elif nombre == "Temperatura Agua":
        umbral = 6  # Umbral ajustado
    elif nombre == "Temperatura Suelo":
        umbral = 8.5  # Umbral ajustado
    else:
        umbral = 3 * np.std(residuos)  

    # Anomalías
    anomalias = residuos[abs(residuos) > umbral]

    print(f"\nAnomalías detectadas para {nombre}:")
    print(anomalias)

    # Visualización de resultados
    plt.plot(datos_agregados['dato'], label='Datos reales')
    plt.plot(predicciones, label='Predicciones')
    plt.scatter(anomalias.index, datos_agregados['dato'][anomalias.index], color='red', label='Anomalías')
    plt.legend()
    plt.title(f"Detección de anomalías con ARIMA para {nombre}")
    plt.show()

    umbrales[nombre] = umbral
    modelos[nombre] = modelo_fit

# Guardado del Modelo y el Scaler
joblib.dump(modelos, "/content/drive/MyDrive/saved_model/modelo_anomalias.pkl")
joblib.dump(modelos, "/content/drive/MyDrive/saved_model/modelo_anomalias_savedmodel")
joblib.dump(umbrales, "/content/drive/MyDrive/saved_model/umbrales.pkl")
joblib.dump(umbrales, "/content/drive/MyDrive/saved_model/umbrales_savedmodel")

print("Modelo y scaler guardados exitosamente.")


#Código para detectar anomalías con el modelo ARIMA entrenado con prueba
def detectar_anomalia(nombre, valor, timestamp):
    """
    Detecta anomalías en un nuevo dato utilizando el modelo ARIMA previamente entrenado.

    Args:
        nombre (str): Nombre de la variable (ej. "Temperatura Interior").
        valor (float): Valor del dato.
        timestamp (str): Marca de tiempo del dato (ej. "2025-02-12T16:25:00").

    Returns:
        dict: Diccionario con la detección de anomalía y el score (residuo).
    """
    if nombre not in modelos:
        return {"error": "Variable no soportada"}

    # Crear un DataFrame con el nuevo dato
    nuevo_dato = pd.DataFrame({
        'timestamp': [timestamp],
        'dato': [valor]
    })

    # Convertir timestamp a datetime
    nuevo_dato['timestamp'] = pd.to_datetime(nuevo_dato['timestamp'])

    # Agregar el nuevo dato al final de los datos de entrenamiento
    datos_entrenamiento = modelos[nombre].model.endog
    datos_completos = np.append(datos_entrenamiento, valor)

    # Realizar predicción con el modelo ARIMA
    modelo = ARIMA(datos_completos, order=modelos[nombre].model.order)
    modelo_fit = modelo.fit()
    prediccion = modelo_fit.predict(start=len(datos_completos) - 1, end=len(datos_completos) - 1)[0]

    # Calcular el residuo
    residuo = valor - prediccion

    # Detectar anomalía
    umbral = umbrales[nombre]
    es_anomalia = abs(residuo) > umbral

    return {"anomalia": bool(es_anomalia), "score": float(residuo)}

# Ejemplo de uso
resultado = detectar_anomalia("Temperatura Exterior", 10, "2025-02-12T16:25:00")
print(resultado)

"""
# Experimentacion para el desarrollo del Modelo de deteccion de Anomalías


from google.colab import drive
import pandas as pd

# Montar Google Drive
drive.mount('/content/drive')

# Cargar el CSV
ruta_csv = '/content/drive/MyDrive/datos_sensores.csv'  # Ajusta la ruta
datos = pd.read_csv(ruta_csv)

# Filtrar datos irrelevantes
datos_temperatura = datos[datos['nombre'].str.contains('Temperatura')]
datos_humedad = datos[datos['nombre'].str.contains('Humedad')]

# Mostrar los datos
print(datos_temperatura.head())
print(datos_humedad.head())

from google.colab import drive
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Model, load_model
from tensorflow.keras.layers import Input, Dense
import numpy as np
import joblib
import tensorflow as tf

# Montar Google Drive
drive.mount('/content/drive')

# Cargar el CSV
ruta_csv = '/content/drive/MyDrive/datos_sensores.csv'
datos = pd.read_csv(ruta_csv)

# Transformar los datos al formato "vertical"
datos_transformados = []
for index, row in datos.iterrows():
    for propiedad in ['temperatura', 'humedad']:
        valor = row[propiedad]
        if pd.notna(valor):  # Ignorar valores NaN
            datos_transformados.append({
                'nombre': row['nombre'],
                'propiedad': propiedad,
                'dato': valor
            })
datos_transformados = pd.DataFrame(datos_transformados)

# Filtrar datos relevantes (después de la transformación)
datos_relevantes = datos_transformados[
    (datos_transformados['nombre'].str.contains('Temperatura') & ~datos_transformados['nombre'].str.contains('Humedad de Suelo')) |
    (datos_transformados['nombre'].str.contains('Humedad') & ~datos_transformados['nombre'].str.contains('Temperatura Agua') & ~datos_transformados['nombre'].str.contains('Temperatura Suelo'))
]

# Preparar los datos para el autoencoder
data = datos_relevantes.groupby(['nombre', 'propiedad'])['dato'].mean().unstack().values
data = data.reshape(data.shape[0], -1)  # Aplanar los datos

# Normalizar los datos
scaler = MinMaxScaler()
data_normalized = scaler.fit_transform(data)

# Guardar el scaler
joblib.dump(scaler, '/content/drive/MyDrive/scaler_transformado.pkl')

# Definir la estructura del autoencoder
input_dim = data_normalized.shape[1]  # Dimensión de entrada
input_layer = Input(shape=(input_dim,))
encoded = Dense(8, activation='relu')(input_layer)  # Ajusta la dimensión de la capa intermedia
decoded = Dense(input_dim, activation='sigmoid')(encoded)  # Debe coincidir con la entrada
autoencoder = Model(input_layer, decoded)

# Compilar el autoencoder
autoencoder.compile(optimizer='adam', loss='mse')

# Entrenar el autoencoder
autoencoder.fit(data_normalized, data_normalized, epochs=50, batch_size=1, shuffle=True)

# Guardar el modelo como SavedModel
tf.saved_model.save(autoencoder, '/content/drive/MyDrive/autoencoder_transformado_savedmodel')

# Cargar el scaler y el modelo
scaler = joblib.load('/content/drive/MyDrive/scaler_transformado.pkl')
autoencoder = tf.saved_model.load('/content/drive/MyDrive/autoencoder_transformado_savedmodel')

# Ejemplo de uso (detección de anomalías)
nuevos_datos = pd.DataFrame([
    {'nombre': 'Temperatura Interior', 'temperatura': 25, 'humedad': 45},
    {'nombre': 'Temperatura Exterior', 'temperatura': 23, 'humedad': 50},
    {'nombre': 'Humedad de Suelo', 'humedad': 12},
    {'nombre': 'Temperatura Agua', 'temperatura': 22},
    {'nombre': 'Temperatura Suelo', 'temperatura': 19}
])

nuevos_datos_transformados = []
for index, row in nuevos_datos.iterrows():
    for propiedad in ['temperatura', 'humedad']:
        valor = row[propiedad]
        if pd.notna(valor):  # Ignorar valores NaN
            nuevos_datos_transformados.append({
                'nombre': row['nombre'],
                'propiedad': propiedad,
                'dato': valor
            })
nuevos_datos_transformados = pd.DataFrame(nuevos_datos_transformados)

nuevos_datos_relevantes = nuevos_datos_transformados[
    (nuevos_datos_transformados['nombre'].str.contains('Temperatura') & ~nuevos_datos_transformados['nombre'].str.contains('Humedad de Suelo')) |
    (nuevos_datos_transformados['nombre'].str.contains('Humedad') & ~nuevos_datos_transformados['nombre'].str.contains('Temperatura Agua') & ~nuevos_datos_transformados['nombre'].str.contains('Temperatura Suelo'))
]
print("nuevos_datos_transformados:", nuevos_datos_transformados)

nuevos_datos_para_predecir = nuevos_datos_relevantes.groupby(['nombre', 'propiedad'])['dato'].mean().unstack()

# Alinear los DataFrames utilizando 'nombre' como índice
nuevos_datos_relevantes = nuevos_datos_relevantes.set_index('nombre')

# Encuentra las filas comunes basandote en el índice 'nombre'
common_indices = nuevos_datos_para_predecir.index.intersection(nuevos_datos_relevantes.index)

nuevos_datos_relevantes = nuevos_datos_relevantes.loc[common_indices].reset_index()
nuevos_datos_para_predecir = nuevos_datos_para_predecir.loc[common_indices].values

nuevos_datos_para_predecir = nuevos_datos_para_predecir.reshape(nuevos_datos_para_predecir.shape[0], -1)

print("nuevos_datos_relevantes:", nuevos_datos_relevantes)
print("nuevos_datos_para_predecir:", nuevos_datos_para_predecir)
print("common_indices:", common_indices)
print("Shape of nuevos_datos_para_predecir:", nuevos_datos_para_predecir.shape)


nuevos_datos_normalizados = scaler.transform(nuevos_datos_para_predecir)

output = autoencoder.signatures['serving_default'](inputs=tf.constant(nuevos_datos_normalizados, dtype=tf.float32))
reconstrucciones = output['output_0'].numpy()

errores = np.mean(np.abs(nuevos_datos_normalizados - reconstrucciones), axis=1)

umbral = 0.1  # Ajusta este valor según tus datos
anomalias = errores > umbral

print("Anomalías detectadas:")
anomalias_list = anomalias.tolist()  # Convert to a standard Python list
print(len(anomalias_list))
print(len(nuevos_datos_relevantes))
print(nuevos_datos_relevantes)
print(anomalias)


for i, (index, row) in enumerate(nuevos_datos_relevantes.iterrows()):
    print(f"{row['nombre']}: {anomalias_list[i]}")

print("Datos originales:", nuevos_datos_relevantes)
print("Datos normalizados:", nuevos_datos_normalizados)
print("Reconstrucciones:", reconstrucciones)
print("Errores de reconstrucción:", errores)
print("Umbral:", umbral)

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
import joblib
from google.colab import drive
import matplotlib.pyplot as plt

drive.mount('/content/drive')

read_csv = '/content/drive/MyDrive/datos_sensores_depurado.csv'  # Reemplaza con la ruta real

datos = pd.read_csv('/content/drive/MyDrive/datos_sensores_depurado.csv')

# 2. Preprocesamiento
datos['timestamp'] = pd.to_datetime(datos['timestamp'])  # Convierte a datetime
datos = datos.sort_values(['nombre', 'timestamp'])  # Ordena por nombre y tiempo

modelos = {}
scalers = {}
umbrales = {}
# Variables a considerar
variables = ["Temperatura Interior", "Humedad Interior", "Humedad Exterior", "Temperatura Exterior",
              "Temperatura de Suelo", "Humedad de Suelo", "Temperatura Agua"]

for nombre in variables:
    datos_nombre = datos[datos['nombre'] == nombre]
    print("Datos originales:")
    print(datos_nombre.head())

    # Agregar por timestamp (o intervalos) para cada nombre
    datos_agregados = datos_nombre.groupby(pd.Grouper(key='timestamp', freq='h'))['dato'].mean().reset_index()
    print("\nDatos agregados:")
    print(datos_agregados.head())

    # 2. Ingeniería de Características
    datos_agregados['desviacion_estandar'] = datos_agregados['dato'].rolling(window=3, min_periods=1).std()
    print("\nDatos con desviación estándar:")
    print(datos_agregados.head())
    print("\nValores NaN después de la ingeniería de características:")
    print(datos_agregados.isnull().sum())  # Imprime la cantidad de NaN por columna

    datos_agregados = datos_agregados.dropna()
    print("\nDatos sin NaN:")
    print(datos_agregados.head())

    # 3. Escalado
    scaler = StandardScaler()
    datos_escalados = scaler.fit_transform(datos_agregados[['dato', 'desviacion_estandar']])
    print("\nDatos escalados:")
    print(datos_escalados[:5])  # Imprime solo las primeras f

    # 4. Entrenamiento del Modelo
    modelo = IsolationForest(contamination=0.2, random_state=42)  # Ajusta la contaminación
    modelo.fit(datos_escalados)

    # Calcular el umbral de anomalía (percentil 95 de los scores)
    scores = modelo.decision_function(datos_escalados)
    print("\nDistribución de scores:")
    plt.hist(scores, bins=20)  # Grafica un histograma de los scores
    plt.title(f"Histograma de Scores para {nombre}")
    plt.show()
    umbral = np.percentile(scores, 1)  # Ajusta el percentil según tus necesidades
    print(f"\nUmbral de anomalía: {umbral}")
    umbrales[nombre] = umbral
    umbrales[nombre] = umbral

    modelos[nombre] = modelo
    scalers[nombre] = scaler

# 4. Guardado del Modelo y el Scaler
joblib.dump(modelo, "/content/drive/MyDrive/saved_model/modelo_anomalias.pkl")
joblib.dump(modelo, "/content/drive/MyDrive/saved_model/modelo_anomalias_savedmodel")
joblib.dump(scaler, "/content/drive/MyDrive/saved_model/scaler.pkl")
joblib.dump(scaler, "/content/drive/MyDrive/saved_model/scaler_savedmodel")
joblib.dump(umbrales, "/content/drive/MyDrive/saved_model/umbrales.pkl")
joblib.dump(umbrales, "/content/drive/MyDrive/saved_model/umbrales_savedmodel")
print("Modelo y scaler guardados exitosamente.")

import joblib
import numpy as np

def detectar_anomalia(nombre, valor, timestamp):
    if nombre not in modelos:
        return {"error": "Variable no soportada"}

    # Crear un DataFrame con el nuevo dato
    nuevo_dato = pd.DataFrame({
        'timestamp': [timestamp],
        'dato': [valor]
    })
    nuevo_dato['timestamp'] = pd.to_datetime(nuevo_dato['timestamp'])
    # Calcular características adicionales
    nuevo_dato['desviacion_estandar'] = nuevo_dato['dato'].rolling(window=3, min_periods=1).std()

    # Escalar el dato
    dato_escalado = scalers[nombre].transform(nuevo_dato[['dato', 'desviacion_estandar']])

    # Predecir anomalía
    score = modelos[nombre].decision_function(dato_escalado)
    es_anomalia = score < umbrales[nombre]

    return {"anomalia": bool(es_anomalia), "score": float(score)}

resultado = detectar_anomalia("Temperatura Interior", 100.0, "2025-02-12T16:25:00")
print(resultado)
"""