const express = require('express');
const router = express.Router();

module.exports = (db) => {
  const ComplaintController = require('../controllers/complaintController');
  const controller = new ComplaintController(db);

  router.post('/', (req, res) => controller.createComplaint(req, res));
  router.get('/', (req, res) => controller.getComplaints(req, res));
  router.get('/stats', (req, res) => controller.getComplaintStats(req, res));
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query(`
        SELECT 
          c.*,
          ST_AsText(c.location) as location_text,
          w.name as ward_name,
          u.phone as reporter_phone,
          t.id as ticket_id,
          t.priority as ticket_priority,
          t.status as ticket_status
        FROM complaints c
        LEFT JOIN wards w ON c.ward_id = w.id
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN tickets t ON t.complaint_id = c.id
        WHERE c.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Complaint not found' });
      }
      
      const complaint = result.rows[0];
      
      // Parse location
      const locationMatch = complaint.location_text.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      complaint.location = locationMatch ? {
        lng: parseFloat(locationMatch[1]),
        lat: parseFloat(locationMatch[2])
      } : null;
      
      delete complaint.location_text;
      
      res.json({
        success: true,
        complaint
      });
      
    } catch (error) {
      console.error('Get complaint error:', error);
      res.status(500).json({ error: 'Failed to fetch complaint' });
    }
  });

  return router;
};