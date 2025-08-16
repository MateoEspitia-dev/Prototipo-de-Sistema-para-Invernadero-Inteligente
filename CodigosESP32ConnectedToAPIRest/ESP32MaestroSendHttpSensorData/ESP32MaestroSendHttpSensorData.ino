#include "DHT.h"
#include <WiFi.h>
#include <esp_now.h>
#include <HTTPClient.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <XPT2046_Touchscreen.h>
#include <ArduinoJson.h>

#define TFT_CS   5
#define TFT_DC   2
#define TFT_RST  14
#define TOUCH_CS 15 // Pin Chip Select del touch

// Datos de la red WiFi
const char* ssid = "Mateo";
const char* password = "13141314";
const char* serverUrl = "http://192.168.23.63:8000/api/sensor_data/";// Estos son las URL en pruebas locales en produccion se pondran las correspondientes segun el dominio
const char* secondServerUrl = "http://192.168.23.63:8000/api/detect_anomaly/";

// Estructura para datos recibidos por ESP-NOW
typedef struct DatosSensor {
  char id[10];       // Identificador del sensor
  float temperatura; // Temperatura
  float humedad;    // Humedad
} DatosSensor;

DatosSensor receivedData; // Datos recibidos
StaticJsonDocument<1024> jsonDocument;

String sensor_name = "temperature";
float sensor_value = 23.5;

// Pines y tipo del sensor DHT
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);
Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST); //inicializacion de la pantalla tft
// Pin del LED
const int ledPin = 13;

#define GAUGE_RADIUS 50    // Radio del gauge
#define GAUGE_X_TEMP 60    // Posición X del gauge de temperatura
#define GAUGE_Y_TEMP 120   // Posición Y del gauge de temperatura
#define GAUGE_X_HUM 180    // Posición X del gauge de humedad
#define GAUGE_Y_HUM 120    // Posición Y del gauge de humedad
#define MIN_TEMP 0         // Temperatura mínima esperada
#define MAX_TEMP 50        // Temperatura máxima esperada
#define MIN_HUM 0          // Humedad mínima esperada
#define MAX_HUM 100        // Humedad máxima esperada

float lastTemperature = -1; // Último valor de temperatura para evitar refrescos innecesarios
float lastHumidity = -1;    // Último valor de humedad para evitar refrescos innecesarios

XPT2046_Touchscreen ts(TOUCH_CS);

// Callback para recibir datos vía ESP-NOW
void onDataReceive(const esp_now_recv_info_t* info, const uint8_t* incomingData, int len) {
    Serial.println("Callback ejecutado: Datos recibidos");
    Serial.print("Datos recibidos desde: ");
    for (int i = 0; i < 6; i++) {
        Serial.printf("%02X:", info->src_addr[i]);
    }
    Serial.println();

    Serial.printf("Tamaño de datos recibidos: %d bytes\n", len);

    if (len == sizeof(DatosSensor)) {
        memcpy(&receivedData, incomingData, len);
        receivedData.id[sizeof(receivedData.id) - 1] = '\0';

        Serial.printf("ID del sensor: %s\n", receivedData.id);
        Serial.printf("Temperatura: %.2f °C\n", receivedData.temperatura);
        Serial.printf("Humedad: %.2f %%\n", receivedData.humedad);
    } else {
        Serial.println("Error: Tamaño de datos no coincide con la estructura.");
    }
    // Agregar los datos recibidos al JSON
        JsonObject sensor = jsonDocument.createNestedObject();
        sensor["id"] = receivedData.id;
        sensor["temperatura"] = receivedData.temperatura;
        sensor["humedad"] = receivedData.humedad;

        // Asignar nombres según el ID
        if (strcmp(receivedData.id, "DHT22_IN") == 0) {
            sensor["nombre"] = "Temperatura Exterior";
        } else if (strcmp(receivedData.id, "SOIL") == 0) {
            sensor["nombre"] = "Humedad de Suelo";
        } else if (strcmp(receivedData.id, "DS18B20") == 0) {
            sensor["nombre"] = "Temperatura Agua";
        } else if (strcmp(receivedData.id, "LM35") == 0) {
            sensor["nombre"] = "Temperatura Suelo";
        }
     else {
        Serial.println("Error: Tamaño de datos no coincide con la estructura.");
    }
}
// Función para enviar datos al servidor HTTP
void sendDataToServer() {
    WiFiClient client;
    HTTPClient http;

    http.begin(client, serverUrl); // Inicia la conexión
    http.addHeader("Content-Type", "application/json");

    // Serializar JSON
    String jsonString;
    serializeJson(jsonDocument, jsonString);

    // Enviar solicitud HTTP POST
    int httpResponseCode = http.POST(jsonString);

    // Manejar la respuesta
    if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.println("Respuesta del servidor: " + response);
    } else {
        Serial.printf("Error al enviar datos: %d\n", httpResponseCode);
    }

    http.end(); // Termina la conexión HTTP
    http.begin(client, secondServerUrl); // Inicia la conexión a la segunda URL
    http.addHeader("Content-Type", "application/json");

    // Enviar solicitud HTTP POST a la segunda URL
    httpResponseCode = http.POST(jsonString);

    // Manejar la respuesta de la segunda URL
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Respuesta del segundo servidor: " + response);
    } else {
     Serial.printf("Error al enviar datos al segundo servidor: %d\n", httpResponseCode);
  }

  http.end(); 
}

