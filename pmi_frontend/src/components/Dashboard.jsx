import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const Dashboard = () => {
  const [sensorData, setSensorData] = useState({});
  const [sensorIds, setSensorIds] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("https://pmi.mateedev.com/api/sensor_data/");
        const data = await response.json();

        const validSensors = ["DHT22_IN", "SOIL", "DS18B20", "LM35", "DHT_LOCAL"];
        const groupedData = data.reduce((acc, item) => {
          if (!validSensors.includes(item.id)) return acc;

          const sensorId = item.id;
          const sensorEntry = {
            time: new Date(item.timestamp).toISOString(), // Formato ISO
            temperature: item.temperatura,
            humidity: item.humedad,
          };

          if (!acc[sensorId]) {
            acc[sensorId] = [];
          }
          acc[sensorId].push(sensorEntry);

          return acc;
        }, {});

        setSensorData(groupedData);
        setSensorIds(Object.keys(groupedData));
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };

    loadData();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="graph-container">
        {sensorIds.map((sensorId) => (
          <div key={sensorId} className="sensor-dashboard">
            <h3>Datos del Sensor: {sensorId}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sensorData[sensorId]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  ticks={sensorData[sensorId]?.map(item => new Date(item.time).toISOString()).filter(time => !isNaN(new Date(time).getTime()))}
                  tickFormatter={(time) => {
                    const date = new Date(time);
                    const day = date.getDate();
                    const month = date.getMonth() + 1;
                    const timeString = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                    return `${timeString} ${day}/${month}`;
                  }}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(time) => {
                    const date = new Date(time);
                    const dateString = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
                    const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                    return `${dateString} ${timeString}`;
                  }}
                  formatter={(value, name) => {
                    return [`${value}`, name];
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Temperatura"
                  stroke="#8884d8"
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  name="Humedad"
                  stroke="#82ca9d"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;