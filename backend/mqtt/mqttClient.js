// backend/mqtt/mqttClient.js
const mqtt = require('mqtt');
const dotenv = require('dotenv');
dotenv.config();

const SensorReading = require('../models/SensorReading');
const app = require('../app');
const db = app.get('db');

const client = mqtt.connect(process.env.MQTT_BROKER);

client.on('connect', () => {
  console.log('MQTT connected');
  client.subscribe('sensors/+/data');
});

client.on('message', async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    console.log('MQTT Payload:', payload);

    await SensorReading.saveReading(db, {
      sensor_id: payload.sensor_id,
      pressure: payload.pressure,
      flow: payload.flow
    });
  } catch (err) {
    console.error('MQTT Error:', err.message);
  }
});

module.exports = client;
