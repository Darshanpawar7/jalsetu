const express = require('express');
const router = express.Router();

module.exports = (app) => {
  const db = app.get('db');

  const complaintController = require('../controllers/complaintController')(db);
  const ticketController = require('../controllers/ticketController')(db);
  const sensorController = require('../controllers/sensorController')(db);
  const analyticsController = require('../controllers/analyticsController')(db);
  const demoController = require('../controllers/demoController')(db);

  // Complaints
  router.post('/complaints', complaintController.createComplaint);
  router.get('/complaints', complaintController.getComplaints);

  // Tickets
  router.get('/tickets', ticketController.getTickets);

  // Sensors
  router.get('/sensors', sensorController.getSensors);

  // Analytics
  router.get('/analytics/equity', analyticsController.getEquityData);

  // Demo
  router.post('/demo/start', demoController.startDemo);

  return router;
};
