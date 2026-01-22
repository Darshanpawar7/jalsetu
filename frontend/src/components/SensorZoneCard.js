import React from 'react';
import './SensorZoneCard.css';

const SensorZoneCard = ({ sensor }) => {
  const getStatusColor = () => {
    const status = sensor.status || 'UNKNOWN';
    const pressure = sensor.pressure || 0;
    
    if (status === 'CRITICAL' || pressure < 1.5) return '#DC2626';
    if (status === 'WARNING' || pressure < 2.0) return '#F59E0B';
    if (status === 'LOW_BATTERY') return '#8B5CF6';
    if (status === 'OFFLINE') return '#6B7280';
    return '#10B981';
  };

  const getStatusText = () => {
    if (sensor.status === 'CRITICAL') return 'Critical - Immediate Attention';
    if (sensor.status === 'WARNING') return 'Warning - Monitor Closely';
    if (sensor.status === 'LOW_BATTERY') return 'Low Battery';
    if (sensor.status === 'OFFLINE') return 'Offline';
    if (sensor.status === 'HEALTHY') return 'Operating Normally';
    return 'Unknown Status';
  };

  const getBatteryIcon = (percentage) => {
    if (percentage >= 80) return '🔋';
    if (percentage >= 40) return '🔋';
    if (percentage >= 20) return '🪫';
    return '🪫';
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    
    const minutes = sensor.lastSeenMinutes;
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  return (
    <div className="sensor-card" style={{ borderLeft: `4px solid ${getStatusColor()}` }}>
      <div className="sensor-header">
        <div className="sensor-id">{sensor.sensor_id}</div>
        <div className="sensor-status" style={{ color: getStatusColor() }}>
          ● {sensor.status || 'UNKNOWN'}
        </div>
      </div>
      
      <div className="sensor-location">
        <span className="location-icon">📍</span>
        {sensor.ward_name || 'Unknown Ward'}
        {sensor.zone && <span className="sensor-zone"> • {sensor.zone}</span>}
      </div>
      
      <div className="sensor-metrics">
        <div className="metric">
          <div className="metric-label">Pressure</div>
          <div className="metric-value">
            {sensor.pressure ? sensor.pressure.toFixed(2) : '--'} 
            <span className="metric-unit">bar</span>
          </div>
          <div className="metric-trend">
            {sensor.pressure && (
              <span className={`trend-indicator ${
                sensor.pressure < 1.5 ? 'trend-down' : 
                sensor.pressure < 2.0 ? 'trend-warning' : 'trend-up'
              }`}>
                {sensor.pressure < 2.0 ? '↓' : '→'}
              </span>
            )}
          </div>
        </div>
        
        <div className="metric">
          <div className="metric-label">Flow Rate</div>
          <div className="metric-value">
            {sensor.flow ? sensor.flow.toFixed(0) : '--'}
            <span className="metric-unit">L/min</span>
          </div>
        </div>
        
        {sensor.battery_percent && (
          <div className="metric">
            <div className="metric-label">Battery</div>
            <div className="metric-value">
              <span className="battery-icon">
                {getBatteryIcon(sensor.battery_percent)}
              </span>
              {sensor.battery_percent}%
            </div>
            <div className="battery-bar">
              <div 
                className="battery-level"
                style={{ 
                  width: `${sensor.battery_percent}%`,
                  backgroundColor: sensor.battery_percent < 20 ? '#DC2626' :
                                 sensor.battery_percent < 40 ? '#F59E0B' : '#10B981'
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="sensor-footer">
        <div className="last-seen">
          <span className="clock-icon">🕒</span>
          Last seen: {formatLastSeen(sensor.last_seen)}
        </div>
        
        <div className="sensor-actions">
          <button className="action-btn view-btn">
            View Details
          </button>
          {sensor.status === 'CRITICAL' && (
            <button className="action-btn alert-btn">
              🚨 Alert Team
            </button>
          )}
        </div>
      </div>
      
      <div className="sensor-status-text">
        {getStatusText()}
        {sensor.pressure && sensor.pressure < 2.0 && (
          <span className="pressure-warning">
            • Low pressure detected
          </span>
        )}
      </div>
    </div>
  );
};

export default SensorZoneCard;