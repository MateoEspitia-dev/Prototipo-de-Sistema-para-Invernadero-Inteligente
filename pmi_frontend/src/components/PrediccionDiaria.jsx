import React, { useEffect, useState } from "react";

const PrediccionDiaria = () => {
  const [forecastData, setForecastData] = useState(null);
  const [error, setError] = useState(null);
  const apiKey = "0dd338274365787f863893853205ec66";
  const coords = { lat: 7.5776, lon: -72.4757 };

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${apiKey}&lang=es`
        );

        if (!response.ok) {
          throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Agrupa los datos por día
        const groupedData = groupByDay(data.list);
        setForecastData(groupedData);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchForecast();
  }, []);

  // Función para agrupar los datos por día
  const groupByDay = (list) => {
    return list.reduce((acc, item) => {
      const date = item.dt_txt.split(" ")[0]; // Extrae la fecha (YYYY-MM-DD)
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {});
  };

  return (
    <div className="forecast-container">
      <h4>Predicción del Clima (Próximos Días)</h4>
      {error ? (
        <p className="error-message">Error: {error}</p>
      ) : !forecastData ? (
        <p>Cargando...</p>
      ) : (
        <div className="forecast-grid">
          {Object.entries(forecastData).map(([date, forecasts]) => (
            <div key={date} className="forecast-card">
              <h3>{new Date(date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</h3>
              <div className="forecast-details">
                {forecasts.map((forecast, index) => (
                  <div key={index} className="forecast-item">
                    <p>{forecast.dt_txt.split(" ")[1].slice(0, 5)}</p>
                    <img
                      src={`http://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`}
                      alt={forecast.weather[0].description}
                      title={forecast.weather[0].description}
                    />
                    <p>{Math.round(forecast.main.temp)}°C</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrediccionDiaria;
