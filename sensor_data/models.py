from django.db import models
from django.utils import timezone

class SensorData(models.Model):
    sensor_id = models.CharField(max_length=50)  # Identificador único del sensor
    nombre = models.CharField(max_length=100)  # Nombre del sensor
    temperatura = models.FloatField(null=True, blank=True)  # Temperatura
    humedad = models.FloatField(null=True, blank=True)  # Humedad
    timestamp = models.DateTimeField(default=timezone.now)  # Fecha y hora de recepción

    def __str__(self):
        return f"{self.nombre} ({self.sensor_id}) - Temp: {self.temperatura}°C, Hum: {self.humedad}%"
