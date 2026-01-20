// backend/routes/complaints.js
const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');

// POST /api/complaints
router.post('/', async (req, res) => {
  const db = req.app.get('db');
  const { user_id, location, issue, photo } = req.body;

  try {
    const complaint = await Complaint.createComplaint(db, { user_id, location, issue, photo });
    res.status(201).json({ complaint });
  } catch (err) {
    console.error('Complaint error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
