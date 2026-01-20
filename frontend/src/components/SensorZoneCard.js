// === frontend/src/components/SensorZoneCard.js ===
import React from 'react';


const SensorZoneCard = ({ sensor }) => {
const isLow = sensor.pressure < 2.5;
return (
<div style={{
background: isLow ? '#dc2626' : '#16a34a',
color: 'white',
padding: '1rem',
borderRadius: '6px',
marginBottom: '0.5rem'
}}>
<strong>{sensor.sensor_id}</strong><br />
Pressure: {sensor.pressure.toFixed(2)} bar<br />
Flow: {sensor.flow.toFixed(2)} L/min
</div>
);
};


export default SensorZoneCard;