// simulator/publisher.js
const mqtt = require('mqtt');
const dotenv = require('dotenv');
dotenv.config();

const client = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883');

// Simulated sensors
const sensors = [
  { id: 'sensor-1', zone: 'North' },
  { id: 'sensor-2', zone: 'South' },
  { id: 'sensor-3', zone: 'East' },
  { id: 'sensor-4', zone: 'West' }
];

client.on('connect', () => {
  console.log('Simulator connected to MQTT broker');

  // Send data every 5 seconds
  setInterval(() => {
    sensors.forEach(sensor => {
      const payload = {
        sensor_id: sensor.id,
        zone: sensor.zone,
        pressure: parseFloat((Math.random() * 3 + 1).toFixed(2)), // 1 to 4 bars
        flow: parseFloat((Math.random() * 50 + 100).toFixed(2))   // 100 to 150 lpm
      };

      const topic = `sensors/${sensor.id}/data`;
      client.publish(topic, JSON.stringify(payload));
      console.log(`Published to ${topic}:`, payload);
    });
  }, 5000);
});
