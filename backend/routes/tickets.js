// backend/routes/tickets.js
const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// POST /api/tickets
router.post('/', async (req, res) => {
  const db = req.app.get('db');
  const { complaint_id, assigned_to } = req.body;

  try {
    const ticket = await Ticket.createTicket(db, { complaint_id, assigned_to });
    res.status(201).json({ ticket });
  } catch (err) {
    console.error('Ticket error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/tickets/:id/close
router.patch('/:id/close', async (req, res) => {
  const db = req.app.get('db');
  const ticket_id = req.params.id;

  try {
    const ticket = await Ticket.closeTicket(db, ticket_id);
    res.status(200).json({ ticket });
  } catch (err) {
    console.error('Close ticket error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
