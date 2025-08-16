# Prototipo de Sistema para Invernadero Inteligente
Este proyecto es un prototipo de bajo costo para la automatización y monitoreo de invernaderos, utilizando ESP32, un backend con Django REST Framework y un frontend con React. El sistema no solo recopila datos en tiempo real, sino que también utiliza un modelo de Machine Learning (ARIMA) para detectar anomalías en las mediciones de los sensores.

Arquitectura del Sistema
El sistema se divide en cuatro componentes principales que trabajan de forma integrada:

Hardware (Nodos Sensores): Una red de dispositivos ESP32 en una topología Maestro-Esclavo.

Backend (API REST): Un servidor desarrollado en Django que recibe, procesa, almacena y sirve los datos.

Modelo de IA: Un modelo ARIMA entrenado para predecir y detectar anomalías en los datos de los sensores.

Frontend (Dashboard): Una aplicación web desarrollada en React para visualizar los datos, predicciones y alertas.

Flujo de Datos
Nodos Esclavos (ESP32): Leen los datos de los sensores (humedad, temperatura, etc.) y los envían al nodo Maestro a través del protocolo ESP-NOW para un bajo consumo energético.

Nodo Maestro (ESP32): Recopila los datos de todos los esclavos, los empaqueta en formato JSON y los envía vía Wi-Fi al backend.

Backend (Django REST):

La app sensor_data recibe el JSON, lo valida y almacena los datos en una base de datos PostgreSQL.

Expone un endpoint para que el frontend pueda solicitar los datos históricos y en tiempo real.

Genera un archivo .csv con los datos históricos.

Procesamiento y Modelo de IA:

Un script en Python limpia y procesa el .csv para hacerlo apto para el entrenamiento.

En Google Colab, se entrena un modelo ARIMA con estos datos para aprender el comportamiento normal de las variables del invernadero.

El modelo entrenado se exporta para ser utilizado por el backend.

Detección de Anomalías:

La app detect_anomaly en Django carga el modelo ARIMA.

Toma los datos más recientes que llegan al backend y los analiza con el modelo en tiempo real para identificar mediciones anómalas.

Expone un endpoint con las posibles anomalías detectadas.

Frontend (React):

Consume la API de sensor_data para mostrar gráficos históricos y en tiempo real con Recharts.

Consume la API de detect_anomaly para mostrar alertas al usuario.

Integra la API de OpenWeatherMap para mostrar un pronóstico del clima y ayudar a planificar tareas como el riego y la fertirrigación.

Componentes y Tecnologías
Hardware
Microcontrolador: ESP32

Comunicación: ESP-NOW (Esclavo-Maestro), Wi-Fi (Maestro-Backend)

Sensores: Temperatura, humedad ambiental, humedad del suelo, etc.

Lenguaje: C++ (Arduino Framework)

Backend
Framework: Django, Django REST Framework

Base de Datos: PostgreSQL

Apps:

sensor_data: Gestión y almacenamiento de datos.

detect_anomaly: Análisis en tiempo real con el modelo de IA.

Lenguaje: Python

Machine Learning
Modelo: ARIMA (Autoregressive Integrated Moving Average)

Librerías: Pandas, Scikit-learn, Statsmodels

Entorno: Google Colab / Jupyter Notebook

Frontend
Framework: React (con Vite)

Librerías:

Recharts: Para visualización de datos.

Axios: Para peticiones a la API.

Lenguajes: JavaScript, HTML, CSS

Funcionalidades Clave
Monitoreo en Tiempo Real: Visualización de datos de múltiples sensores distribuidos en el invernadero.

Comunicación Eficiente: Uso de ESP-NOW para una red de sensores de bajo consumo.

Detección de Anomalías: Alertas automáticas cuando una variable (ej. exceso o falta de humedad) se sale de los parámetros normales predichos por el modelo de IA.

Predicción Climática: Integración con OpenWeatherMap para obtener pronósticos y optimizar las tareas agrícolas.

Historial de Datos: Almacenamiento persistente de todos los datos para análisis a largo plazo.

Dashboard Intuitivo: Interfaz de usuario clara para una fácil interpretación de los datos.
