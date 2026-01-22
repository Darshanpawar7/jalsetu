/**
 * Priority Engine - The "Brain" of JalSetu
 * Calculates priority scores and SLA deadlines automatically
 */

class PriorityEngine {
  constructor(db) {
    this.db = db;
    this.rules = {
      // Rule weights (adjustable)
      NO_WATER: 15,
      LOW_PRESSURE: 10,
      LEAK_REPORT: 12,
      HIGH_POPULATION: 8,
      LOW_EQUITY_WARD: 7,
      HISTORIC_LEAK_ZONE: 6,
      MULTIPLE_COMPLAINTS: 5,
      SENSOR_CORROBORATION: 9,
      TIME_OF_DAY: {
        'MORNING_PEAK': 4,  // 6 AM - 10 AM
        'EVENING_PEAK': 4   // 6 PM - 10 PM
      }
    };
  }

  async calculatePriority(complaintData, sensorData = null) {
    let score = 0;
    const factors = [];
    const now = new Date();
    
    // 1. Issue Type Analysis
    const issue = complaintData.issue.toLowerCase();
    if (issue.includes('no water') || issue.includes('zero water')) {
      score += this.rules.NO_WATER;
      factors.push('No water situation');
    }
    if (issue.includes('low pressure') || issue.includes('less pressure')) {
      score += this.rules.LOW_PRESSURE;
      factors.push('Low pressure complaint');
    }
    if (issue.includes('leak') || issue.includes('overflow')) {
      score += this.rules.LEAK_REPORT;
      factors.push('Leak reported');
    }
    
    // 2. Ward-based factors (Localization for Solapur!)
    if (complaintData.ward_id) {
      const wardInfo = await this.getWardInfo(complaintData.ward_id);
      if (wardInfo) {
        // Equity factor: prioritize underserved wards
        if (wardInfo.equity_score < 0.8) {
          score += this.rules.LOW_EQUITY_WARD;
          factors.push(`Underserved ward: ${wardInfo.name}`);
        }
        
        // Population density factor
        if (wardInfo.population > 50000) {
          score += this.rules.HIGH_POPULATION;
          factors.push(`High population area`);
        }
      }
    }
    
    // 3. Historical data check
    const recentComplaints = await this.getRecentComplaints(complaintData.location, complaintData.ward_id);
    if (recentComplaints > 2) {
      score += this.rules.MULTIPLE_COMPLAINTS * Math.min(recentComplaints, 5);
      factors.push(`${recentComplaints} recent complaints in area`);
    }
    
    // 4. Sensor data correlation (if available)
    if (sensorData) {
      if (sensorData.pressure < 1.5) { // Critical low pressure
        score += this.rules.SENSOR_CORROBORATION;
        factors.push(`Sensor confirms low pressure: ${sensorData.pressure} bar`);
      }
    }
    
    // 5. Time-based priority
    const hour = now.getHours();
    if ((hour >= 6 && hour <= 10) || (hour >= 18 && hour <= 22)) {
      score += this.rules.TIME_OF_DAY.MORNING_PEAK;
      factors.push('Peak usage time');
    }
    
    // 6. Determine Priority Level and SLA
    let priority, slaHours;
    if (score >= 25) {
      priority = 'P1';
      slaHours = 4;  // 4 hours for critical issues
    } else if (score >= 15) {
      priority = 'P2';
      slaHours = 12; // 12 hours for high priority
    } else {
      priority = 'P3';
      slaHours = 48; // 48 hours for normal
    }
    
    const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);
    
    return {
      score,
      priority,
      slaHours,
      slaDeadline: slaDeadline.toISOString(),
      factors,
      calculatedAt: now.toISOString()
    };
  }
  
  async getWardInfo(wardId) {
    const result = await this.db.query(
      'SELECT name, equity_score, population FROM wards WHERE id = $1',
      [wardId]
    );
    return result.rows[0] || null;
  }
  
  async getRecentComplaints(location, wardId, hours = 24) {
    const result = await this.db.query(`
      SELECT COUNT(*) as count FROM complaints 
      WHERE ward_id = $1 
      AND created_at > NOW() - INTERVAL '${hours} hours'
      AND status != 'resolved'
    `, [wardId]);
    return parseInt(result.rows[0].count);
  }
  
  // Method to get top priorities for dashboard
  async getTopPriorities(limit = 10) {
    const result = await this.db.query(`
      SELECT 
        t.id,
        t.title,
        t.priority,
        t.priority_score,
        t.sla_deadline,
        w.name as ward_name,
        c.issue,
        EXTRACT(EPOCH FROM (t.sla_deadline - NOW()))/3600 as hours_remaining
      FROM tickets t
      JOIN complaints c ON t.complaint_id = c.id
      JOIN wards w ON c.ward_id = w.id
      WHERE t.status IN ('open', 'assigned')
      ORDER BY 
        CASE t.priority
          WHEN 'P1' THEN 1
          WHEN 'P2' THEN 2
          WHEN 'P3' THEN 3
          ELSE 4
        END,
        t.sla_deadline ASC
      LIMIT $1
    `, [limit]);
    
    return result.rows.map(ticket => ({
      ...ticket,
      isOverdue: ticket.hours_remaining < 0,
      urgency: ticket.hours_remaining < 2 ? 'CRITICAL' : 
               ticket.hours_remaining < 6 ? 'HIGH' : 'NORMAL'
    }));
  }
}

module.exports = PriorityEngine;