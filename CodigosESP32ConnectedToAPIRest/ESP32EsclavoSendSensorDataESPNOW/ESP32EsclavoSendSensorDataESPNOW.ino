#include <WiFi.h>
#include <esp_now.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <DHT_U.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <WiFi.h>

// Dirección MAC del maestro
uint8_t masterAddress[] = {0xA4, 0xCF, 0x12, 0x05, 0xDB, 0xA8};

//Red wifi
const char* ssid = "Mateo";
const char* password = "13141314";

// Estructura de datos que se enviará a la API
typedef struct DatosSensor {
  char id[10];       // ID único del sensor
  float temperatura; // Temperatura
  float humedad;     // Humedad
} DatosSensor;

DatosSensor sensorData; // Datos que se enviarán

// Configuración de pines para DHT22 (interior)
#define DHTPIN_IN 15  // Pin del DHT22 (interior)

// Pin para el sensor de humedad de suelo (Flying-Fish)
#define SOIL_SENSOR_PIN 34  // Pin analógico para el sensor de humedad de suelo

// Pines para los LEDs
#define LED_WHITE_PIN 5  // Pin digital para el LED blanco (interior)
#define LED_GREEN_PIN 13  // Pin digital para el LED verde (suelo)
#define LED_YELLOW_PIN 2  // Pin digital para el LED amarillo (LM35)
#define LED_WATER_PIN 14  // Pin digital para el LED del agua (DS18B20)

// Configuración de pines para el LM35
#define LM35_PIN 35  // Pin analógico donde está conectado el LM35

// Configuración del pin y OneWire para el DS18B20
#define ONE_WIRE_BUS 21  // Pin donde está conectado el DS18B20

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature ds18b20(&oneWire);  // Comunicación con el sensor DS18B20

// Definir tipos de sensores
#define DHTTYPE_IN DHT22  // DHT22 para interior

DHT dht_in(DHTPIN_IN, DHTTYPE_IN);  // DHT22 interior

void setup() {
  
  Serial.begin(115200);
  delay(1000);

   // Conectar al WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");
  
  // Inicializar ESP-NOW
  if (esp_now_init() == ESP_OK) {
    Serial.println("ESP-NOW inicializado correctamente");
  } else {
    Serial.println("Error inicializando ESP-NOW");
    return;
  }

  // Configurar Peer
  esp_now_peer_info_t peerInfo;
  memset(&peerInfo, 0, sizeof(peerInfo));  // Limpiar la estructura
  memcpy(peerInfo.peer_addr, masterAddress, 6); // Configurar dirección MAC del peer
  peerInfo.channel = 0; // Canal debe coincidir con el WiFi
  peerInfo.encrypt = false;

  // elimina el peer si ya existe
  esp_now_del_peer(masterAddress);

  // Agregar Peer
  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Error añadiendo peer");
  } else {
    Serial.println("Peer añadido correctamente");
  }

  // Mostrar dirección MAC
  String macAddress = WiFi.macAddress();
  Serial.print("Dirección MAC del dispositivo: ");
  Serial.println(macAddress);

  // Inicializar sensores
  dht_in.begin();
  ds18b20.begin();

  // Configurar pines de los LEDs como salida
  pinMode(LED_WHITE_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_YELLOW_PIN, OUTPUT);
  pinMode(LED_WATER_PIN, OUTPUT);

  // Apagar todos los LEDs al inicio
  digitalWrite(LED_WHITE_PIN, LOW);
  digitalWrite(LED_GREEN_PIN, LOW);
  digitalWrite(LED_YELLOW_PIN, LOW);
  digitalWrite(LED_WATER_PIN, LOW);
}

