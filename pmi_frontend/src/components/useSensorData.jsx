import { useState, useEffect } from 'react';

const useSensorData = () => {
  const [sensorData, setSensorData] = useState({});
  const [sensorIds, setSensorIds] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("https://pmi.mateedev.com/api/sensor_data/");
        const data = await response.json();

        // Filtrar solo los sensores válidos y agrupar los datos por ID
        const validSensors = ["DHT22_IN", "SOIL", "DS18B20", "LM35", "DHT_LOCAL"];
        const groupedData = data.reduce((acc, item) => {
          if (!validSensors.includes(item.id)) return acc;

          const sensorId = item.id;
          const sensorEntry = {
            time: new Date(item.timestamp).toLocaleTimeString(),
            temperature: item.temperatura,
            humidity: item.humedad,
          };

          if (!acc[sensorId]) {
            acc[sensorId] = [];
          }
          acc[sensorId].push(sensorEntry);

          return acc;
        }, {});

        // Establecer datos agrupados y los IDs únicos de sensores
        setSensorData(groupedData);
        setSensorIds(Object.keys(groupedData));
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };

    loadData();
  }, []);

  return { sensorData, sensorIds };
};

export default useSensorData;