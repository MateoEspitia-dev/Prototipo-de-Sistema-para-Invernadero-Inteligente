import React, { useState, useEffect } from 'react';
import './Components.css';

const Last50Data = () => {
  const [last50Data, setLast50Data] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://pmi.mateedev.com/api/sensor_data/`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const last50 = data.slice(-50);
        setLast50Data(last50);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="last-50-data-container white-box">
      <h3>Últimos Datos</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Temperatura</th>
            <th>Humedad</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {/* Invertir el orden del array antes de mapear */}
          {last50Data.slice().reverse().map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.nombre}</td>
              <td>{item.temperatura}</td>
              <td>{item.humedad}</td>
              <td>{new Date(item.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Last50Data;