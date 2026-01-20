// backend/models/Complaint.js
module.exports = {
  createComplaint: async (db, { user_id, location, issue, photo }) => {
    const result = await db.query(
      'INSERT INTO complaints (user_id, location, issue, photo, created_at) VALUES ($1, ST_GeomFromText($2, 4326), $3, $4, NOW()) RETURNING *',
      [user_id, location, issue, photo]
    );
    return result.rows[0];
  }
};
