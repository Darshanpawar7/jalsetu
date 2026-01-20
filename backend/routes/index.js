// backend/routes/index.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Welcome to JalSetu API');
});

router.get('/ping-db', async (req, res) => {
  const db = req.app.get('db');
  try {
    const test = await db.query('SELECT NOW()');
    res.json({ time: test.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Database not reachable', details: err.message });
  }
});

router.use('/complaints', require('./complaints'));
router.use('/tickets', require('./tickets'));

module.exports = router;
