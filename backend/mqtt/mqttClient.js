const mqtt = require('mqtt');
const { PRIORITY, TICKET_STATUS } = require('../utils/status');

class MQTTClient {
  constructor(db, io) {
    this.db = db;
    this.io = io;
    this.client = mqtt.connect(process.env.MQTT_BROKER);
    this.init();
  }

  init() {
    this.client.on('connect', () => {
      this.client.subscribe('sensors/+/data');
    });

    this.client.on('message', async (topic, msg) => {
      const data = JSON.parse(msg.toString());
      if (data.pressure < 1.5) {
        await this.createLeakTicket(topic.split('/')[1], data);
      }
    });
  }

  async createLeakTicket(sensorId, data) {
    const leak = await this.db.query(
      `INSERT INTO leak_events(confidence, detected_by)
       VALUES(0.9,'sensor') RETURNING id`
    );

    await this.db.query(
      `INSERT INTO tickets
       (sensor_alert_id, priority, status)
       VALUES ($1,$2,$3)`,
      [leak.rows[0].id, PRIORITY.P1, TICKET_STATUS.OPEN]
    );

    this.io.emit('critical_alert', { sensorId, pressure: data.pressure });
  }
}

module.exports = MQTTClient;
