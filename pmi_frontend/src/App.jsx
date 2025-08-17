import React from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink } from 'react-router-dom';
import { FaHome, FaSeedling, FaCloudSun, FaBriefcase, FaStar } from 'react-icons/fa';
import Inicio from './pages/Inicio';
import Dashboard from './components/Dashboard';
import Predicciones from './pages/Predicciones';
import CronogramaTrabajo from './pages/Trabajo';
import './App.css';
import './components/Components.css';
import Anomalías from './pages/Anomalías';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Barra superior fija */}
        <header className="topbar">
          <h1 className="topbar-title">Prototipo Smart Monitoring</h1>
        </header>

        {/* Barra lateral siempre visible */}
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <NavLink to="/" className="sidebar-link" activeClassName="active-link">
              <span className="icon"><FaHome /></span>
              <span className="link-text">Inicio</span>
            </NavLink>
            <NavLink to="/estaciones" className="sidebar-link" activeClassName="active-link">
              <span className="icon"><FaSeedling /></span>
              <span className="link-text">Estaciones</span>
            </NavLink>
            <NavLink to="/predicciones" className="sidebar-link" activeClassName="active-link">
              <span className="icon"><FaCloudSun /></span>
              <span className="link-text">Predicciones</span>
            </NavLink>
            <NavLink to="/trabajo" className="sidebar-link" activeClassName="active-link">
              <span className="icon"><FaBriefcase /></span>
              <span className="link-text">Trabajo</span>
            </NavLink>
            <NavLink to="/extras" className="sidebar-link" activeClassName="active-link">
              <span className="icon"><FaStar /></span>
              <span className="link-text">Anomalías</span>
            </NavLink>
          </nav>
        </aside>
        {/* Contenido principal */}
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/estaciones" element={<Dashboard />} />
              <Route path="/predicciones" element={<Predicciones />} />
              <Route path="/trabajo" element={<CronogramaTrabajo/>} />
              <Route path="/extras" element={<Anomalías/>} />
            </Routes>
          </main>
      </div>
    </Router>
  );
}

export default App;
