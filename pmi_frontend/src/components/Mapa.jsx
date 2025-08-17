import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Mapa = () => {
  const apiKey = '0dd338274365787f863893853205ec66';
  const ragonvaliaCoords = [7.5776, -72.4757];

  return (
    <div className="mapa-card">
      <h3>Mapa Meteorológico</h3>
      <MapContainer
        center={ragonvaliaCoords}
        zoom={10}
        style={{ height: '400px', width: '100%' }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Carreteras">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay name="Temperatura">
            <TileLayer
              url={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`}
              attribution="&copy; <a href='https://openweathermap.org/'>OpenWeatherMap</a> contributors"
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Precipitación">
            <TileLayer
              url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`}
              attribution="&copy; <a href='https://openweathermap.org/'>OpenWeatherMap</a> contributors"
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Presión Atmosférica">
            <TileLayer
              url={`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${apiKey}`}
              attribution="&copy; <a href='https://openweathermap.org/'>OpenWeatherMap</a> contributors"
            />
          </LayersControl.Overlay>
        </LayersControl>
        <Marker position={ragonvaliaCoords}>
          <Popup>
            <strong>Ragonvalia</strong>
            <br />
            Norte de Santander, Colombia
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default Mapa;
