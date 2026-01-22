// backend/services/mqttService.js
/**
 * MQTT service for sensor data
 */

const mqtt = require('mqtt');

class MQTTService {
  constructor() {
    this.client = null;
    this.subscribers = [];
  }

  connect() {
    const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
    
    this.client = mqtt.connect(brokerUrl, {
      clientId: `jalsetu-${Date.now()}`,
      reconnectPeriod: 5000
    });

    this.client.on('connect', () => {
      console.log('✅ MQTT Connected to:', brokerUrl);
      this.client.subscribe('sensors/#');
    });

    this.client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        this.notifySubscribers(topic, data);
      } catch (error) {
        console.error('MQTT parse error:', error);
      }
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT Error:', error);
    });
  }

  subscribe(callback) {
    this.subscribers.push(callback);
  }

  notifySubscribers(topic, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(topic, data);
      } catch (error) {
        console.error('Subscriber error:', error);
      }
    });
  }

  publish(topic, message) {
    if (this.client && this.client.connected) {
      this.client.publish(topic, JSON.stringify(message));
      return true;
    }
    return false;
  }

  isConnected() {
    return this.client && this.client.connected;
  }
}

module.exports = new MQTTService();