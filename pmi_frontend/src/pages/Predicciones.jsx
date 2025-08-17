import React from 'react';
import Clima from '../components/Clima';
import Mapa from '../components/Mapa';
import PrediccionDiaria from '../components/PrediccionDiaria';
import './Predicciones.css';
import Title from '../components/Title';
const Predicciones = () => {
  return (
    <div>
        <Title text="Predicciones OpenWeather Map" />
        <div className="dashboard">
            <div className="dashboard-container2">
                <div className="dashboard-container3">
                    <Clima/>
                    <PrediccionDiaria/>
                </div>
                <div className="dashboard-container4">
                    <Mapa />
                </div>
            </div>
        </div>
    </div>
  );
};

export default Predicciones;

