import React, { useState, useEffect } from 'react';
import RadarChartComponent from './RadarChartComponent';

const DataFetcher = () => {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("https://pmi.mateedev.com/api/sensor_data/");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Obtener los IDs únicos de los sensores
        const sensorIds = [...new Set(data.map(item => item.id))];

        // Filtrar los últimos datos de cada sensor
        const lastData = sensorIds.map(id => {
          const sensorData = data.filter(item => item.id === id);
          return sensorData[sensorData.length - 1]; // Obtener el último elemento
        });

        // Reorganizar los datos para el RadarChartComponent
        const reorganizedData = [
          {
            subject: "Temperatura Exterior",
            A: lastData.find(item => item.id === "DHT22_IN")?.temperatura || 0,
          },
          {
            subject: "Humedad Exterior",
            A: lastData.find(item => item.id === "DHT22_IN")?.humedad || 0,
          },
          {
            subject: "Humedad de Suelo",
            A: lastData.find(item => item.id === "SOIL")?.humedad || 0,
          },
          {
            subject: "Temperatura Agua",
            A: lastData.find(item => item.id === "DS18B20")?.temperatura || 0,
          },
          {
            subject: "Temperatura Suelo",
            A: lastData.find(item => item.id === "LM35")?.temperatura || 0,
          },
          {
            subject: "Temperatura Interior",
            A: lastData.find(item => item.id === "DHT_LOCAL")?.temperatura || 0,
          },
          {
            subject: "Humedad Interior",
            A: lastData.find(item => item.id === "DHT_LOCAL")?.humedad || 0,
          },
        ];

        setSensorData(reorganizedData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Cargando datos...</div>;
  if (error) return <div>Error al cargar los datos: {error.message}</div>;

  return (
    <div className='MainRadarChart'>
      <RadarChartComponent data={sensorData} domain={[0, 100]} />
    </div>
  );
};

export default DataFetcher;