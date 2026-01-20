// === backend/routes/sensors.js ===
const express = require('express');
const router = express.Router();


router.get('/', async (req, res) => {
const db = req.app.get('db');
try {
const result = await db.query(
'SELECT sensor_id, AVG(pressure) as pressure, AVG(flow) as flow FROM sensor_readings GROUP BY sensor_id ORDER BY sensor_id'
);
res.json(result.rows);
} catch (err) {
console.error('Sensor fetch error:', err.message);
res.status(500).json({ error: 'Internal Server Error' });
}
});


module.exports = router;