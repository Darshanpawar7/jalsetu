const mqtt = require('mqtt');
const dotenv = require('dotenv');

dotenv.config();

class MQTTClient {
  constructor(db, io) {
    this.db = db;
    this.io = io;
    this.client = null;
    this.connect();
  }

  connect() {
    const options = {
      username: process.env.MQTT_USERNAME || '',
      password: process.env.MQTT_PASSWORD || '',
      clientId: `jalsetu-backend-${Date.now()}`,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      keepalive: 60
    };

    this.client = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883', options);

    this.client.on('connect', () => {
      console.log('✅ MQTT connected successfully');
      
      // Subscribe to topics
      this.client.subscribe('sensors/+/data', { qos: 1 });
      this.client.subscribe('sensors/+/status', { qos: 1 });
      this.client.subscribe('alerts/water', { qos: 2 });
      
      console.log('📡 Subscribed to MQTT topics');
      
      // Send connection event to dashboards
      if (this.io) {
        this.io.emit('mqtt_status', {
          status: 'connected',
          timestamp: new Date().toISOString()
        });
      }
    });

    this.client.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        
        console.log(`📥 MQTT [${topic}]:`, payload);
        
        await this.handleMessage(topic, payload);
        
      } catch (error) {
        console.error('❌ MQTT message processing error:', error.message);
      }
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT error:', error);
      
      if (this.io) {
        this.io.emit('mqtt_status', {
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    this.client.on('close', () => {
      console.log('🔌 MQTT connection closed');
      
      if (this.io) {
        this.io.emit('mqtt_status', {
          status: 'disconnected',
          timestamp: new Date().toISOString()
        });
      }
    });

    this.client.on('offline', () => {
      console.log('⚠️  MQTT offline');
      
      if (this.io) {
        this.io.emit('mqtt_status', {
          status: 'offline',
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  async handleMessage(topic, payload) {
    const topicParts = topic.split('/');
    const sensorId = topicParts[1];
    const messageType = topicParts[2];

    switch (messageType) {
      case 'data':
        await this.handleSensorData(sensorId, payload);
        break;
        
      case 'status':
        await this.handleSensorStatus(sensorId, payload);
        break;
        
      default:
        console.log(`Unknown message type: ${messageType}`);
    }
  }

  async handleSensorData(sensorId, data) {
    try {
      // Save to database
      await this.db.query(`
        INSERT INTO sensor_readings 
          (sensor_id, pressure, flow, quality_ph, quality_turbidity, battery_percent, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        sensorId,
        data.pressure,
        data.flow,
        data.ph,
        data.turbidity,
        data.battery
      ]);

      // Update sensor last seen
      await this.db.query(`
        UPDATE sensors 
        SET last_seen = NOW() 
        WHERE sensor_id = $1
      `, [sensorId]);

      // Emit real-time update
      if (this.io) {
        this.io.emit('sensor_data', {
          sensorId,
          data,
          timestamp: new Date().toISOString()
        });
      }

      // Check for critical conditions
      if (data.pressure < 1.5) {
        await this.handleCriticalPressure(sensorId, data);
      }

    } catch (error) {
      console.error('Sensor data handling error:', error);
    }
  }

  async handleSensorStatus(sensorId, status) {
    try {
      await this.db.query(`
        UPDATE sensors 
        SET last_seen = NOW() 
        WHERE sensor_id = $1
      `, [sensorId]);

      // Emit status update
      if (this.io) {
        this.io.emit('sensor_status', {
          sensorId,
          status,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Sensor status handling error:', error);
    }
  }

  async handleCriticalPressure(sensorId, data) {
    try {
      // Get sensor location info
      const sensorInfo = await this.db.query(`
        SELECT s.*, w.name as ward_name
        FROM sensors s
        LEFT JOIN wards w ON s.ward_id = w.id
        WHERE s.sensor_id = $1
      `, [sensorId]);

      if (sensorInfo.rows.length === 0) return;

      const sensor = sensorInfo.rows[0];
      
      // Create leak event
      await this.db.query(`
        INSERT INTO leak_events 
          (location, ward_id, confidence, detected_by, estimated_loss_lph, created_at)
        VALUES (
          ST_GeomFromText($1, 4326),
          $2,
          $3,
          'sensor',
          $4,
          NOW()
        )
      `, [
        sensor.location,
        sensor.ward_id,
        0.85, // High confidence for critical pressure
        Math.round(data.flow * 60 * 24 * 0.3) // Estimated daily loss
      ]);

      // Emit critical alert
      if (this.io) {
        this.io.emit('critical_alert', {
          type: 'critical_pressure',
          sensorId,
          sensorName: sensor.sensor_id,
          ward: sensor.ward_name,
          pressure: data.pressure,
          threshold: 1.5,
          message: `Critical low pressure detected at ${sensor.ward_name}`,
          timestamp: new Date().toISOString(),
          priority: 'P1'
        });
      }

      console.log(`🚨 Critical pressure alert: ${sensorId} at ${data.pressure} bar`);

    } catch (error) {
      console.error('Critical pressure handling error:', error);
    }
  }

  publish(topic, message) {
    if (this.client && this.client.connected) {
      this.client.publish(topic, JSON.stringify(message), { qos: 1 });
      return true;
    }
    return false;
  }
}

module.exports = MQTTClient;