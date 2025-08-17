import React from 'react'; // Importa React
import SensorDataSelector from '../components/SensorDataSelector';
import DataFetcher from '../components/DataFetcher';
import './Inicio.css';
import Last50Data from '../components/Last50Data';
const Inicio = () => {

  return (
    <div className="inicio-container">
      <h1 className="titulo">Pagina Principal</h1>
      <div className="radar-chart-container">
      <h3>Sensores Prototipo Sena</h3>
        <DataFetcher />
      </div>
      <div className="sensor-data-container">
        <SensorDataSelector />
      </div>
        <Last50Data />
    </div>
  );
};

export default Inicio;