void enviarDatos() {
  // Leer los datos de los sensores
  float temperatura_dht = dht_in.readTemperature();
  float humedad_dht = dht_in.readHumidity();
  int humedad_suelo = analogRead(SOIL_SENSOR_PIN);
  ds18b20.requestTemperatures();
  float temperatura_agua = ds18b20.getTempCByIndex(0);
  int lm35_value = analogRead(LM35_PIN);
  float temperatura_lm35 = lm35_value * (3.3 / 4095.0) * 100.0;

  // Imprimir lecturas de los sensores
  Serial.println("=== Lecturas de sensores ===");
  Serial.printf("DHT22 - Temperatura: %.2f °C, Humedad: %.2f %%\n", temperatura_dht, humedad_dht);
  Serial.printf("Humedad Suelo: %d\n", map(humedad_suelo, 0, 4095, 100, 0));
  Serial.printf("DS18B20 - Temperatura Agua: %.2f °C\n", temperatura_agua);
  Serial.printf("LM35 - Temperatura: %.2f °C\n", temperatura_lm35);

  // Enviar datos de DHT22
  strcpy(sensorData.id, "DHT22_IN");
  sensorData.temperatura = temperatura_dht;
  sensorData.humedad = humedad_dht;
  if (esp_now_send(masterAddress, (uint8_t *)&sensorData, sizeof(sensorData)) == ESP_OK) {
    Serial.println("DHT22 datos enviados correctamente");
  } else {
    Serial.println("Error enviando datos DHT22");
  }

  // Enviar datos de Humedad Suelo
  strcpy(sensorData.id, "SOIL");
  sensorData.temperatura = 0; // Sin temperatura
  sensorData.humedad = map(humedad_suelo, 0, 4095, 100, 0);
  if (esp_now_send(masterAddress, (uint8_t *)&sensorData, sizeof(sensorData)) == ESP_OK) {
    Serial.println("Humedad Suelo datos enviados correctamente");
  } else {
    Serial.println("Error enviando datos Humedad Suelo");
  }

  // Enviar datos de DS18B20
  strcpy(sensorData.id, "DS18B20");
  sensorData.temperatura = temperatura_agua;
  sensorData.humedad = 0; // Sin humedad
  if (esp_now_send(masterAddress, (uint8_t *)&sensorData, sizeof(sensorData)) == ESP_OK) {
    Serial.println("DS18B20 datos enviados correctamente");
  } else {
    Serial.println("Error enviando datos DS18B20");
  }

  // Enviar datos de LM35
  strcpy(sensorData.id, "LM35");
  sensorData.temperatura = temperatura_lm35;
  sensorData.humedad = 0; // Sin humedad
  if (esp_now_send(masterAddress, (uint8_t *)&sensorData, sizeof(sensorData)) == ESP_OK) {
    Serial.println("LM35 datos enviados correctamente");
  } else {
    Serial.println("Error enviando datos LM35");
  }
  
  Serial.printf("Enviando ID: %s, Temp: %.2f, Hum: %.2f\n", sensorData.id, sensorData.temperatura, sensorData.humedad);
  Serial.print("Datos enviados (binario): ");
  uint8_t* dataPtr = (uint8_t*)&sensorData;
  for (size_t i = 0; i < sizeof(sensorData); i++) {
    Serial.printf("%02X ", dataPtr[i]);
  }
  Serial.println();
}

void loop() {
  enviarDatos();
  delay(5000); // Enviar cada 5 segundos

  // Controlar LEDs según los valores de los sensores
  float temperatura_dht = dht_in.readTemperature();
  digitalWrite(LED_WHITE_PIN, temperatura_dht > 20 ? HIGH : LOW);

  int humedad_suelo = analogRead(SOIL_SENSOR_PIN);
  digitalWrite(LED_GREEN_PIN, map(humedad_suelo, 0, 4095, 100, 0) < 50 ? HIGH : LOW);

  int lm35_value = analogRead(LM35_PIN);
  float temperatura_lm35 = lm35_value * (3.3 / 4095.0) * 100.0;
  digitalWrite(LED_YELLOW_PIN, temperatura_lm35 > 5 ? HIGH : LOW);

  ds18b20.requestTemperatures();
  float temperatura_agua = ds18b20.getTempCByIndex(0);
  digitalWrite(LED_WATER_PIN, temperatura_agua < 35 ? HIGH : LOW);
}