void setup() {
  // Iniciar el monitor serial
  Serial.begin(115200);

  // Conectar al WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");

   // Mostrar dirección MAC
  String macAddress = WiFi.macAddress();
  Serial.print("Dirección MAC del dispositivo: ");
  Serial.println(macAddress);

  // Inicializar ESP-NOW
  if (esp_now_init() == ESP_OK) {
    Serial.println("ESP-NOW inicializado correctamente.");
    esp_now_register_recv_cb(onDataReceive); // Registrar el callback para recibir datos
  } else {
    Serial.println("Error inicializando ESP-NOW.");
    return;
  }

  // Iniciar el sensor DHT
  dht.begin();

  // Configurar el pin del LED como salida
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW); // Asegurarse de que el LED esté apagado al inicio
  tft.begin();
  tft.setRotation(3); // Ajusta la rotación si es necesario
  tft.fillScreen(ILI9341_BLUE);

  tft.setTextSize(2);  
  tft.setTextColor(ILI9341_YELLOW);
  tft.setCursor(20, 20);
  tft.print("Temp. y Humedad");

  tft.setTextSize(2);
  tft.setCursor(GAUGE_X_TEMP - 35, GAUGE_Y_TEMP + GAUGE_RADIUS + 40);
  tft.print("Temp (C)");

  tft.setCursor(GAUGE_X_HUM - 35, GAUGE_Y_HUM + GAUGE_RADIUS + 40);
  tft.print("Humedad (%)");
}

void loop() {
  delay(2000);
  // Leer la humedad
  double humedad = dht.readHumidity();
  // Leer la temperatura en grados Celsius
  float temperatura = dht.readTemperature();
  //para el json
  float temperatura_local = dht.readTemperature();
  float humedad_local = dht.readHumidity();

  if (!isnan(temperatura_local) && !isnan(humedad_local)) {
        JsonObject sensorLocal = jsonDocument.createNestedObject();
        sensorLocal["id"] = "DHT_LOCAL";
        sensorLocal["nombre"] = "Temperatura Interior";
        sensorLocal["temperatura"] = temperatura_local;
        sensorLocal["humedad"] = humedad_local;

        Serial.printf("Temperatura Interior: %.2f °C\n", temperatura_local);
        Serial.printf("Humedad Interior: %.2f %%\n", humedad_local);
    } else {
        Serial.println("Error al leer los datos locales del DHT.");
    }

    // Enviar los datos al servidor
    sendDataToServer();

    // Limpiar el JSON para la siguiente iteración
    jsonDocument.clear();
  // Comprobar si la lectura es válida
  if (isnan(humedad) || isnan(temperatura)) {
    Serial.println("Error al leer del sensor DHT!");
    return;
  }

  // Imprimir los resultados en el monitor serial
  Serial.print("Humedad: ");
  Serial.print(humedad);
  Serial.println(" %");

  Serial.print("Temperatura: ");
  Serial.print(temperatura);
  Serial.println(" °C");

  // Controlar el LED según la temperatura
  if (temperatura > 25.0) {
    digitalWrite(ledPin, HIGH); // Encender el LED si la temperatura es mayor a 25°C
  } else {
    digitalWrite(ledPin, LOW);  // Apagar el LED si la temperatura es menor o igual a 25°C
  }

 if (temperatura != lastTemperature) {
    lastTemperature = temperatura;
    drawGauge(GAUGE_X_TEMP, GAUGE_Y_TEMP, GAUGE_RADIUS, temperatura, MIN_TEMP, MAX_TEMP, ILI9341_RED);
  }

  // Dibuja el gauge de humedad si cambia el valor
  if (humedad != lastHumidity) {
    lastHumidity = humedad;
    drawGauge(GAUGE_X_HUM, GAUGE_Y_HUM, GAUGE_RADIUS, humedad, MIN_HUM, MAX_HUM, ILI9341_WHITE);
  }
}
// Función para dibujar un gauge circular con color de fondo en el recorrido
void drawGauge(int x, int y, int radius, float value, float minVal, float maxVal, uint16_t color) {
  // Calcula el ángulo de la aguja en función del valor
  float angle = map(value, minVal, maxVal, -150, 150); // Rango de ángulos para el gauge
  angle = angle * PI / 180; // Convierte a radianes

  // Dibuja el recorrido del gauge en color de fondo
  for (float a = -150; a < map(value, minVal, maxVal, -150, 150); a += 1) {
    float rad = a * PI / 180;
    int xEnd = x + radius * cos(rad);
    int yEnd = y + radius * sin(rad);
    tft.drawLine(x, y, xEnd, yEnd, color);
  }

  // Borra el área central para mostrar el valor
  tft.fillCircle(x, y, radius - 10, ILI9341_BLACK);

  // Dibuja el contorno del gauge
  tft.drawCircle(x, y, radius, ILI9341_WHITE);

  // Dibuja la aguja
  int needleX = x + (radius - 5) * cos(angle);
  int needleY = y + (radius - 5) * sin(angle);
  tft.drawLine(x, y, needleX, needleY, ILI9341_YELLOW);

  // Muestra el valor actual en el centro del gauge, centrado
  tft.setTextColor(ILI9341_WHITE, ILI9341_BLACK);
  tft.setTextSize(2);
  String valueText = String(value, 1);
  int16_t textX = x - (valueText.length() * 6); // Ajusta para centrar el texto
  int16_t textY = y - 8;
  tft.setCursor(textX, textY);
  tft.print(valueText);
  tft.print(" ");
}