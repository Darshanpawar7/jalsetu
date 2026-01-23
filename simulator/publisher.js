const mqtt = require('mqtt');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

class SensorSimulator {
  constructor() {
    this.client = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883', {
      clientId: `jalsetu-simulator-${Date.now()}`,
      reconnectPeriod: 5000
    });

    this.sensors = this.createSolapurSensors();
    this.complaintGenerator = new ComplaintGenerator();
    
    this.setupEventHandlers();
  }

  createSolapurSensors() {
    // Realistic sensors for Solapur wards
    return [
      {
        id: 'sensor-np-01',
        ward: 'Nana Peth',
        basePressure: 1.8,
        baseFlow: 85,
        pressureRange: [0.5, 2.5],
        flowRange: [40, 120],
        riskFactor: 0.3, // High risk area
        lastPressure: 1.8,
        status: 'active',
        coordinates: { lat: 17.6845, lng: 75.9172 }
      },
      {
        id: 'sensor-sb-01',
        ward: 'Sadar Bazaar',
        basePressure: 3.2,
        baseFlow: 150,
        pressureRange: [2.5, 4.0],
        flowRange: [120, 180],
        riskFactor: 0.2,
        lastPressure: 3.2,
        status: 'active',
        coordinates: { lat: 17.6723, lng: 75.9021 }
      },
      {
        id: 'sensor-ar-01',
        ward: 'Akkalkot Road',
        basePressure: 2.5,
        baseFlow: 110,
        pressureRange: [1.8, 3.2],
        flowRange: [80, 140],
        riskFactor: 0.4,
        lastPressure: 2.5,
        status: 'active',
        coordinates: { lat: 17.6918, lng: 75.8901 }
      },
      {
        id: 'sensor-ns-01',
        ward: 'North Solapur',
        basePressure: 2.2,
        baseFlow: 95,
        pressureRange: [1.5, 3.0],
        flowRange: [70, 130],
        riskFactor: 0.6,
        lastPressure: 2.2,
        status: 'active',
        coordinates: { lat: 17.7098, lng: 75.9041 }
      },
      {
        id: 'sensor-cs-01',
        ward: 'Central Solapur',
        basePressure: 2.8,
        baseFlow: 125,
        pressureRange: [2.0, 3.5],
        flowRange: [100, 160],
        riskFactor: 0.3,
        lastPressure: 2.8,
        status: 'active',
        coordinates: { lat: 17.6602, lng: 75.9213 }
      }
    ];
  }

  setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('✅ Simulator connected to MQTT broker');
      this.startSimulation();
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT error:', error);
    });

    this.client.on('close', () => {
      console.log('🔌 MQTT connection closed');
    });
  }

  startSimulation() {
    // Send initial sensor data
    this.sendSensorData();

    // Schedule periodic updates
    setInterval(() => this.sendSensorData(), 15000); // Every 15 seconds

    // Simulate occasional critical events
    setInterval(() => this.simulateCriticalEvent(), 120000); // Every 120 seconds

    // Generate occasional complaints
    setInterval(() => this.generateComplaint(), 180000); // Every 180 seconds
  }

  sendSensorData() {
    const now = new Date();
    const hour = now.getHours();
    
    // Time-based pressure variation (lower at peak hours)
    const timeFactor = this.getTimeFactor(hour);
    
    this.sensors.forEach(sensor => {
      // Add some randomness but trend toward base values
      const pressureVariation = (Math.random() - 0.5) * 0.4;
      const flowVariation = (Math.random() - 0.5) * 20;
      
      // Apply time factor (pressure drops during peak hours)
      let pressure = sensor.basePressure + pressureVariation;
      pressure *= timeFactor;
      
      // Occasionally simulate a problem based on risk factor
      if (Math.random() < sensor.riskFactor * 0.1) {
        pressure *= 0.6; // Significant pressure drop
      }
      
      // Ensure within reasonable bounds
      pressure = Math.max(sensor.pressureRange[0], Math.min(sensor.pressureRange[1], pressure));
      
      const flow = Math.max(sensor.flowRange[0], 
        Math.min(sensor.flowRange[1], sensor.baseFlow + flowVariation));
      
      // Track for trend analysis
      sensor.lastPressure = pressure;
      
      const payload = {
        sensor_id: sensor.id,
        ward: sensor.ward,
        pressure: parseFloat(pressure.toFixed(2)),
        flow: parseFloat(flow.toFixed(2)),
        quality_ph: parseFloat((6.8 + Math.random() * 1.2).toFixed(1)),
        quality_turbidity: parseFloat((0.5 + Math.random() * 2.5).toFixed(2)),
        battery_percent: Math.max(20, Math.floor(100 - Math.random() * 30)),
        timestamp: now.toISOString(),
        location: {
          lat: sensor.coordinates.lat,
          lng: sensor.coordinates.lng
        }
      };

      const topic = `sensors/${sensor.id}/data`;
      this.client.publish(topic, JSON.stringify(payload), { qos: 1 });
      
      // Log critical conditions
      if (pressure < 1.5) {
        console.log(`🚨 Critical pressure at ${sensor.ward}: ${pressure} bar`);
      }
    });
  }

  simulateCriticalEvent() {
    // Pick a random sensor (weighted by risk factor)
    const weightedSensors = this.sensors.flatMap(sensor => 
      Array(Math.ceil(sensor.riskFactor * 10)).fill(sensor)
    );
    
    const sensor = weightedSensors[Math.floor(Math.random() * weightedSensors.length)];
    
    // Simulate a critical event
    const eventTypes = ['pressure_drop', 'leak_detected', 'quality_alert'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    const eventPayload = {
      event_id: `event-${Date.now()}`,
      type: eventType,
      sensor_id: sensor.id,
      ward: sensor.ward,
      severity: 'critical',
      details: this.getEventDetails(eventType, sensor),
      timestamp: new Date().toISOString(),
      location: sensor.coordinates
    };

    console.log(`⚠️  Simulating ${eventType} at ${sensor.ward}`);
    
    this.client.publish('alerts/water', JSON.stringify(eventPayload), { qos: 2 });
    
    // Also send as MQTT alert
    this.client.publish(`alerts/${sensor.id}`, JSON.stringify({
      ...eventPayload,
      message: `${eventType.replace('_', ' ')} detected at ${sensor.ward}`
    }), { qos: 1 });
  }

  generateComplaint() {
    // Randomly generate a complaint (30% chance)
    if (Math.random() < 0.3) {
      const wards = ['Nana Peth', 'Sadar Bazaar', 'Akkalkot Road', 'North Solapur'];
      const ward = wards[Math.floor(Math.random() * wards.length)];
      
      const issues = [
        'No water supply since morning',
        'Low pressure issue',
        'Water leakage on street',
        'Dirty water coming from tap',
        'Irregular water timing'
      ];
      
      const issue = issues[Math.floor(Math.random() * issues.length)];
      
      const complaint = {
        complaint_id: `comp-${Date.now()}`,
        phone: `+91741${Math.floor(1000000 + Math.random() * 9000000)}`,
        ward: ward,
        issue: issue,
        timestamp: new Date().toISOString(),
        source: 'whatsapp_simulated'
      };

      console.log(`📝 Simulated complaint from ${ward}: ${issue}`);
      
      // Send to MQTT
      this.client.publish('complaints/new', JSON.stringify(complaint), { qos: 1 });
      
      // Optionally, also send via HTTP API
      this.sendViaAPI(complaint);
    }
  }

  getTimeFactor(hour) {
    // Pressure varies throughout the day
    if (hour >= 6 && hour <= 10) return 0.8;  // Morning peak
    if (hour >= 18 && hour <= 22) return 0.7; // Evening peak
    if (hour >= 23 || hour <= 5) return 1.2;  // Night (higher pressure)
    return 1.0; // Normal hours
  }

  getEventDetails(eventType, sensor) {
    const details = {
      pressure_drop: {
        current_pressure: (sensor.lastPressure * 0.5).toFixed(2),
        normal_pressure: sensor.basePressure.toFixed(2),
        drop_percentage: '50%',
        possible_causes: ['Main line leak', 'Valve closure', 'Pump failure']
      },
      leak_detected: {
        estimated_flow_loss: `${Math.floor(20 + Math.random() * 100)} L/min`,
        confidence: '0.85',
        suggested_action: 'Dispatch inspection team immediately'
      },
      quality_alert: {
        parameter: Math.random() > 0.5 ? 'turbidity' : 'pH',
        value: Math.random() > 0.5 ? '8.5' : '15 NTU',
        threshold: Math.random() > 0.5 ? '8.5' : '5 NTU',
        recommendation: 'Check filtration system'
      }
    };
    
    return details[eventType] || {};
  }

  async sendViaAPI(complaint) {
    try {
      await axios.post('http://localhost:5000/api/complaints', complaint);
      console.log('✅ Complaint sent via API');
    } catch (error) {
      console.error('❌ Failed to send complaint via API:', error.message);
    }
  }
}

