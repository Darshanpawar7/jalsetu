const express = require('express');
const router = express.Router();

module.exports = (db) => {
  const TicketController = require('../controllers/ticketController');
  const controller = new TicketController(db);

  router.post('/', (req, res) => controller.createTicket(req, res));
  router.get('/', (req, res) => controller.getTickets(req, res));
  router.get('/priority', (req, res) => controller.getHighPriorityTickets(req, res));
  router.patch('/:id', (req, res) => controller.updateTicket(req, res));
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query(`
        SELECT 
          t.*,
          c.issue,
          c.severity as complaint_severity,
          w.name as ward_name,
          u.phone as reporter_phone,
          EXTRACT(EPOCH FROM (t.sla_deadline - NOW()))/3600 as hours_remaining
        FROM tickets t
        JOIN complaints c ON t.complaint_id = c.id
        LEFT JOIN wards w ON c.ward_id = w.id
        LEFT JOIN users u ON c.user_id = u.id
        WHERE t.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      const ticket = result.rows[0];
      ticket.isOverdue = ticket.hours_remaining < 0;
      
      res.json({
        success: true,
        ticket
      });
      
    } catch (error) {
      console.error('Get ticket error:', error);
      res.status(500).json({ error: 'Failed to fetch ticket' });
    }
  });

  return router;
};