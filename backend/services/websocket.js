/**
 * WebSocket Service for real-time updates
 */

function setupWebSocket(io) {
  let connectedDashboards = 0;
  
  io.on('connection', (socket) => {
    connectedDashboards++;
    console.log(`📡 New dashboard connected. Total: ${connectedDashboards}`);
    
    // Send welcome message
    socket.emit('welcome', {
      message: 'Connected to JalSetu Real-time Dashboard',
      timestamp: new Date().toISOString(),
      features: [
        'Live sensor updates',
        'Real-time alerts',
        'Ticket status changes',
        'Demo control'
      ]
    });
    
    // Handle demo control
    socket.on('start_demo', async () => {
      console.log('Demo requested via WebSocket');
      const DemoOrchestrator = require('./demoOrchestrator');
      const orchestrator = new DemoOrchestrator(socket.db, io);
      const result = await orchestrator.startDemo();
      socket.emit('demo_started', result);
    });
    
    socket.on('next_demo_step', async () => {
      const DemoOrchestrator = require('./demoOrchestrator');
      const orchestrator = new DemoOrchestrator(socket.db, io);
      const result = await orchestrator.nextStep();
      socket.emit('demo_step_result', result);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      connectedDashboards--;
      console.log(`Dashboard disconnected. Remaining: ${connectedDashboards}`);
    });
  });
  
  // Simulate periodic sensor updates
  setInterval(() => {
    const sensorUpdate = {
      type: 'sensor_update',
      data: {
        timestamp: new Date().toISOString(),
        sensors: [
          { id: 'sensor-np-01', pressure: 2.1 + Math.random() * 0.5, flow: 120 + Math.random() * 30 },
          { id: 'sensor-sb-01', pressure: 3.2 + Math.random() * 0.3, flow: 150 + Math.random() * 20 },
          { id: 'sensor-ar-01', pressure: 2.8 + Math.random() * 0.4, flow: 135 + Math.random() * 25 }
        ]
      }
    };
    
    io.emit('real_time_update', sensorUpdate);
  }, 10000); // Every 10 seconds
  
  // Simulate occasional alerts
  setInterval(() => {
    const alerts = [
      {
        type: 'pressure_alert',
        severity: 'medium',
        message: 'Moderate pressure drop detected in North Zone',
        sensorId: 'sensor-north-03',
        value: 1.8,
        threshold: 2.0,
        timestamp: new Date().toISOString()
      },
      {
        type: 'leak_suspected',
        severity: 'high',
        message: 'Possible leak detected in Akkalkot Road area',
        confidence: 0.76,
        location: { lat: 17.681, lng: 75.912 },
        timestamp: new Date().toISOString()
      }
    ];
    
    // Randomly send an alert (30% chance)
    if (Math.random() < 0.3) {
      io.emit('alert', alerts[Math.floor(Math.random() * alerts.length)]);
    }
  }, 15000); // Every 15 seconds
  
  console.log('✅ WebSocket server initialized');
}

module.exports = { setupWebSocket };