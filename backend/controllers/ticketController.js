const asyncHandler = require('../utils/asyncHandler');
const { TICKET_STATUS } = require('../utils/status');

module.exports = (db) => ({
  createTicket: asyncHandler(async (req, res) => {
    const { complaint_id, assigned_to } = req.body;

    if (!complaint_id) {
      return res.status(400).json({ error: 'complaint_id is required' });
    }

    const result = await db.query(
      `INSERT INTO tickets
       (complaint_id, assigned_to, status, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [complaint_id, assigned_to || null, TICKET_STATUS.OPEN]
    );

    res.status(201).json({
      success: true,
      ticket: result.rows[0]
    });
  }),

  updateTicket: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const result = await db.query(
      `UPDATE tickets
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({
      success: true,
      ticket: result.rows[0]
    });
  }),

  getTickets: asyncHandler(async (req, res) => {
    const result = await db.query(`
      SELECT t.*, c.issue, w.name AS ward
      FROM tickets t
      LEFT JOIN complaints c ON t.complaint_id = c.id
      LEFT JOIN wards w ON c.ward_id = w.id
      ORDER BY t.created_at DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      tickets: result.rows
    });
  })
});
