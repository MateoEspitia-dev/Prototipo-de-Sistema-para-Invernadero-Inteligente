import React, { useEffect, useState } from 'react';
import { WiHumidity, WiStrongWind, WiBarometer } from 'react-icons/wi'; // Importamos iconos

const Clima = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
  const apiKey = '0dd338274365787f863893853205ec66';
  const ragonvaliaCoords = [7.5776, -72.4757];

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${ragonvaliaCoords[0]}&lon=${ragonvaliaCoords[1]}&units=metric&appid=${apiKey}&lang=es`
        );
        if (!response.ok) {
          throw new Error('Error al obtener los datos del clima');
        }
        const data = await response.json();
        setWeatherData(data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchWeatherData();
  }, []);

  return (
    <div className="clima-card">
      <h3>Ragonvalia, Norte de Santander</h3>
      {error ? (
        <p>Error: {error}</p>
      ) : weatherData ? (
        <div className="clima-content">
          {/* Sección principal */}
          <div className="clima-main">
            <div className="clima-icon">
              <img
                src={`http://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
                alt={weatherData.weather[0].description}
              />
            </div>
            <div className="clima-info">
              <h2>{Math.round(weatherData.main.temp)}°</h2>
              <p>{weatherData.weather[0].description.charAt(0).toUpperCase() + weatherData.weather[0].description.slice(1)}</p>

            </div>
          </div>

          {/* Sección lateral de estadísticas */}
          <div className="clima-stats-horizontal">
            <div className="clima-stat">
              <WiHumidity size={36} color="#3498db" />
              <p>{weatherData.main.humidity}%</p>
              <p>Humedad</p>
            </div>
            <div className="clima-stat">
              <WiStrongWind size={36} color="#2ecc71" />
              <p>{Math.round(weatherData.wind.speed * 3.6)} km/h</p>
              <p>Viento</p>
            </div>
            <div className="clima-stat">
              <WiBarometer size={36} color="#e74c3c" />
              <p>{weatherData.main.pressure} hPa</p>
              <p>Presión</p>
            </div>
          </div>
        </div>
      ) : (
        <p>Cargando...</p>
      )}
    </div>
  );
};

export default Clima;