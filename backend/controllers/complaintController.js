const PriorityEngine = require('../services/priorityEngine');
// Try to load Twilio service, fallback to mock if not available
let twilioService;
try {
  twilioService = require('../services/twilioService');
} catch (error) {
  console.log('⚠️ Twilio service not found, using mock implementation');
  twilioService = {
    sendWhatsAppMessage: async (to, message) => {
      console.log(`📱 [Mock WhatsApp] To: ${to}, Message: ${message}`);
      return { success: true, demo: true };
    }
  };
}
class ComplaintController {
  constructor(db) {
    this.db = db;
    this.priorityEngine = new PriorityEngine(db);
  }

  async createComplaint(req, res) {
    try {
      const { phone, issue, location, ward_name, photo_url } = req.body;
      
      // Validate required fields
      if (!phone || !issue || !location) {
        return res.status(400).json({
          error: 'Missing required fields: phone, issue, location are required'
        });
      }
      
      // Get or create user
      let userResult = await this.db.query(
        'SELECT id FROM users WHERE phone = $1',
        [phone]
      );
      
      let userId;
      if (userResult.rows.length === 0) {
        // Create new user
        const newUser = await this.db.query(
          'INSERT INTO users (phone, name) VALUES ($1, $2) RETURNING id',
          [phone, `User-${phone.slice(-4)}`]
        );
        userId = newUser.rows[0].id;
      } else {
        userId = userResult.rows[0].id;
      }
      
      // Get ward ID
      let wardId = null;
      if (ward_name) {
        const wardResult = await this.db.query(
          'SELECT id FROM wards WHERE name ILIKE $1',
          [`%${ward_name}%`]
        );
        if (wardResult.rows.length > 0) {
          wardId = wardResult.rows[0].id;
        }
      }
      
      // Parse location (expecting "POINT(lng lat)" or {lng, lat})
      let locationGeometry;
      if (typeof location === 'string' && location.startsWith('POINT')) {
        locationGeometry = location;
      } else if (location.lng && location.lat) {
        locationGeometry = `POINT(${location.lng} ${location.lat})`;
      } else {
        return res.status(400).json({
          error: 'Invalid location format. Use "POINT(lng lat)" or {lng, lat}'
        });
      }
      
      // Create complaint
      const complaintResult = await this.db.query(`
        INSERT INTO complaints 
          (user_id, issue, location, ward_id, photo_url, status, created_at)
        VALUES ($1, $2, ST_GeomFromText($3, 4326), $4, $5, 'pending', NOW())
        RETURNING id, created_at
      `, [userId, issue, locationGeometry, wardId, photo_url]);
      
      const complaint = complaintResult.rows[0];
      
      // Calculate priority
      const priorityData = await this.priorityEngine.calculatePriority({
        issue,
        ward_id: wardId,
        location: locationGeometry
      });
      
      // Create ticket automatically
      const ticketResult = await this.db.query(`
        INSERT INTO tickets 
          (complaint_id, title, description, status, priority, priority_score, sla_deadline, created_at)
        VALUES ($1, $2, $3, 'open', $4, $5, $6, NOW())
        RETURNING id
      `, [
        complaint.id,
        `Water Issue - ${ward_name || 'Unknown Ward'}`,
        issue,
        priorityData.priority,
        priorityData.score,
        priorityData.slaDeadline
      ]);
      
      // Send acknowledgment via WhatsApp
      try {
        await twilioService.sendWhatsAppMessage(
          phone,
          `Thank you for reporting the water issue to JalSetu Solapur. Your complaint #${complaint.id} has been registered with ${priorityData.priority} priority. Our team will address it within ${priorityData.slaHours} hours.`
        );
      } catch (whatsappError) {
        console.error('WhatsApp sending failed:', whatsappError);
        // Continue even if WhatsApp fails
      }
      
      // Emit real-time event
      if (req.app.get('io')) {
        req.app.get('io').emit('new_complaint', {
          complaintId: complaint.id,
          issue,
          priority: priorityData.priority,
          ward: ward_name,
          timestamp: complaint.created_at
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Complaint registered successfully',
        data: {
          complaintId: complaint.id,
          ticketId: ticketResult.rows[0].id,
          priority: priorityData.priority,
          slaDeadline: priorityData.slaDeadline,
          estimatedResolution: `${priorityData.slaHours} hours`,
          acknowledgmentSent: true
        }
      });
      
    } catch (error) {
      console.error('Complaint creation error:', error);
      res.status(500).json({
        error: 'Failed to create complaint',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getComplaints(req, res) {
    try {
      const { ward, status, days = 7 } = req.query;
      
      let query = `
        SELECT 
          c.id,
          c.issue,
          c.status,
          c.severity,
          ST_AsText(c.location) as location,
          w.name as ward_name,
          c.created_at,
          t.priority,
          t.sla_deadline,
          u.phone as reporter_phone
        FROM complaints c
        LEFT JOIN wards w ON c.ward_id = w.id
        LEFT JOIN tickets t ON t.complaint_id = c.id
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.created_at > NOW() - INTERVAL '${days} days'
      `;
      
      const params = [];
      let paramCount = 1;
      
      if (ward) {
        query += ` AND w.name ILIKE $${paramCount}`;
        params.push(`%${ward}%`);
        paramCount++;
      }
      
      if (status) {
        query += ` AND c.status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }
      
      query += ` ORDER BY c.created_at DESC LIMIT 100`;
      
      const result = await this.db.query(query, params);
      
      // Process location for frontend
      const complaints = result.rows.map(row => {
        const locationMatch = row.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
        return {
          ...row,
          location: locationMatch ? {
            lng: parseFloat(locationMatch[1]),
            lat: parseFloat(locationMatch[2])
          } : null,
          isOverdue: row.sla_deadline && new Date(row.sla_deadline) < new Date()
        };
      });
      
      res.json({
        success: true,
        count: complaints.length,
        complaints
      });
      
    } catch (error) {
      console.error('Get complaints error:', error);
      res.status(500).json({ error: 'Failed to fetch complaints' });
    }
  }

  async getComplaintStats(req, res) {
    try {
      const statsResult = await this.db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN severity = 3 THEN 1 END) as high_severity,
          AVG(
            EXTRACT(EPOCH FROM (resolved_at - created_at))/3600
          ) as avg_resolution_hours
        FROM complaints
        WHERE created_at > NOW() - INTERVAL '7 days'
      `);
      
      const wardStats = await this.db.query(`
        SELECT 
          w.name as ward,
          COUNT(c.id) as complaint_count,
          COUNT(CASE WHEN c.status = 'resolved' THEN 1 END) as resolved_count
        FROM wards w
        LEFT JOIN complaints c ON w.id = c.ward_id 
          AND c.created_at > NOW() - INTERVAL '7 days'
        GROUP BY w.id, w.name
        ORDER BY complaint_count DESC
      `);
      
      res.json({
        success: true,
        stats: statsResult.rows[0],
        wardStats: wardStats.rows,
        timeframe: 'Last 7 days'
      });
      
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
}

module.exports = ComplaintController;