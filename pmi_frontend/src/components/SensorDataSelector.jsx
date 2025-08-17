import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import './Components.css';

const SensorDataSelector = () => {
  const [selectedSensors, setSelectedSensors] = useState(["Temperatura Interior"]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sensorData, setSensorData] = useState({});
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableDates, setAvailableDates] = useState([]); // Nuevo estado para las fechas disponibles

  const sensors = ["Temperatura Interior", "Temperatura Exterior", "Temperatura Suelo", "Humedad de Suelo", "Temperatura Agua"];

  // Componente SensorSelector integrado
  const SensorSelector = () => (
    <select value={selectedSensors[0]} onChange={(e) => setSelectedSensors([e.target.value])}>
      <option value="">Seleccionar Sensor</option>
      {sensors.map((sensor) => (
        <option key={sensor} value={sensor}>
          {sensor}
        </option>
      ))}
    </select>
  );

  // Componente DateSelector integrado
  const DateSelector = () => (
    <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
      {availableDates.map((date) => (
        <option key={date} value={date}>
          {date}
        </option>
      ))}
    </select>
  );

  useEffect(() => {
    const fetchData = async () => {
      if (selectedSensors.length === 0) {
        setChartData([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://pmi.mateedev.com/api/sensor_data/`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Obtener fechas únicas desde los datos
        const dates = [...new Set(data.map(item => new Date(item.timestamp).toISOString().split('T')[0]))];
        setAvailableDates(dates);

        const filteredData = data.filter(item => {
          const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
          return itemDate === selectedDate && selectedSensors.includes(item.nombre);
        });

        const groupedData = selectedSensors.reduce((acc, sensorName) => {
          acc[sensorName] = filteredData.filter(item => item.nombre === sensorName);
          return acc;
        }, {});

        setSensorData(groupedData);

        const chartDataArray = [];
        Object.keys(groupedData).forEach(sensorName => {
          groupedData[sensorName].forEach(item => {
            const time = new Date(item.timestamp).toLocaleTimeString();
            let chartItem = { time };

            if (sensorName === "Temperatura Interior" || sensorName === "Temperatura Exterior" || sensorName === "Humedad de Suelo") {
              chartItem["Temperatura"] = item.temperatura;
              chartItem["Humedad"] = item.humedad;
            } else {
              chartItem[sensorName] = item.temperatura;
            }
            chartDataArray.push(chartItem);
          });
        });

        setChartData(chartDataArray);

      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSensors, selectedDate]);

  return (
    <div className="sensor-data-container white-box">
      <div className='select-details'>
        <div className="selectors">
          <SensorSelector />
          <DateSelector />
          <div className="sensor-details">
            {selectedSensors.map(sensorName => (
              <div key={sensorName} className="sensor-item-inline">
                <span>{sensorName}</span>
                <span>{sensorData[sensorName] && sensorData[sensorName][0]?.id}</span>
                <span>{selectedDate}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="chart-container">
        <LineChart width={600} height={300} data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          {selectedSensors.map(sensorName => {
            if (sensorName === "Temperatura Interior" || sensorName === "Temperatura Exterior" || sensorName === "Humedad de Suelo") {
              return (
                <React.Fragment key={sensorName}>
                  <Line type="monotone" dataKey="Temperatura" stroke="#8884d8" name="Temperatura" />
                  <Line type="monotone" dataKey="Humedad" stroke="#82ca9d" name="Humedad" />
                </React.Fragment>
              );
            } else {
              return <Line key={sensorName} type="monotone" dataKey={sensorName} stroke="#8884d8" name={sensorName} />;
            }
          })}
        </LineChart>
      </div>
    </div>
  );
};

export default SensorDataSelector;