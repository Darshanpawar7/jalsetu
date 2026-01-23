const asyncHandler = require('../utils/asyncHandler');

module.exports = (db) => ({
  createComplaint: asyncHandler(async (req, res) => {
    const { phone, issue, location } = req.body;

    if (!phone || !issue || !location) {
      return res.status(400).json({
        success: false,
        message: 'phone, issue, and location are required'
      });
    }

    // Upsert user
    const userResult = await db.query(
      `INSERT INTO users (phone)
       VALUES ($1)
       ON CONFLICT (phone)
       DO UPDATE SET phone = EXCLUDED.phone
       RETURNING id`,
      [phone]
    );

    const userId = userResult.rows[0].id;

    // Insert complaint
    const complaintResult = await db.query(
      `INSERT INTO complaints (user_id, issue, location, status, created_at)
       VALUES ($1, $2, ST_GeomFromText($3,4326), 'pending', NOW())
       RETURNING id`,
      [userId, issue, location]
    );

    const complaintId = complaintResult.rows[0].id;

    // Create ticket
    const ticketResult = await db.query(
      `INSERT INTO tickets (complaint_id, priority, status, created_at)
       VALUES ($1, 'P3', 'open', NOW())
       RETURNING id`,
      [complaintId]
    );

    const ticketId = ticketResult.rows[0].id;

    // ✅ FLAT RESPONSE (frontend-safe)
    res.status(200).json({
      success: true,
      complaintId,
      ticketId,
      message: 'Complaint submitted successfully'
    });
  }),

  getComplaints: asyncHandler(async (req, res) => {
    const result = await db.query(`
      SELECT c.id, c.issue, c.status, c.created_at
      FROM complaints c
      ORDER BY c.created_at DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      complaints: result.rows
    });
  })
});
