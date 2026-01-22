import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';  // ← CHANGED
import 'maplibre-gl/dist/maplibre-gl.css';  // ← CHANGED
import './MapView.css';

// NO TOKEN NEEDED! MapLibre is completely free

const MapView = ({ sensors = [], complaints = [] }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng] = useState(75.9167); // Solapur longitude
  const [lat] = useState(17.6833); // Solapur latitude
  const [zoom] = useState(12);
  const [loaded, setLoaded] = useState(false);
  const markers = useRef([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({  // ← CHANGED
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',  // ← FREE professional style
      center: [lng, lat],
      zoom: zoom,
      pitch: 45,
      bearing: -20
    });

    map.current.on('load', () => {
      setLoaded(true);
      addWaterSourceLayer();
      addWardBoundaries();
    });

    map.current.addControl(new maplibregl.NavigationControl());  // ← CHANGED
    map.current.addControl(new maplibregl.FullscreenControl());  // ← CHANGED
    map.current.addControl(new maplibregl.ScaleControl());  // ← CHANGED

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [lng, lat, zoom]);

  // Add water source visualization
  const addWaterSourceLayer = () => {
    if (!map.current) return;

    const waterSources = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Solapur Main Reservoir', type: 'reservoir' },
          geometry: { type: 'Point', coordinates: [75.93, 17.69] }
        },
        {
          type: 'Feature',
          properties: { name: 'North Zone Pumping Station', type: 'pumping_station' },
          geometry: { type: 'Point', coordinates: [75.91, 17.70] }
        },
        {
          type: 'Feature',
          properties: { name: 'Central Filtration Plant', type: 'treatment_plant' },
          geometry: { type: 'Point', coordinates: [75.92, 17.68] }
        }
      ]
    };

    if (map.current.getSource('water-sources')) {
      map.current.removeLayer('water-sources');
      map.current.removeSource('water-sources');
    }

    map.current.addSource('water-sources', {
      type: 'geojson',
      data: waterSources
    });

    map.current.addLayer({
      id: 'water-sources',
      type: 'circle',
      source: 'water-sources',
      paint: {
        'circle-radius': 10,
        'circle-color': [
          'match',
          ['get', 'type'],
          'reservoir', '#3B82F6',
          'pumping_station', '#10B981',
          'treatment_plant', '#8B5CF6',
          '#6B7280'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });
  };

  // Add ward boundaries (simplified for demo)
  const addWardBoundaries = () => {
    if (!map.current) return;

    const wardBoundaries = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Nana Peth', equity_score: 0.6 },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [75.90, 17.68], [75.91, 17.68], [75.91, 17.69], [75.90, 17.69], [75.90, 17.68]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: { name: 'Sadar Bazaar', equity_score: 1.2 },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [75.92, 17.67], [75.93, 17.67], [75.93, 17.68], [75.92, 17.68], [75.92, 17.67]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: { name: 'Akkalkot Road', equity_score: 0.9 },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [75.89, 17.69], [75.90, 17.69], [75.90, 17.70], [75.89, 17.70], [75.89, 17.69]
            ]]
          }
        }
      ]
    };

    if (map.current.getSource('ward-boundaries')) {
      map.current.removeLayer('ward-boundaries-fill');
      map.current.removeLayer('ward-boundaries-line');
      map.current.removeSource('ward-boundaries');
    }

    map.current.addSource('ward-boundaries', {
      type: 'geojson',
      data: wardBoundaries
    });

    // Fill layer with opacity based on equity score
    map.current.addLayer({
      id: 'ward-boundaries-fill',
      type: 'fill',
      source: 'ward-boundaries',
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'equity_score'],
          0.3, '#EF4444',  // Red for low equity
          0.7, '#F59E0B',  // Yellow for medium
          1.0, '#10B981',  // Green for good
          1.3, '#3B82F6'   // Blue for excellent
        ],
        'fill-opacity': 0.3
      }
    });

    // Boundary lines
    map.current.addLayer({
      id: 'ward-boundaries-line',
      type: 'line',
      source: 'ward-boundaries',
      paint: {
        'line-color': '#4B5563',
        'line-width': 2,
        'line-dasharray': [2, 1]
      }
    });

    // Labels
    map.current.addLayer({
      id: 'ward-labels',
      type: 'symbol',
      source: 'ward-boundaries',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'text-size': 12,
        'text-offset': [0, 1]
      },
      paint: {
        'text-color': '#1F2937',
        'text-halo-color': '#FFFFFF',
        'text-halo-width': 2
      }
    });
  };

  // Update markers when sensors or complaints change
  useEffect(() => {
    if (!map.current || !loaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add sensor markers
    sensors.forEach(sensor => {
      if (!sensor.location?.lng || !sensor.location?.lat) return;

      const color = getSensorColor(sensor);
      
      const el = document.createElement('div');
      el.className = 'sensor-marker';
      el.style.backgroundColor = color;
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.title = `${sensor.sensor_id}: ${sensor.pressure?.toFixed(2) || 'N/A'} bar`;

      // Add pulsing animation for critical sensors
      if (sensor.status === 'CRITICAL') {
        el.style.animation = 'pulse 2s infinite';
      }

      const marker = new maplibregl.Marker({ element: el })  // ← CHANGED
        .setLngLat([sensor.location.lng, sensor.location.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 })  // ← CHANGED
            .setHTML(`
              <div class="map-popup">
                <h4>${sensor.sensor_id}</h4>
                <p><strong>Ward:</strong> ${sensor.ward_name || 'Unknown'}</p>
                <p><strong>Pressure:</strong> ${sensor.pressure?.toFixed(2) || 'N/A'} bar</p>
                <p><strong>Flow:</strong> ${sensor.flow?.toFixed(2) || 'N/A'} L/min</p>
                <p><strong>Status:</strong> <span class="status-${sensor.status?.toLowerCase()}">${sensor.status}</span></p>
                <p><strong>Last Reading:</strong> ${sensor.last_reading ? new Date(sensor.last_reading).toLocaleTimeString() : 'N/A'}</p>
              </div>
            `)
        )
        .addTo(map.current);

      markers.current.push(marker);
    });

    // Add complaint markers
    complaints.slice(0, 20).forEach(complaint => {
      if (!complaint.location?.lng || !complaint.location?.lat) return;

      const el = document.createElement('div');
      el.className = 'complaint-marker';
      el.innerHTML = '📝';
      el.style.fontSize = '18px';
      el.style.cursor = 'pointer';
      el.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';

      const marker = new maplibregl.Marker({ element: el })  // ← CHANGED
        .setLngLat([complaint.location.lng, complaint.location.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 })  // ← CHANGED
            .setHTML(`
              <div class="map-popup">
                <h4>Water Complaint</h4>
                <p><strong>Issue:</strong> ${complaint.issue.substring(0, 100)}${complaint.issue.length > 100 ? '...' : ''}</p>
                <p><strong>Ward:</strong> ${complaint.ward_name || 'Unknown'}</p>
                <p><strong>Status:</strong> ${complaint.status}</p>
                <p><strong>Reported:</strong> ${new Date(complaint.created_at).toLocaleString()}</p>
                ${complaint.severity === 3 ? '<p class="critical-note">🚨 High Severity Issue</p>' : ''}
              </div>
            `)
        )
        .addTo(map.current);

      markers.current.push(marker);
    });

  }, [sensors, complaints, loaded]);

  const getSensorColor = (sensor) => {
    const pressure = sensor.pressure || 0;
    if (pressure < 1.5) return '#EF4444'; // Critical - Red
    if (pressure < 2.0) return '#F59E0B'; // Warning - Yellow
    if (pressure < 2.5) return '#3B82F6'; // Low - Blue
    return '#10B981'; // Normal - Green
  };

  const fitBoundsToSensors = () => {
    if (!map.current || sensors.length === 0) return;
    
    const bounds = new maplibregl.LngLatBounds();  // ← CHANGED
    
    sensors.forEach(s => {
      if (s.location?.lng && s.location?.lat) {
        bounds.extend([s.location.lng, s.location.lat]);
      }
    });
    
    if (bounds.isEmpty()) {
      // Default to Solapur bounds if no valid locations
      bounds.extend([75.85, 17.65]);
      bounds.extend([75.95, 17.75]);
    }
    
    map.current.fitBounds(bounds, { 
      padding: 50, 
      duration: 1000,
      maxZoom: 14 
    });
  };

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
      <div className="map-controls">
        <button 
          className="map-btn"
          onClick={() => map.current?.flyTo({ center: [lng, lat], zoom: 12, duration: 1000 })}
        >
          Reset View
        </button>
        <button 
          className="map-btn"
          onClick={fitBoundsToSensors}
        >
          Fit Sensors
        </button>
        <button 
          className="map-btn"
          onClick={() => {
            if (map.current) {
              const currentPitch = map.current.getPitch();
              map.current.setPitch(currentPitch === 0 ? 45 : 0);
            }
          }}
        >
          3D View
        </button>
      </div>
      <div className="map-stats">
        <div className="map-stat">
          <span className="stat-dot" style={{ background: '#10B981' }}></span>
          Normal: {sensors.filter(s => (s.pressure || 0) >= 2.5).length}
        </div>
        <div className="map-stat">
          <span className="stat-dot" style={{ background: '#F59E0B' }}></span>
          Warning: {sensors.filter(s => (s.pressure || 0) >= 1.5 && (s.pressure || 0) < 2.5).length}
        </div>
        <div className="map-stat">
          <span className="stat-dot" style={{ background: '#EF4444' }}></span>
          Critical: {sensors.filter(s => (s.pressure || 0) < 1.5).length}
        </div>
        <div className="map-stat">
          <span className="stat-dot" style={{ background: '#3B82F6' }}></span>
          Complaints: {complaints.filter(c => c.status !== 'resolved').length}
        </div>
      </div>
    </div>
  );
};

export default MapView;