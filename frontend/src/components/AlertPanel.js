import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import './AlertPanel.css';

const AlertPanel = ({ alerts = [] }) => {
  const [filter, setFilter] = useState('all');

  const getAlertIcon = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return 'ℹ️';
      default: return '📢';
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'critical': return '#DC2626';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.severity?.toLowerCase() === filter;
  });

  const handleAcknowledge = (alertId) => {
    // In a real app, this would call an API
    console.log('Acknowledged alert:', alertId);
  };

  const handleResolve = (alertId) => {
    // In a real app, this would call an API
    console.log('Resolved alert:', alertId);
  };

  if (alerts.length === 0) {
    return (
      <div className="alerts-empty">
        <div className="empty-icon">✅</div>
        <p>No active alerts</p>
        <p className="empty-subtext">All systems operating normally</p>
      </div>
    );
  }

  return (
    <div className="alert-panel">
      <div className="alert-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({alerts.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'critical' ? 'active' : ''}`}
          onClick={() => setFilter('critical')}
        >
          Critical ({alerts.filter(a => a.severity === 'critical').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'high' ? 'active' : ''}`}
          onClick={() => setFilter('high')}
        >
          High ({alerts.filter(a => a.severity === 'high').length})
        </button>
      </div>

      <div className="alert-list">
        {filteredAlerts.slice(0, 10).map((alert, index) => (
          <div 
            key={index} 
            className="alert-item"
            style={{ borderLeft: `4px solid ${getSeverityColor(alert.severity)}` }}
          >
            <div className="alert-header">
              <div className="alert-icon">
                {getAlertIcon(alert.severity)}
              </div>
              <div className="alert-title">
                <h4>{alert.message}</h4>
                <div className="alert-meta">
                  <span className="alert-severity" style={{ color: getSeverityColor(alert.severity) }}>
                    {alert.severity?.toUpperCase() || 'ALERT'}
                  </span>
                  <span className="alert-time">
                    {alert.timestamp ? formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true }) : 'Just now'}
                  </span>
                  {alert.ward && (
                    <span className="alert-ward">📍 {alert.ward}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="alert-body">
              {alert.sensorId && (
                <div className="alert-detail">
                  <strong>Sensor:</strong> {alert.sensorId}
                </div>
              )}
              {alert.value !== undefined && alert.threshold !== undefined && (
                <div className="alert-detail">
                  <strong>Value:</strong> {alert.value} (Threshold: {alert.threshold})
                </div>
              )}
              {alert.type && (
                <div className="alert-detail">
                  <strong>Type:</strong> {alert.type.replace('_', ' ')}
                </div>
              )}
              {alert.priority && (
                <div className="alert-detail">
                  <strong>Priority:</strong> {alert.priority}
                </div>
              )}
            </div>

            <div className="alert-actions">
              <button 
                className="alert-btn acknowledge-btn"
                onClick={() => handleAcknowledge(index)}
              >
                Acknowledge
              </button>
              <button 
                className="alert-btn resolve-btn"
                onClick={() => handleResolve(index)}
              >
                Mark Resolved
              </button>
              {alert.severity === 'critical' && (
                <button className="alert-btn escalate-btn">
                  Escalate to JE
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAlerts.length > 10 && (
        <div className="alert-footer">
          <p className="alert-more">
            Showing 10 of {filteredAlerts.length} alerts. 
            <button className="view-all-btn">View All</button>
          </p>
        </div>
      )}
    </div>
  );
};

export default AlertPanel;