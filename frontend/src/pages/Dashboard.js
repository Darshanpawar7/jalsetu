import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import { toast } from 'react-hot-toast';
import MapView from '../components/MapView';
import SensorZoneCard from '../components/SensorZoneCard';
import ComplaintForm from '../components/ComplaintForm';
import AlertPanel from '../components/AlertPanel';
import EquityWidget from '../components/EquityWidget';
import DemoController from '../components/DemoController';
import { 
  fetchSensors, 
  fetchComplaints, 
  fetchTickets, 
  fetchAnalytics,
  startDemo,
  nextDemoStep
} from '../services/api';
import { connectWebSocket, disconnectWebSocket } from '../services/socket';
import './Dashboard.css';

const Dashboard = ({ alerts: propAlerts }) => {
  // State management
  const [sensors, setSensors] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState(propAlerts || []);
  const [equityData, setEquityData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [demoStatus, setDemoStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize data fetch
  useEffect(() => {
    loadDashboardData();
    
    // Set up periodic refresh
    const interval = setInterval(loadDashboardData, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  // WebSocket setup for real-time updates
  useEffect(() => {
    const socket = connectWebSocket({
      onSensorUpdate: (data) => {
        setSensors(prev => prev.map(sensor => 
          sensor.sensor_id === data.sensorId ? { ...sensor, ...data.data } : sensor
        ));
      },
      onAlert: (alert) => {
        setAlerts(prev => [alert, ...prev.slice(0, 9)]);
        showAlertNotification(alert);
      },
      onNewComplaint: (complaint) => {
        setComplaints(prev => [complaint, ...prev]);
        toast.success(`New complaint from ${complaint.ward}`);
      },
      onTicketUpdate: (ticket) => {
        setTickets(prev => prev.map(t => 
          t.id === ticket.ticketId ? { ...t, ...ticket } : t
        ));
      },
      onDemoEvent: (event) => {
        console.log('Demo event received:', event);
        if (event.type === 'demo_started') {
          setDemoStatus('in_progress');
          toast.success('Demo started!');
        }
      }
    });

    return () => disconnectWebSocket();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Parallel data fetching for efficiency
      const [sensorsData, complaintsData, ticketsData, analyticsData] = await Promise.all([
        fetchSensors(),
        fetchComplaints({ days: 1 }),
        fetchTickets(),
        fetchAnalytics('equity')
      ]);

      setSensors(sensorsData.sensors || []);
      setComplaints(complaintsData.complaints || []);
      setTickets(ticketsData.tickets || []);
      setAnalytics(analyticsData);
      setEquityData(analyticsData);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const showAlertNotification = (alert) => {
    const alertConfigs = {
      critical: {
        icon: '🚨',
        style: { background: '#EF4444', color: 'white' }
      },
      high: {
        icon: '⚠️',
        style: { background: '#F59E0B', color: 'white' }
      },
      medium: {
        icon: 'ℹ️',
        style: { background: '#3B82F6', color: 'white' }
      }
    };

    const config = alertConfigs[alert.severity?.toLowerCase()] || alertConfigs.medium;
    
    toast(alert.message, {
      icon: config.icon,
      duration: 5000,
      style: config.style
    });
  };

  const handleStartDemo = async () => {
    try {
      const result = await startDemo();
      setDemoStatus('in_progress');
      toast.success('Demo started successfully!');
      console.log('Demo started:', result);
    } catch (error) {
      toast.error('Failed to start demo');
      console.error('Demo start error:', error);
    }
  };

  const handleNextDemoStep = async () => {
    try {
      const result = await nextDemoStep();
      toast.success(`Demo step completed: ${result.step}`);
      console.log('Demo step:', result);
    } catch (error) {
      toast.error('Failed to execute demo step');
      console.error('Demo step error:', error);
    }
  };

  // Calculate dashboard metrics
  const metrics = {
    totalSensors: sensors.length,
    activeSensors: sensors.filter(s => s.status === 'HEALTHY').length,
    criticalSensors: sensors.filter(s => s.status === 'CRITICAL').length,
    totalComplaints: complaints.length,
    resolvedComplaints: complaints.filter(c => c.status === 'resolved').length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    highPriorityTickets: tickets.filter(t => t.priority === 'P1').length,
    avgResolutionTime: analytics?.stats?.avg_resolution_hours 
      ? `${analytics.stats.avg_resolution_hours.toFixed(1)} hours` 
      : 'N/A'
  };

  // Data for charts
  const pressureData = sensors.map(sensor => ({
    name: sensor.sensor_id,
    pressure: sensor.pressure || 0,
    status: sensor.status
  }));

  const complaintsByWard = complaints.reduce((acc, complaint) => {
    const ward = complaint.ward_name || 'Unknown';
    acc[ward] = (acc[ward] || 0) + 1;
    return acc;
  }, {});

  const wardChartData = Object.entries(complaintsByWard).map(([ward, count]) => ({
    ward,
    complaints: count
  })).slice(0, 8); // Top 8 wards

  const ticketPriorityData = [
    { priority: 'P1', count: tickets.filter(t => t.priority === 'P1').length },
    { priority: 'P2', count: tickets.filter(t => t.priority === 'P2').length },
    { priority: 'P3', count: tickets.filter(t => t.priority === 'P3').length }
  ];

  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading JalSetu Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Dashboard Header with Quick Stats */}
      <div className="dashboard-header">
        <h2>🚰 JalSetu Live Water Dashboard</h2>
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-value">{metrics.totalSensors}</div>
            <div className="stat-label">Total Sensors</div>
            <div className="stat-subtext">
              {metrics.activeSensors} active • {metrics.criticalSensors} critical
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{metrics.totalComplaints}</div>
            <div className="stat-label">Today's Complaints</div>
            <div className="stat-subtext">
              {metrics.resolvedComplaints} resolved
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{metrics.openTickets}</div>
            <div className="stat-label">Open Tickets</div>
            <div className="stat-subtext">
              {metrics.highPriorityTickets} high priority
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{metrics.avgResolutionTime}</div>
            <div className="stat-label">Avg Resolution Time</div>
            <div className="stat-subtext">Last 24 hours</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          📝 Complaints
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          🎫 Tickets
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sensors' ? 'active' : ''}`}
          onClick={() => setActiveTab('sensors')}
        >
          📡 Sensors
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Map View - Full Width */}
        <div className="card grid-full">
          <div className="card-header">
            <h3 className="card-title">📍 Live Water Network Map</h3>
            <div className="card-actions">
              <span className="status-badge status-info">
                Real-time • {sensors.length} sensors monitoring
              </span>
            </div>
          </div>
          <MapView sensors={sensors} complaints={complaints} />
          <div className="map-legend">
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#10B981' }}></span>
              <span>Normal Pressure ({'>'}2.5 bar)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#F59E0B' }}></span>
              <span>Low Pressure (1.5-2.5 bar)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#EF4444' }}></span>
              <span>Critical Pressure ({'<'}1.5 bar)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#3B82F6' }}></span>
              <span>Complaint Location</span>
            </div>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🚨 Live Alerts</h3>
            <span className="status-badge status-danger">
              {alerts.length} Active
            </span>
          </div>
          <AlertPanel alerts={alerts} />
        </div>

        {/* Demo Controller */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🎬 Hackathon Demo</h3>
            <span className="status-badge status-success">
              Ready
            </span>
          </div>
          <DemoController 
            status={demoStatus}
            onStartDemo={handleStartDemo}
            onNextStep={handleNextDemoStep}
          />
        </div>

        {/* Sensor Health */}
        <div className="card grid-full">
          <div className="card-header">
            <h3 className="card-title">📡 Sensor Network Health</h3>
            <div className="sensor-stats">
              <span className="sensor-stat">
                <span className="stat-indicator healthy"></span>
                Healthy: {sensors.filter(s => s.status === 'HEALTHY').length}
              </span>
              <span className="sensor-stat">
                <span className="stat-indicator warning"></span>
                Warning: {sensors.filter(s => s.status === 'WARNING').length}
              </span>
              <span className="sensor-stat">
                <span className="stat-indicator critical"></span>
                Critical: {sensors.filter(s => s.status === 'CRITICAL').length}
              </span>
            </div>
          </div>
          <div className="sensor-grid">
            {sensors.slice(0, 6).map(sensor => (
              <SensorZoneCard key={sensor.sensor_id} sensor={sensor} />
            ))}
          </div>
        </div>

        {/* Pressure Distribution Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📊 Pressure Distribution</h3>
          </div>
          <div className="chart-container" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pressureData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                <YAxis label={{ value: 'Pressure (bar)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value} bar`, 'Pressure']} />
                <Legend />
                <Bar dataKey="pressure" fill="#3B82F6" name="Pressure (bar)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaint Statistics */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📝 Complaint Trends</h3>
          </div>
          <div className="chart-container" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ticketPriorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ priority, percent }) => `${priority}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {ticketPriorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Tickets']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equity Widget */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚖️ Ward Equity Index</h3>
          </div>
          <EquityWidget data={equityData} />
        </div>

        {/* Quick Complaint Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📣 Report Water Issue</h3>
          </div>
          <ComplaintForm />
          <div className="form-note">
            <small>Reports via WhatsApp: +91-XXXXXXXXXX</small>
          </div>
        </div>

        {/* High Priority Tickets */}
        <div className="card grid-full">
          <div className="card-header">
            <h3 className="card-title">🎫 High Priority Tickets</h3>
            <button className="btn btn-sm btn-primary">
              View All Tickets
            </button>
          </div>
          <div className="tickets-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Issue</th>
                  <th>Ward</th>
                  <th>Priority</th>
                  <th>SLA Deadline</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets
                  .filter(t => t.priority === 'P1')
                  .slice(0, 5)
                  .map(ticket => (
                    <tr key={ticket.id}>
                      <td>#{ticket.id}</td>
                      <td>{ticket.issue?.substring(0, 50)}...</td>
                      <td>{ticket.ward_name || 'Unknown'}</td>
                      <td>
                        <span className={`status-badge ${
                          ticket.priority === 'P1' ? 'status-danger' :
                          ticket.priority === 'P2' ? 'status-warning' : 'status-info'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td>
                        {new Date(ticket.sla_deadline).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {ticket.isOverdue && (
                          <span className="status-badge status-danger ml-2">OVERDUE</span>
                        )}
                      </td>
                      <td>{ticket.assigned_to || 'Unassigned'}</td>
                      <td>
                        <span className={`status-badge ${
                          ticket.status === 'closed' ? 'status-success' :
                          ticket.status === 'in_progress' ? 'status-warning' : 'status-info'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="dashboard-footer">
        <div className="footer-metrics">
          <div className="metric">
            <div className="metric-value">{sensors.length}</div>
            <div className="metric-label">Sensors Online</div>
          </div>
          <div className="metric">
            <div className="metric-value">
              {analytics?.slaPerformance?.sla_met || 0}/
              {analytics?.slaPerformance?.total_tickets || 0}
            </div>
            <div className="metric-label">SLA Met</div>
          </div>
          <div className="metric">
            <div className="metric-value">
              {complaints.length > 0 
                ? `${((metrics.resolvedComplaints / complaints.length) * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
            <div className="metric-label">Resolution Rate</div>
          </div>
          <div className="metric">
            <div className="metric-value">
              {equityData?.overallScore 
                ? equityData.overallScore.toFixed(2)
                : '1.00'
              }
            </div>
            <div className="metric-label">City Equity Score</div>
          </div>
        </div>
        <div className="footer-note">
          <small>
            Data updates every 10 seconds • Last updated: {new Date().toLocaleTimeString()}
          </small>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;