// === backend/models/SensorReading.js ===
// SQL table: sensor_readings(id SERIAL, sensor_id TEXT, pressure FLOAT, flow FLOAT, timestamp TIMESTAMP)
module.exports = {
saveReading: async (db, reading) => {
const result = await db.query(
'INSERT INTO sensor_readings (sensor_id, pressure, flow, timestamp) VALUES ($1, $2, $3, NOW()) RETURNING *',
[reading.sensor_id, reading.pressure, reading.flow]
);
return result.rows[0];
}
};