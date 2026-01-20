// MapView.js
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import axios from 'axios';

mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN'; // Replace this!

const MapView = () => {
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [sensorData, setSensorData] = useState([]);

  useEffect(() => {
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [75.9, 17.68],
      zoom: 11
    });
    setMap(mapInstance);
    return () => mapInstance.remove();
  }, []);

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/sensors');
        setSensorData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSensors();
    const interval = setInterval(fetchSensors, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!map) return;
    sensorData.forEach(sensor => {
      const markerColor = sensor.pressure < 2.5 ? '#dc2626' : '#16a34a';
      new mapboxgl.Marker({ color: markerColor })
        .setLngLat([75.9 + Math.random() * 0.05, 17.68 + Math.random() * 0.03]) // Fake coords
        .setPopup(
          new mapboxgl.Popup().setText(
            `${sensor.sensor_id}: ${sensor.pressure.toFixed(2)} bar`
          )
        )
        .addTo(map);
    });
  }, [sensorData, map]);

  return <div ref={mapContainer} style={{ height: '400px', width: '100%', borderRadius: '6px', marginBottom: '1rem' }} />;
};

export default MapView;
