import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './EquityWidget.css';

const EquityWidget = ({ data }) => {
  const equityData = data?.wards || [];
  
  const COLORS = {
    EXCELLENT: '#10B981',
    GOOD: '#3B82F6',
    FAIR: '#F59E0B',
    POOR: '#EF4444'
  };

  const getLevelColor = (level) => {
    return COLORS[level] || '#6B7280';
  };

  const equityLevels = equityData.reduce((acc, ward) => {
    acc[ward.equityLevel] = (acc[ward.equityLevel] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(equityLevels).map(([level, count]) => ({
    name: level,
    value: count,
    color: getLevelColor(level)
  }));

  const getCityStatus = (score) => {
    if (!score) return { text: 'Calculating...', color: '#6B7280' };
    if (score >= 1.2) return { text: 'Excellent Equity', color: '#10B981' };
    if (score >= 1.0) return { text: 'Good Equity', color: '#3B82F6' };
    if (score >= 0.8) return { text: 'Fair Equity', color: '#F59E0B' };
    return { text: 'Needs Improvement', color: '#EF4444' };
  };

  const cityStatus = getCityStatus(data?.overallScore);

  const topWards = [...equityData]
    .sort((a, b) => b.equityScore - a.equityScore)
    .slice(0, 3);

  const bottomWards = [...equityData]
    .sort((a, b) => a.equityScore - b.equityScore)
    .slice(0, 3);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="equity-tooltip">
          <p className="tooltip-label">{payload[0].name}</p>
          <p className="tooltip-value">{payload[0].value} wards</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="equity-widget">
      <div className="equity-header">
        <h3>Water Equity Dashboard</h3>
        <div className="city-status" style={{ color: cityStatus.color }}>
          {cityStatus.text}
        </div>
      </div>

      <div className="equity-score">
        <div className="score-main">
          <span className="score-value">
            {data?.overallScore ? data.overallScore.toFixed(2) : '1.00'}
          </span>
          <span className="score-label">Overall Equity Score</span>
        </div>
        <div className="score-detail">
          <div className="detail-item">
            <span className="detail-label">Gini Coefficient:</span>
            <span className="detail-value">
              {data?.giniCoefficient ? data.giniCoefficient.toFixed(3) : '0.000'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Wards Monitored:</span>
            <span className="detail-value">{data?.wardCount || 0}</span>
          </div>
        </div>
      </div>

      <div className="equity-chart">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={(entry) => entry.name}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          {chartData.map((item, index) => (
            <div key={index} className="legend-item">
              <span 
                className="legend-color" 
                style={{ backgroundColor: item.color }}
              />
              <span className="legend-text">
                {item.name}: {item.value} wards
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="ward-performance">
        <div className="performance-section">
          <h4>🏆 Top Performing Wards</h4>
          {topWards.map(ward => (
            <div key={ward.wardId} className="ward-item">
              <span className="ward-name">{ward.wardName}</span>
              <span 
                className="ward-score"
                style={{ color: getLevelColor(ward.equityLevel) }}
              >
                {ward.equityScore}
              </span>
            </div>
          ))}
        </div>

        <div className="performance-section">
          <h4>📈 Needs Attention</h4>
          {bottomWards.map(ward => (
            <div key={ward.wardId} className="ward-item">
              <span className="ward-name">{ward.wardName}</span>
              <span 
                className="ward-score"
                style={{ color: getLevelColor(ward.equityLevel) }}
              >
                {ward.equityScore}
              </span>
            </div>
          ))}
        </div>
      </div>

      {data?.summary && (
        <div className="equity-summary">
          <h4>📋 Summary</h4>
          <p className="summary-status">{data.summary.status}</p>
          <p className="summary-message">{data.summary.message}</p>
          <p className="summary-action">
            <strong>Recommended Action:</strong> {data.summary.action}
          </p>
        </div>
      )}

      <div className="equity-footer">
        <div className="last-updated">
          Updated: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '--:--'}
        </div>
        <button className="refresh-btn">
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
};

export default EquityWidget;