import React, { useState, useEffect } from 'react';
import './Anomalias.css';
import Title from '../components/Title';

const Anomalías = () => {
    const [datos, setDatos] = useState({});
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log("Iniciando fetchData...");
                const response = await fetch('https://pmi.mateedev.com/api/detect_anomaly/');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                console.log("Datos recibidos:", result);
                setDatos(result);
                setCargando(false);
            } catch (err) {
                console.error("Error en fetchData:", err);
                setError(err);
                setCargando(false);
            }
        };

        fetchData();

        const intervalId = setInterval(fetchData, 5000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        console.log("Datos actualizados:", datos);
        if (datos && Object.values(datos).some(sensor => sensor.anomalia)) {
            console.log("Anomalía detectada, mostrando notificación...");
            mostrarNotificacion();
        }
    }, [datos]);

    const mostrarNotificacion = () => {
        if (Notification.permission === 'granted') {
            console.log("Permiso de notificación concedido.");
            new Notification('¡Anomalía detectada!', {
                body: 'Se ha detectado una anomalía en uno o más sensores.',
                icon: '/IconoAlert.png'
            });
            const audio = new Audio('/AlertSound.wav');
            audio.play();
        } else if (Notification.permission !== 'denied') {
            console.log("Solicitando permiso de notificación...");
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log("Permiso de notificación concedido después de la solicitud.");
                    mostrarNotificacion();
                } else {
                    console.log("Permiso de notificación denegado.");
                }
            });
        } else {
            console.log("Permiso de notificación denegado previamente.");
        }
    };

    if (cargando) return <div>Cargando...</div>;
    if (error) return <div>Error: {error.message}</div>;

    const sensores = Object.keys(datos);

    return (
        <div className="anomalias-container">
            <Title text="Dashboard de Anomalías" />
            <div className="grid-container">
                {sensores.map(sensor => (
                    <div key={sensor} className="grid-item">
                        <h2>{sensor}</h2>
                        <p>Dato: {datos[sensor].dato}</p>
                        <p style={{ color: datos[sensor].anomalia ? 'red' : 'inherit' }}>
                            Anomalía: {datos[sensor].anomalia ? 'Sí' : 'No'}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Anomalías;