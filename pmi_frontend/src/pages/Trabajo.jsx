// src/components/CronogramaTrabajo.jsx
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import './Trabajo.css'
const CronogramaTrabajo = () => {
  const [scheduleData, setScheduleData] = useState([]);
  const [soilData, setSoilData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("https://pmi.mateedev.com/api/sensor_data/");
        const data = await response.json();

        // Crear cronograma de trabajo (último día)
        const now = new Date();
        const today = now.toISOString().split("T")[0]; // Fecha actual

        const cronograma = [];
        for (let hour = 0; hour < 24; hour++) {
          cronograma.push({
            time: `${hour}:00`,
            riego: (hour === 6 || hour === 12 || hour === 18) ? 1 : 0, // Riegos a las 6, 12, 18 horas
            fertiriego: hour === 14 ? 1 : 0, // Fertirriego a las 14 horas
          });
        }

        // Datos de humedad del suelo del último día
        const soilSensorId = "SOIL"; // ID del sensor de humedad del suelo
        const soilEntries = data.filter(
          (item) =>
            item.id === soilSensorId && item.timestamp.startsWith(today)
        );

        const soilChartData = soilEntries.map((item) => ({
          time: new Date(item.timestamp).toLocaleTimeString(),
          humidity: item.humedad,
        }));

        setScheduleData(cronograma);
        setSoilData(soilChartData);
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="cronograma-trabajo-container">
      <h2>Cronograma de Trabajo</h2>
      <div className="cronograma-chart">
        <h3>Riego y Fertirriego</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={scheduleData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="riego" fill="#007bff" name="Riego" />
            <Bar dataKey="fertiriego" fill="#28a745" name="Fertirriego" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="soil-humidity-chart">
        <h3>Humedad del Suelo (Último Día)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={soilData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="humidity"
              name="Humedad"
              stroke="#82ca9d"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CronogramaTrabajo;
