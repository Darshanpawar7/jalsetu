const { analyzePhoto } = require('../services/aiService');

class TicketController {
  constructor(db) {
    this.db = db;
  }

  async createTicket(req, res) {
    try {
      const { complaint_id, assigned_to, estimated_hours } = req.body;
      
      if (!complaint_id) {
        return res.status(400).json({ error: 'Complaint ID is required' });
      }
      
      // Get complaint details
      const complaintResult = await this.db.query(`
        SELECT c.*, w.name as ward_name 
        FROM complaints c
        LEFT JOIN wards w ON c.ward_id = w.id
        WHERE c.id = $1
      `, [complaint_id]);
      
      if (complaintResult.rows.length === 0) {
        return res.status(404).json({ error: 'Complaint not found' });
      }
      
      const complaint = complaintResult.rows[0];
      
      // Create ticket
      const ticketResult = await this.db.query(`
        INSERT INTO tickets 
          (complaint_id, title, description, assigned_to, 
           status, estimated_hours, created_at)
        VALUES ($1, $2, $3, $4, 'assigned', $5, NOW())
        RETURNING *
      `, [
        complaint_id,
        `Ticket for Complaint #${complaint_id}`,
        complaint.issue,
        assigned_to,
        estimated_hours || 4
      ]);
      
      // Update complaint status
      await this.db.query(
        'UPDATE complaints SET status = $1 WHERE id = $2',
        ['in_progress', complaint_id]
      );
      
      const ticket = ticketResult.rows[0];
      
      // Emit real-time update
      if (req.app.get('io')) {
        req.app.get('io').emit('ticket_created', {
          ticketId: ticket.id,
          complaintId: complaint_id,
          assignedTo: assigned_to,
          ward: complaint.ward_name,
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        ticket
      });
      
    } catch (error) {
      console.error('Ticket creation error:', error);
      res.status(500).json({ error: 'Failed to create ticket' });
    }
  }

  async updateTicket(req, res) {
    try {
      const { id } = req.params;
      const { status, notes, before_photo, after_photo } = req.body;
      
      const updates = [];
      const values = [];
      let valueCount = 1;
      
      if (status) {
        updates.push(`status = $${valueCount}`);
        values.push(status);
        valueCount++;
        
        if (status === 'closed') {
          updates.push(`closed_at = NOW()`);
        }
      }
      
      if (notes) {
        updates.push(`closure_notes = $${valueCount}`);
        values.push(notes);
        valueCount++;
      }
      
      if (before_photo) {
        updates.push(`before_photo = $${valueCount}`);
        values.push(before_photo);
        valueCount++;
      }
      
      if (after_photo) {
        updates.push(`after_photo = $${valueCount}`);
        values.push(after_photo);
        valueCount++;
        
        // If we have both before and after photos, run AI verification
        if (before_photo && after_photo) {
          try {
            const verification = await analyzePhoto(before_photo, after_photo);
            updates.push(`verification_score = $${valueCount}`);
            values.push(verification.confidence);
            valueCount++;
          } catch (aiError) {
            console.error('AI verification failed:', aiError);
          }
        }
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }
      
      values.push(id);
      
      const query = `
        UPDATE tickets 
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${valueCount}
        RETURNING *
      `;
      
      const result = await this.db.query(query, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      const ticket = result.rows[0];
      
      // If ticket is closed, update complaint too
      if (status === 'closed') {
        await this.db.query(
          'UPDATE complaints SET status = $1, resolved_at = NOW() WHERE id = $2',
          ['resolved', ticket.complaint_id]
        );
        
        // Log SLA performance
        await this.db.query(`
          INSERT INTO sla_logs (ticket_id, expected_close, actual_close, met_sla)
          VALUES ($1, $2, NOW(), $3)
        `, [
          ticket.id,
          ticket.sla_deadline,
          new Date() <= new Date(ticket.sla_deadline)
        ]);
        
        // Notify citizen if possible
        const complaintResult = await this.db.query(`
          SELECT u.phone 
          FROM complaints c
          JOIN users u ON c.user_id = u.id
          WHERE c.id = $1
        `, [ticket.complaint_id]);
        
        if (complaintResult.rows.length > 0) {
          const citizenPhone = complaintResult.rows[0].phone;
          // Here you would send WhatsApp notification
          // await sendWhatsAppMessage(citizenPhone, `Your water issue has been resolved!`);
        }
      }
      
      // Emit real-time update
      if (req.app.get('io')) {
        req.app.get('io').emit('ticket_updated', {
          ticketId: ticket.id,
          status: ticket.status,
          verificationScore: ticket.verification_score,
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({
        success: true,
        message: 'Ticket updated successfully',
        ticket
      });
      
    } catch (error) {
      console.error('Ticket update error:', error);
      res.status(500).json({ error: 'Failed to update ticket' });
    }
  }

  async getTickets(req, res) {
    try {
      const { status, priority, ward } = req.query;
      
      let query = `
        SELECT 
          t.id,
          t.title,
          t.status,
          t.priority,
          t.priority_score,
          t.sla_deadline,
          t.assigned_to,
          t.created_at,
          t.closed_at,
          t.verification_score,
          c.issue,
          w.name as ward_name,
          EXTRACT(EPOCH FROM (t.sla_deadline - NOW()))/3600 as hours_remaining
        FROM tickets t
        JOIN complaints c ON t.complaint_id = c.id
        LEFT JOIN wards w ON c.ward_id = w.id
        WHERE 1=1
      `;
      
      const params = [];
      let paramCount = 1;
      
      if (status) {
        query += ` AND t.status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }
      
      if (priority) {
        query += ` AND t.priority = $${paramCount}`;
        params.push(priority);
        paramCount++;
      }
      
      if (ward) {
        query += ` AND w.name ILIKE $${paramCount}`;
        params.push(`%${ward}%`);
        paramCount++;
      }
      
      query += ` ORDER BY 
        CASE t.priority
          WHEN 'P1' THEN 1
          WHEN 'P2' THEN 2
          WHEN 'P3' THEN 3
          ELSE 4
        END,
        t.sla_deadline ASC
        LIMIT 50`;
      
      const result = await this.db.query(query, params);
      
      const tickets = result.rows.map(ticket => ({
        ...ticket,
        isOverdue: ticket.hours_remaining < 0,
        urgency: ticket.hours_remaining < 2 ? 'CRITICAL' : 
                 ticket.hours_remaining < 6 ? 'HIGH' : 'NORMAL'
      }));
      
      res.json({
        success: true,
        count: tickets.length,
        tickets
      });
      
    } catch (error) {
      console.error('Get tickets error:', error);
      res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  }

  async getHighPriorityTickets(req, res) {
    try {
      const PriorityEngine = require('../services/priorityEngine');
      const engine = new PriorityEngine(this.db);
      
      const topPriorities = await engine.getTopPriorities(10);
      
      res.json({
        success: true,
        priorities: topPriorities,
        generatedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('High priority tickets error:', error);
      res.status(500).json({ error: 'Failed to fetch high priority tickets' });
    }
  }
}

module.exports = TicketController;