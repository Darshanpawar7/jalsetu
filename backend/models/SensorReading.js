// backend/models/SensorReading.js
class SensorReading {
  static async saveReading(db, { sensor_id, pressure, flow }) {
    const query = `
      INSERT INTO sensor_readings (sensor_id, pressure, flow, created_at)
      VALUES ($1, $2, $3, NOW())
    `;
    await db.query(query, [sensor_id, pressure, flow]);
  }
}

module.exports = SensorReading;
