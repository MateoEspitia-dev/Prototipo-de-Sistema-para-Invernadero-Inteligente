from django.urls import path
from .views import SensorDataCreateAPIView, DetectAnomalyAPIView

urlpatterns = [
    path('sensor_data/', SensorDataCreateAPIView.as_view(), name='sensor-data'),
    path('detect_anomaly/', DetectAnomalyAPIView.as_view(), name='detect-anomaly'),
]

