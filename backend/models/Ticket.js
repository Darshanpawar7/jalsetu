// backend/models/Ticket.js
module.exports = {
  createTicket: async (db, { complaint_id, assigned_to }) => {
    const result = await db.query(
      'INSERT INTO tickets (complaint_id, status, assigned_to, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [complaint_id, 'open', assigned_to]
    );
    return result.rows[0];
  },

  closeTicket: async (db, ticket_id) => {
    const result = await db.query(
      'UPDATE tickets SET status=$1, closed_at=NOW() WHERE id=$2 RETURNING *',
      ['closed', ticket_id]
    );
    return result.rows[0];
  }
};