class ComplaintGenerator {
  constructor() {
    this.complaintTemplates = [
      {
        ward: 'Nana Peth',
        templates: [
          'No water since yesterday morning. Entire lane affected.',
          'Very low pressure. Water not reaching 2nd floor.',
          'Water comes only for 1 hour in morning.'
        ]
      },
      {
        ward: 'Sadar Bazaar',
        templates: [
          'Water timing irregular. Sometimes morning, sometimes evening.',
          'Pressure drops during peak hours (7-9 AM).',
          'Frequent pipeline leaks in our area.'
        ]
      },
      {
        ward: 'Akkalkot Road',
        templates: [
          'Water quality poor. Yellow color and bad smell.',
          'Supply interrupted for maintenance without notice.',
          'New connection required for recently constructed building.'
        ]
      }
    ];
  }

  generate() {
    const wardData = this.complaintTemplates[Math.floor(Math.random() * this.complaintTemplates.length)];
    const template = wardData.templates[Math.floor(Math.random() * wardData.templates.length)];
    
    return {
      ward: wardData.ward,
      issue: template,
      severity: Math.random() > 0.7 ? 'high' : 'medium',
      timestamp: new Date().toISOString()
    };
  }
}

// Start simulator
const simulator = new SensorSimulator();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping simulator...');
  simulator.client.end();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping simulator...');
  simulator.client.end();
  process.exit(0);
});