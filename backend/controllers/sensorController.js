class SensorController {
  constructor(db) {
    this.db = db;
  }

  async getSensors(req, res) {
    try {
      const result = await this.db.query(`
        SELECT 
          s.sensor_id,
          s.sensor_type,
          ST_AsText(s.location) as location,
          s.installed_at,
          s.last_seen,
          w.name as ward_name,
          sr.pressure,
          sr.flow,
          sr.quality_ph,
          sr.battery_percent,
          sr.created_at as last_reading
        FROM sensors s
        LEFT JOIN wards w ON s.ward_id = w.id
        LEFT JOIN LATERAL (
          SELECT * FROM sensor_readings 
          WHERE sensor_id = s.sensor_id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) sr ON true
        ORDER BY s.installed_at DESC
      `);
      
      // Process locations for frontend
      const sensors = result.rows.map(row => {
        const locationMatch = row.location ? row.location.match(/POINT\(([^ ]+) ([^ ]+)\)/) : null;
        return {
          ...row,
          location: locationMatch ? {
            lng: parseFloat(locationMatch[1]),
            lat: parseFloat(locationMatch[2])
          } : null,
          status: this.getSensorStatus(row),
          lastSeenMinutes: row.last_seen ? 
            Math.floor((new Date() - new Date(row.last_seen)) / 60000) : null
        };
      });
      
      res.json({
        success: true,
        count: sensors.length,
        sensors
      });
      
    } catch (error) {
      console.error('Get sensors error:', error);
      res.status(500).json({ error: 'Failed to fetch sensor data' });
    }
  }

  async getSensorReadings(req, res) {
    try {
      const { sensor_id, hours = 24 } = req.query;
      
      let query = `
        SELECT 
          pressure,
          flow,
          quality_ph,
          quality_turbidity,
          battery_percent,
          created_at
        FROM sensor_readings
        WHERE created_at > NOW() - INTERVAL '${hours} hours'
      `;
      
      const params = [];
      if (sensor_id) {
        query += ` AND sensor_id = $1`;
        params.push(sensor_id);
      }
      
      query += ` ORDER BY created_at ASC`;
      
      const result = await this.db.query(query, params);
      
      // Calculate statistics
      const readings = result.rows;
      const stats = readings.length > 0 ? {
        avgPressure: readings.reduce((sum, r) => sum + (r.pressure || 0), 0) / readings.length,
        avgFlow: readings.reduce((sum, r) => sum + (r.flow || 0), 0) / readings.length,
        minPressure: Math.min(...readings.map(r => r.pressure || 99)),
        maxPressure: Math.max(...readings.map(r => r.pressure || 0)),
        totalReadings: readings.length
      } : null;
      
      res.json({
        success: true,
        readings,
        stats,
        timeframe: `${hours} hours`
      });
      
    } catch (error) {
      console.error('Get readings error:', error);
      res.status(500).json({ error: 'Failed to fetch sensor readings' });
    }
  }

  async detectAnomalies(req, res) {
    try {
      // Get recent readings for all sensors
      const result = await this.db.query(`
        WITH recent_readings AS (
          SELECT 
            sensor_id,
            pressure,
            flow,
            created_at,
            LAG(pressure) OVER (PARTITION BY sensor_id ORDER BY created_at) as prev_pressure,
            LAG(flow) OVER (PARTITION BY sensor_id ORDER BY created_at) as prev_flow
          FROM sensor_readings
          WHERE created_at > NOW() - INTERVAL '2 hours'
        )
        SELECT 
          r.sensor_id,
          s.location,
          w.name as ward_name,
          r.pressure,
          r.flow,
          r.created_at,
          CASE 
            WHEN r.pressure < 1.5 THEN 'CRITICAL_LOW_PRESSURE'
            WHEN r.pressure < 2.0 THEN 'LOW_PRESSURE'
            WHEN ABS(r.pressure - r.prev_pressure) > 1.0 THEN 'PRESSURE_SPIKE'
            WHEN r.flow < 50 THEN 'LOW_FLOW'
            WHEN r.flow > 300 THEN 'HIGH_FLOW'
            ELSE 'NORMAL'
          END as anomaly_type,
          CASE 
            WHEN r.pressure < 1.5 THEN 0.9
            WHEN r.pressure < 2.0 THEN 0.7
            WHEN ABS(r.pressure - r.prev_pressure) > 1.0 THEN 0.6
            WHEN r.flow < 50 THEN 0.5
            WHEN r.flow > 300 THEN 0.5
            ELSE 0.0
          END as confidence
        FROM recent_readings r
        JOIN sensors s ON r.sensor_id = s.sensor_id
        LEFT JOIN wards w ON s.ward_id = w.id
        WHERE r.created_at = (SELECT MAX(created_at) FROM recent_readings rr WHERE rr.sensor_id = r.sensor_id)
          AND (
            r.pressure < 2.0 OR 
            ABS(r.pressure - r.prev_pressure) > 1.0 OR
            r.flow < 50 OR 
            r.flow > 300
          )
        ORDER BY confidence DESC
      `);
      
      const anomalies = result.rows.map(row => ({
        ...row,
        severity: this.getAnomalySeverity(row.anomaly_type),
        recommendedAction: this.getRecommendedAction(row.anomaly_type, row.pressure)
      }));
      
      // Emit real-time alerts for critical anomalies
      const criticalAnomalies = anomalies.filter(a => a.severity === 'CRITICAL');
      if (criticalAnomalies.length > 0 && req.app.get('io')) {
        req.app.get('io').emit('sensor_anomaly', {
          type: 'critical_anomalies',
          anomalies: criticalAnomalies,
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({
        success: true,
        anomalies,
        criticalCount: criticalAnomalies.length,
        totalChecked: result.rows.length,
        generatedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Anomaly detection error:', error);
      res.status(500).json({ error: 'Failed to detect anomalies' });
    }
  }

  getSensorStatus(sensor) {
    if (!sensor.last_seen) return 'OFFLINE';
    
    const minutesAgo = Math.floor((new Date() - new Date(sensor.last_seen)) / 60000);
    
    if (minutesAgo > 120) return 'OFFLINE';
    if (minutesAgo > 30) return 'WARNING';
    if (sensor.battery_percent < 20) return 'LOW_BATTERY';
    if (sensor.pressure < 1.5) return 'CRITICAL';
    if (sensor.pressure < 2.0) return 'WARNING';
    
    return 'HEALTHY';
  }

  getAnomalySeverity(anomalyType) {
    const severityMap = {
      'CRITICAL_LOW_PRESSURE': 'CRITICAL',
      'LOW_PRESSURE': 'HIGH',
      'PRESSURE_SPIKE': 'MEDIUM',
      'LOW_FLOW': 'MEDIUM',
      'HIGH_FLOW': 'MEDIUM'
    };
    return severityMap[anomalyType] || 'LOW';
  }

  getRecommendedAction(anomalyType, pressure) {
    const actions = {
      'CRITICAL_LOW_PRESSURE': 'Immediate inspection required. Possible major leak or valve failure.',
      'LOW_PRESSURE': 'Schedule inspection. Check for leaks or valve issues.',
      'PRESSURE_SPIKE': 'Monitor closely. Could indicate valve operation or pump issue.',
      'LOW_FLOW': 'Check for blockages or meter issues.',
      'HIGH_FLOW': 'Verify meter reading. Possible leak downstream.'
    };
    return actions[anomalyType] || 'Monitor and investigate';
  }
}

module.exports = SensorController;