const express = require('express');
const router = express.Router();

// Import controllers
const ComplaintController = require('../controllers/complaintController');
const TicketController = require('../controllers/ticketController');
const SensorController = require('../controllers/sensorController');
const AnalyticsController = require('../controllers/analyticsController');
const DemoController = require('../controllers/demoController');

// Initialize controllers with database
module.exports = (db) => {
  const complaintController = new ComplaintController(db);
  const ticketController = new TicketController(db);
  const sensorController = new SensorController(db);
  const analyticsController = new AnalyticsController(db);
  const demoController = new DemoController(db);

  // Health check
  router.get('/', (req, res) => {
    res.json({
      service: 'JalSetu API',
      version: '1.0.0',
      status: 'operational',
      endpoints: {
        complaints: '/api/complaints',
        tickets: '/api/tickets',
        sensors: '/api/sensors',
        analytics: '/api/analytics',
        demo: '/api/demo'
      },
      documentation: 'https://github.com/yourusername/jalsetu/docs'
    });
  });

  // Complaints endpoints
  router.post('/complaints', (req, res) => complaintController.createComplaint(req, res));
  router.get('/complaints', (req, res) => complaintController.getComplaints(req, res));
  router.get('/complaints/stats', (req, res) => complaintController.getComplaintStats(req, res));
  router.get('/complaints/:id', (req, res) => complaintController.getComplaintById(req, res));

  // Tickets endpoints
  router.post('/tickets', (req, res) => ticketController.createTicket(req, res));
  router.get('/tickets', (req, res) => ticketController.getTickets(req, res));
  router.get('/tickets/priority', (req, res) => ticketController.getHighPriorityTickets(req, res));
  router.patch('/tickets/:id', (req, res) => ticketController.updateTicket(req, res));
  router.get('/tickets/:id', (req, res) => ticketController.getTicketById(req, res));

  // Sensors endpoints
  router.get('/sensors', (req, res) => sensorController.getSensors(req, res));
  router.get('/sensors/readings', (req, res) => sensorController.getSensorReadings(req, res));
  router.get('/sensors/anomalies', (req, res) => sensorController.detectAnomalies(req, res));
  router.get('/sensors/:id', (req, res) => sensorController.getSensorById(req, res));

  // Analytics endpoints
  router.get('/analytics/equity', (req, res) => analyticsController.getEquityData(req, res));
  router.get('/analytics/performance', (req, res) => analyticsController.getPerformanceMetrics(req, res));
  router.get('/analytics/water-loss', (req, res) => analyticsController.getWaterLossAnalysis(req, res));
  router.get('/analytics/ward/:id', (req, res) => analyticsController.getWardAnalytics(req, res));

  // Demo control endpoints
  router.post('/demo/start', (req, res) => demoController.startDemo(req, res));
  router.post('/demo/next', (req, res) => demoController.nextStep(req, res));
  router.get('/demo/status', (req, res) => demoController.getDemoStatus(req, res));
  router.post('/demo/reset', (req, res) => demoController.resetDemo(req, res));

  // WhatsApp webhook (for receiving messages)
  router.post('/webhook/whatsapp', (req, res) => {
    // Handle incoming WhatsApp messages
    const { From, Body } = req.body;
    console.log(`WhatsApp from ${From}: ${Body}`);
    
    // Process message and create complaint
    // This would integrate with your WhatsApp bot logic
    
    res.status(200).send('OK');
  });

  return router;
};