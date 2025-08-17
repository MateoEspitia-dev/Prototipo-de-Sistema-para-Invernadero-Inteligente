import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import './Components.css';

const RadarChartComponent = ({ data, domain }) => {
  const sensorTypes = [
    "Temperatura Interior",
    "Humedad Interior",
    "Humedad Exterior",
    "Temperatura Exterior",
    "Temperatura Suelo",
    "Humedad de Suelo",
    "Temperatura Agua"
  ];

  const filteredData = sensorTypes.map(type => {
    const sensor = data.find(item => item.subject === type);
    return {
      subject: type,
      A: sensor ? sensor.A : 0
    };
  });

  return (
    <div className="radar-chart-container">
      <RadarChart outerRadius={140} width={600} height={319.2} data={filteredData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis domain={domain} /> {/* Usar la prop domain */}
        <Radar name="Data" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
      </RadarChart>
    </div>
  );
};

export default RadarChartComponent;