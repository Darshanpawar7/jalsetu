const DemoOrchestrator = require('../services/demoOrchestrator');

class DemoController {
  constructor(db) {
    this.db = db;
    this.orchestrator = null;
  }

  async startDemo(req, res) {
    try {
      const io = req.app.get('io');
      this.orchestrator = new DemoOrchestrator(this.db, io);
      
      const result = await this.orchestrator.startDemo();
      
      res.json({
        success: true,
        ...result,
        message: 'JalSetu demo sequence started successfully'
      });
      
    } catch (error) {
      console.error('Demo start error:', error);
      res.status(500).json({ 
        error: 'Failed to start demo',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async nextStep(req, res) {
    try {
      if (!this.orchestrator) {
        return res.status(400).json({ 
          error: 'Demo not started. Call /api/demo/start first' 
        });
      }
      
      const result = await this.orchestrator.nextStep();
      
      res.json({
        success: true,
        ...result,
        message: `Demo step completed: ${result.step}`
      });
      
    } catch (error) {
      console.error('Demo step error:', error);
      res.status(500).json({ 
        error: 'Failed to execute demo step',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getDemoStatus(req, res) {
    try {
      if (!this.orchestrator) {
        return res.json({
          success: true,
          demoStatus: 'not_started',
          message: 'Demo has not been started'
        });
      }
      
      const status = this.orchestrator.getCurrentStatus();
      
      res.json({
        success: true,
        demoStatus: 'in_progress',
        ...status,
        demoData: this.orchestrator.demoData
      });
      
    } catch (error) {
      console.error('Demo status error:', error);
      res.status(500).json({ error: 'Failed to get demo status' });
    }
  }

  async resetDemo(req, res) {
    try {
      this.orchestrator = null;
      
      res.json({
        success: true,
        message: 'Demo reset successfully. Ready to start new demo.'
      });
      
    } catch (error) {
      console.error('Demo reset error:', error);
      res.status(500).json({ error: 'Failed to reset demo' });
    }
  }
}

module.exports = DemoController;