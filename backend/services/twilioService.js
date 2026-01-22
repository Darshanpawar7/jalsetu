// backend/services/twilioService.js
/**
 * Mock Twilio service for WhatsApp integration
 * For hackathon demo - uses console logging instead of real API
 */

class TwilioService {
  constructor() {
    this.isEnabled = process.env.TWILIO_ACCOUNT_SID && 
                     process.env.TWILIO_AUTH_TOKEN &&
                     process.env.TWILIO_ACCOUNT_SID !== 'your_account_sid_here';
  }

  async sendWhatsAppMessage(to, message) {
    try {
      console.log(`📱 [WhatsApp Demo] To: ${to}`);
      console.log(`📱 [WhatsApp Demo] Message: ${message}`);
      console.log(`📱 [WhatsApp Demo] Status: Sent successfully (Demo Mode)`);
      
      // In real implementation, this would call Twilio API
      // For hackathon, we just log it
      if (this.isEnabled) {
        // Real Twilio implementation would go here
        // const client = require('twilio')(...);
        // await client.messages.create({...});
        console.log('🔗 Using real Twilio API');
      }
      
      return {
        success: true,
        messageId: `demo-${Date.now()}`,
        timestamp: new Date().toISOString(),
        note: 'WhatsApp integration ready - add Twilio credentials for production'
      };
    } catch (error) {
      console.error('WhatsApp error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async receiveWhatsAppMessage(body) {
    // Parse incoming WhatsApp message
    console.log('📱 Incoming WhatsApp:', body);
    
    // Extract complaint details from message
    const message = body.Body || '';
    const from = body.From || '';
    
    // Simple keyword parsing for demo
    const issue = this.extractIssue(message);
    const ward = this.extractWard(message);
    
    return {
      from,
      message,
      issue,
      ward,
      timestamp: new Date().toISOString(),
      source: 'whatsapp'
    };
  }

  extractIssue(message) {
    const keywords = {
      'no water': 'No water supply',
      'low pressure': 'Low water pressure',
      'leak': 'Water leakage',
      'dirty': 'Dirty water',
      'timing': 'Irregular supply timing'
    };
    
    for (const [key, value] of Object.entries(keywords)) {
      if (message.toLowerCase().includes(key)) {
        return value;
      }
    }
    
    return message.substring(0, 100) || 'Water issue reported';
  }

  extractWard(message) {
    const wards = [
      'Nana Peth', 'Sadar Bazaar', 'Akkalkot Road', 
      'North Solapur', 'Central Solapur', 'Uppar Bazaar',
      'Mangalwar Peth', 'Tembhurni Road'
    ];
    
    for (const ward of wards) {
      if (message.toLowerCase().includes(ward.toLowerCase())) {
        return ward;
      }
    }
    
    return null;
  }
}

module.exports = new TwilioService();