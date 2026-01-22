const express = require('express');
const router = express.Router();

module.exports = (db) => {
  const SensorController = require('../controllers/sensorController');
  const controller = new SensorController(db);

  router.get('/', (req, res) => controller.getSensors(req, res));
  router.get('/readings', (req, res) => controller.getSensorReadings(req, res));
  router.get('/anomalies', (req, res) => controller.detectAnomalies(req, res));
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query(`
        SELECT 
          s.*,
          ST_AsText(s.location) as location_text,
          w.name as ward_name,
          sr.pressure as last_pressure,
          sr.flow as last_flow,
          sr.created_at as last_reading
        FROM sensors s
        LEFT JOIN wards w ON s.ward_id = w.id
        LEFT JOIN sensor_readings sr ON sr.sensor_id = s.sensor_id
        WHERE s.sensor_id = $1 OR s.id = $1
        ORDER BY sr.created_at DESC
        LIMIT 1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Sensor not found' });
      }
      
      const sensor = result.rows[0];
      
      // Parse location
      const locationMatch = sensor.location_text.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      sensor.location = locationMatch ? {
        lng: parseFloat(locationMatch[1]),
        lat: parseFloat(locationMatch[2])
      } : null;
      
      delete sensor.location_text;
      
      // Get recent readings for chart
      const readingsResult = await db.query(`
        SELECT 
          pressure, flow, created_at
        FROM sensor_readings
        WHERE sensor_id = $1
          AND created_at > NOW() - INTERVAL '24 hours'
        ORDER BY created_at ASC
      `, [sensor.sensor_id]);
      
      res.json({
        success: true,
        sensor,
        recentReadings: readingsResult.rows,
        readingsCount: readingsResult.rows.length
      });
      
    } catch (error) {
      console.error('Get sensor error:', error);
      res.status(500).json({ error: 'Failed to fetch sensor' });
    }
  });

  return router;
};