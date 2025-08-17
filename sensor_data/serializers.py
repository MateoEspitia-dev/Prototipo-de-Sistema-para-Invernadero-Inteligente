from rest_framework import serializers
from .models import SensorData

class SensorDataSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='sensor_id')

    class Meta:
        model = SensorData
        fields = ['id', 'nombre', 'temperatura', 'humedad', 'timestamp']
