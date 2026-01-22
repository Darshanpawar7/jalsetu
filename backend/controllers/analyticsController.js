const EquityCalculator = require('../services/equityCalculator');

class AnalyticsController {
  constructor(db) {
    this.db = db;
    this.equityCalculator = new EquityCalculator(db);
  }

  async getEquityData(req, res) {
    try {
      const equityData = await this.equityCalculator.calculateCitywideEquity();
      
      res.json({
        success: true,
        ...equityData
      });
      
    } catch (error) {
      console.error('Equity data error:', error);
      res.status(500).json({ error: 'Failed to calculate equity data' });
    }
  }

  async getPerformanceMetrics(req, res) {
    try {
      const { days = 30 } = req.query;
      
      // SLA Performance
      const slaResult = await this.db.query(`
        SELECT 
          COUNT(*) as total_tickets,
          COUNT(CASE WHEN met_sla THEN 1 END) as sla_met,
          COUNT(CASE WHEN NOT met_sla THEN 1 END) as sla_missed,
          AVG(EXTRACT(EPOCH FROM (actual_close - expected_close))/3600) as avg_delay_hours
        FROM sla_logs
        WHERE logged_at > NOW() - INTERVAL '${days} days'
      `);
      
      // Resolution time by priority
      const resolutionResult = await this.db.query(`
        SELECT 
          t.priority,
          COUNT(*) as ticket_count,
          AVG(EXTRACT(EPOCH FROM (t.closed_at - t.created_at))/3600) as avg_resolution_hours,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (t.closed_at - t.created_at))/3600) as median_resolution_hours
        FROM tickets t
        WHERE t.closed_at IS NOT NULL
          AND t.created_at > NOW() - INTERVAL '${days} days'
        GROUP BY t.priority
        ORDER BY 
          CASE t.priority
            WHEN 'P1' THEN 1
            WHEN 'P2' THEN 2
            WHEN 'P3' THEN 3
            ELSE 4
          END
      `);
      
      // Ward performance
      const wardPerformance = await this.db.query(`
        SELECT 
          w.name as ward,
          COUNT(c.id) as total_complaints,
          COUNT(CASE WHEN c.status = 'resolved' THEN 1 END) as resolved,
          AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at))/3600) as avg_resolution_hours
        FROM wards w
        LEFT JOIN complaints c ON w.id = c.ward_id 
          AND c.created_at > NOW() - INTERVAL '${days} days'
        GROUP BY w.id, w.name
        ORDER BY total_complaints DESC
      `);
      
      // JE (Junior Engineer) performance
      const jePerformance = await this.db.query(`
        SELECT 
          assigned_to as je_name,
          COUNT(*) as tickets_assigned,
          COUNT(CASE WHEN status = 'closed' THEN 1 END) as tickets_closed,
          AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/3600) as avg_completion_time,
          AVG(verification_score) as avg_verification_score
        FROM tickets
        WHERE assigned_to IS NOT NULL
          AND created_at > NOW() - INTERVAL '${days} days'
        GROUP BY assigned_to
        ORDER BY tickets_closed DESC
        LIMIT 10
      `);
      
      res.json({
        success: true,
        timeframe: `${days} days`,
        slaPerformance: slaResult.rows[0],
        resolutionByPriority: resolutionResult.rows,
        wardPerformance: wardPerformance.rows,
        jePerformance: jePerformance.rows,
        generatedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Performance metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
  }

  async getWaterLossAnalysis(req, res) {
    try {
      // This is a simplified calculation
      // In production, you'd use DMA metering data
      
      const lossResult = await this.db.query(`
        WITH daily_stats AS (
          SELECT 
            DATE(created_at) as date,
            COUNT(DISTINCT le.id) as leak_count,
            SUM(le.estimated_loss_lph) * 24 as estimated_daily_loss_liters
          FROM leak_events le
          WHERE le.created_at > NOW() - INTERVAL '30 days'
            AND le.status = 'detected'
          GROUP BY DATE(created_at)
        )
        SELECT 
          AVG(leak_count) as avg_daily_leaks,
          AVG(estimated_daily_loss_liters) as avg_daily_loss_liters,
          SUM(estimated_daily_loss_liters) as total_loss_30days
        FROM daily_stats
      `);
      
      const wardLoss = await this.db.query(`
        SELECT 
          w.name as ward,
          COUNT(le.id) as leak_count,
          SUM(le.estimated_loss_lph * 24) as estimated_daily_loss,
          AVG(le.confidence) as avg_detection_confidence
        FROM leak_events le
        JOIN wards w ON le.ward_id = w.id
        WHERE le.created_at > NOW() - INTERVAL '30 days'
        GROUP BY w.id, w.name
        ORDER BY estimated_daily_loss DESC
      `);
      
      const recoveryTrend = await this.db.query(`
        SELECT 
          DATE(t.closed_at) as date,
          COUNT(*) as repairs_completed,
          AVG(EXTRACT(EPOCH FROM (t.closed_at - le.created_at))/3600) as avg_time_to_repair
        FROM tickets t
        JOIN leak_events le ON t.sensor_alert_id = le.id
        WHERE t.closed_at IS NOT NULL
          AND t.closed_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(t.closed_at)
        ORDER BY date
      `);
      
      res.json({
        success: true,
        waterLoss: lossResult.rows[0],
        wardWiseLoss: wardLoss.rows,
        recoveryTrend: recoveryTrend.rows,
        assumptions: 'Based on sensor-estimated leak flow rates',
        timeframe: 'Last 30 days',
        generatedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Water loss analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze water loss' });
    }
  }

  async getWardAnalytics(req, res) {
    try {
      const { id } = req.params;
      
      // Ward basic info
      const wardInfo = await this.db.query(`
        SELECT * FROM wards WHERE id = $1
      `, [id]);
      
      if (wardInfo.rows.length === 0) {
        return res.status(404).json({ error: 'Ward not found' });
      }
      
      const ward = wardInfo.rows[0];
      
      // Complaint trends
      const complaintsTrend = await this.db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as complaint_count,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count
        FROM complaints
        WHERE ward_id = $1
          AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `, [id]);
      
      // Sensor data
      const sensorData = await this.db.query(`
        SELECT 
          s.sensor_id,
          s.sensor_type,
          AVG(sr.pressure) as avg_pressure,
          AVG(sr.flow) as avg_flow,
          MIN(sr.pressure) as min_pressure,
          MAX(sr.pressure) as max_pressure,
          COUNT(sr.id) as reading_count
        FROM sensors s
        JOIN sensor_readings sr ON s.sensor_id = sr.sensor_id
        WHERE s.ward_id = $1
          AND sr.created_at > NOW() - INTERVAL '7 days'
        GROUP BY s.sensor_id, s.sensor_type
      `, [id]);
      
      // Leak events
      const leakEvents = await this.db.query(`
        SELECT 
          le.*,
          t.status as repair_status,
          t.closed_at as repair_date
        FROM leak_events le
        LEFT JOIN tickets t ON t.sensor_alert_id = le.id
        WHERE le.ward_id = $1
          AND le.created_at > NOW() - INTERVAL '30 days'
        ORDER BY le.created_at DESC
        LIMIT 20
      `, [id]);
      
      // Equity score
      const equityScore = await this.equityCalculator.calculateWardEquity(id);
      
      res.json({
        success: true,
        ward,
        complaintsTrend: complaintsTrend.rows,
        sensorData: sensorData.rows,
        leakEvents: leakEvents.rows,
        equity: equityScore,
        generatedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Ward analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch ward analytics' });
    }
  }
}

module.exports = AnalyticsController;