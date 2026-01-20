// components/MapView.js
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

const MapView = () => {
  const mapContainer = useRef(null);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [75.9, 17.68], // Solapur center
      zoom: 11
    });

    // Dummy markers for 4 zones
    const zones = [
      { name: 'North', coords: [75.92, 17.71] },
      { name: 'South', coords: [75.89, 17.65] },
      { name: 'East', coords: [75.96, 17.68] },
      { name: 'West', coords: [75.85, 17.67] }
    ];

    zones.forEach(zone => {
      new mapboxgl.Marker().setLngLat(zone.coords).setPopup(new mapboxgl.Popup().setText(zone.name)).addTo(map);
    });
  }, []);

  return <div ref={mapContainer} style={{ height: '500px', width: '100%' }} />;
};

export default MapView;
