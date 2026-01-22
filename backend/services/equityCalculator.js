/**
 * Equity Calculator - Measures fairness in water distribution
 */

class EquityCalculator {
  constructor(db) {
    this.db = db;
  }
  
  async calculateWardEquity(wardId) {
    // Get ward data
    const wardResult = await this.db.query(`
      SELECT 
        w.*,
        COUNT(DISTINCT c.id) as complaint_count,
        AVG(sr.pressure) as avg_pressure,
        AVG(sr.flow) as avg_flow
      FROM wards w
      LEFT JOIN complaints c ON w.id = c.ward_id 
        AND c.created_at > NOW() - INTERVAL '7 days'
        AND c.status != 'resolved'
      LEFT JOIN sensors s ON w.id = s.ward_id
      LEFT JOIN sensor_readings sr ON s.sensor_id = sr.sensor_id 
        AND sr.created_at > NOW() - INTERVAL '24 hours'
      WHERE w.id = $1
      GROUP BY w.id
    `, [wardId]);
    
    if (wardResult.rows.length === 0) return null;
    
    const ward = wardResult.rows[0];
    
    // Get city averages for comparison
    const cityResult = await this.db.query(`
      SELECT 
        AVG(avg_supply_hours) as city_avg_supply,
        AVG(
          SELECT AVG(pressure) FROM sensor_readings 
          WHERE created_at > NOW() - INTERVAL '24 hours'
        ) as city_avg_pressure
      FROM wards
    `);
    
    const cityAvg = cityResult.rows[0];
    
    // Calculate equity score (0.0 to 2.0, where 1.0 is perfectly equitable)
    let equityScore = 1.0;
    
    // Factor 1: Supply hours compared to city average
    const supplyRatio = ward.avg_supply_hours / cityAvg.city_avg_supply;
    equityScore *= supplyRatio;
    
    // Factor 2: Pressure compared to city average
    if (ward.avg_pressure) {
      const pressureRatio = ward.avg_pressure / cityAvg.city_avg_pressure;
      equityScore *= pressureRatio;
    }
    
    // Factor 3: Complaint density penalty
    const complaintPenalty = Math.max(0.7, 1 - (ward.complaint_count / 100));
    equityScore *= complaintPenalty;
    
    // Normalize and cap
    equityScore = Math.max(0.3, Math.min(2.0, equityScore));
    
    // Determine equity level
    let equityLevel, color, description;
    if (equityScore >= 1.3) {
      equityLevel = 'EXCELLENT';
      color = '#10B981'; // Green
      description = 'Above average water access';
    } else if (equityScore >= 0.9) {
      equityLevel = 'FAIR';
      color = '#3B82F6'; // Blue
      description = 'Adequate water access';
    } else if (equityScore >= 0.6) {
      equityLevel = 'MODERATE';
      color = '#F59E0B'; // Yellow
      description = 'Below average, needs attention';
    } else {
      equityLevel = 'POOR';
      color = '#EF4444'; // Red
      description = 'Critical water access issues';
    }
    
    return {
      wardId: ward.id,
      wardName: ward.name,
      equityScore: parseFloat(equityScore.toFixed(2)),
      equityLevel,
      color,
      description,
      metrics: {
        supplyHours: ward.avg_supply_hours,
        cityAvgSupply: parseFloat(cityAvg.city_avg_supply.toFixed(1)),
        avgPressure: ward.avg_pressure ? parseFloat(ward.avg_pressure.toFixed(2)) : null,
        complaintCount: parseInt(ward.complaint_count),
        lastUpdated: new Date().toISOString()
      },
      recommendations: this.generateRecommendations(equityScore, ward)
    };
  }
  
  async calculateCitywideEquity() {
    const wardsResult = await this.db.query(`
      SELECT id, name FROM wards ORDER BY name
    `);
    
    const equityScores = [];
    for (const ward of wardsResult.rows) {
      const score = await this.calculateWardEquity(ward.id);
      if (score) equityScores.push(score);
    }
    
    // Calculate Gini coefficient (measure of inequality)
    const scores = equityScores.map(s => s.equityScore);
    const gini = this.calculateGiniCoefficient(scores);
    
    // Overall city equity
    const averageEquity = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    return {
      overallScore: parseFloat(averageEquity.toFixed(2)),
      giniCoefficient: parseFloat(gini.toFixed(3)),
      wardCount: equityScores.length,
      wards: equityScores.sort((a, b) => a.equityScore - b.equityScore),
      timestamp: new Date().toISOString(),
      summary: this.generateCitySummary(averageEquity, gini)
    };
  }
  
  calculateGiniCoefficient(values) {
    // Sort values
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    
    // Calculate Gini coefficient
    let numerator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (2 * i - n + 1) * sorted[i];
    }
    
    const denominator = n * sorted.reduce((sum, val) => sum + val, 0);
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  generateRecommendations(score, ward) {
    const recommendations = [];
    
    if (score < 0.7) {
      recommendations.push(
        `Priority intervention needed in ${ward.name}`,
        'Consider increasing supply hours during peak demand',
        'Install additional pressure monitoring sensors',
        'Schedule pipe network inspection for leaks'
      );
    } else if (score < 0.9) {
      recommendations.push(
        `Monitor water distribution in ${ward.name}`,
        'Optimize supply timing based on consumption patterns',
        'Engage with community for feedback'
      );
    } else if (score < 1.1) {
      recommendations.push(
        `Maintain current service levels in ${ward.name}`,
        'Continue regular monitoring'
      );
    } else {
      recommendations.push(
        `Share best practices from ${ward.name} with other wards`,
        'Consider redistributing excess to underserved areas'
      );
    }
    
    return recommendations;
  }
  
  generateCitySummary(averageEquity, gini) {
    if (averageEquity < 0.7 || gini > 0.3) {
      return {
        status: 'HIGH INEQUALITY',
        message: 'Significant disparities in water access across wards',
        action: 'Immediate redistributive measures recommended'
      };
    } else if (averageEquity < 0.9 || gini > 0.2) {
      return {
        status: 'MODERATE INEQUALITY',
        message: 'Noticeable differences in water access',
        action: 'Targeted improvements needed in low-scoring wards'
      };
    } else {
      return {
        status: 'GOOD EQUITY',
        message: 'Relatively equitable water distribution',
        action: 'Maintain and monitor current distribution'
      };
    }
  }
}

module.exports = EquityCalculator;