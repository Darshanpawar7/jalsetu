const asyncHandler = require('../utils/asyncHandler');

module.exports = (db) => ({
  getSensors: asyncHandler(async (req, res) => {
    const result = await db.query(`
      SELECT 
        s.sensor_id,
        s.sensor_type,
        ST_AsText(s.location) AS location,
        s.installed_at,
        s.last_seen,
        w.name AS ward_name,
        sr.pressure,
        sr.flow,
        sr.quality_ph,
        sr.battery_percent,
        sr.created_at AS last_reading
      FROM sensors s
      LEFT JOIN wards w ON s.ward_id = w.id
      LEFT JOIN LATERAL (
        SELECT *
        FROM sensor_readings
        WHERE sensor_id = s.sensor_id
        ORDER BY created_at DESC
        LIMIT 1
      ) sr ON true
      ORDER BY s.installed_at DESC
    `);

    const sensors = result.rows.map(row => {
      let location = null;
      if (row.location) {
        const match = row.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
        if (match) {
          location = {
            lng: parseFloat(match[1]),
            lat: parseFloat(match[2])
          };
        }
      }

      return {
        ...row,
        location,
        status: getSensorStatus(row)
      };
    });

    res.json({
      success: true,
      sensors
    });
  }),

  getSensorReadings: asyncHandler(async (req, res) => {
    const { sensor_id, hours = 24 } = req.query;

    if (!sensor_id) {
      return res.status(400).json({ error: 'sensor_id is required' });
    }

    const result = await db.query(
      `
      SELECT pressure, flow, quality_ph, battery_percent, created_at
      FROM sensor_readings
      WHERE sensor_id = $1
        AND created_at > NOW() - ($2 || ' hours')::INTERVAL
      ORDER BY created_at ASC
      `,
      [sensor_id, Number(hours)]
    );

    res.json({
      success: true,
      readings: result.rows
    });
  })
});

/* ---------- helpers ---------- */

function getSensorStatus(sensor) {
  if (!sensor.last_seen) return 'OFFLINE';

  const minutesAgo =
    (Date.now() - new Date(sensor.last_seen).getTime()) / 60000;

  if (minutesAgo > 120) return 'OFFLINE';
  if (minutesAgo > 30) return 'WARNING';
  if (sensor.battery_percent !== null && sensor.battery_percent < 20)
    return 'LOW_BATTERY';
  if (sensor.pressure !== null && sensor.pressure < 1.5)
    return 'CRITICAL';

  return 'HEALTHY';
}
