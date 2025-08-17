import React, { useEffect, useState } from 'react';

const SensorList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // URL de la API en Django para obtener los datos del sensor
    const apiUrl = 'https://pmi.mateedev.com/api/sensor_data/';

    // Hacer una solicitud GET a la API
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al obtener los datos del sensor');
        }
        return response.json();
      })
      .then(data => {
        setData(data);  // Guardar los datos en el estado
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []); // Ejecuta el efecto una sola vez al montar el componente

  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <ul>
        {data.map((sensor, index) => (
      <li key={index}>
        <span className="sensor-name">
        <strong>Nombre:</strong> {sensor.name}
        </span>
        <span className="sensor-value">
        <strong>Valor:</strong> {sensor.value}
        </span>
        <span className="sensor-date">
        <strong>Fecha:</strong> {new Date(sensor.timestamp).toLocaleString()}
        </span>
      </li>
      ))}
      </ul>
    </div>
  );
};
 
export default SensorList;
