import pandas as pd
import numpy as np
from scipy import stats
# Limpieza y preparación de datos de sensores para el entrenamiento de modelos ARIMA que se pudo haber depurado desde la app
# Rutas de los archivos CSV
ruta_archivo_entrada = r'C:\Users\Mateo Espitia\Development\Proyectos\DjangoRest\datos_sensores.csv'
ruta_archivo_salida = r'C:\Users\Mateo Espitia\Development\Proyectos\DjangoRest\datos_sensores_depurado.csv'

def limpiar_y_preparar_csv(ruta_entrada, ruta_salida):
    try:
        # Cargar datos
        df = pd.read_csv(ruta_entrada, parse_dates=['timestamp'])
        
        # Eliminar duplicados
        df = df.drop_duplicates()
        
        # Convertir valores a float (manejando errores)
        df['humedad'] = pd.to_numeric(df['humedad'], errors='coerce')
        df['temperatura'] = pd.to_numeric(df['temperatura'], errors='coerce')
        
        # Manejo de valores nulos (rellenar con la media de cada sensor)
        df['humedad'].fillna(df.groupby('nombre')['humedad'].transform('mean'), inplace=True)
        df['temperatura'].fillna(df.groupby('nombre')['temperatura'].transform('mean'), inplace=True)
        
        # Identificar valores atípicos usando Z-score
        for variable in ['humedad', 'temperatura']:
            z_scores = np.abs(stats.zscore(df[variable]))
            df = df[z_scores < 3]  # Filtrar valores fuera de 3 desviaciones estándar
        
        # Reorganizar el formato de datos
        datos_transformados = []
        for index, row in df.iterrows():
            for propiedad in ['temperatura', 'humedad']:
                valor = row[propiedad]
                if pd.notna(valor):
                    nombre = row['nombre']
                    if propiedad == 'humedad' and 'Temperatura' in nombre:
                        nombre = nombre.replace('Temperatura', 'Humedad')
                    elif propiedad == 'temperatura' and 'Humedad' in nombre:
                        nombre = nombre.replace('Humedad', 'Temperatura')
                    
                    datos_transformados.append({
                        'timestamp': row['timestamp'],
                        'nombre': nombre,
                        'propiedad': propiedad,
                        'dato': valor
                    })
        
        df_transformado = pd.DataFrame(datos_transformados)
        df_transformado.to_csv(ruta_salida, index=False)
        print(f"Archivo limpio y guardado en: {ruta_salida}")
    
    except Exception as e:
        print(f"Error en la limpieza de datos: {e}")

# Ejecutar la función
limpiar_y_preparar_csv(ruta_archivo_entrada, ruta_archivo_salida)
