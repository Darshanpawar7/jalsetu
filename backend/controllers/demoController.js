const asyncHandler = require('../utils/asyncHandler');
const DemoOrchestrator = require('../services/demoOrchestrator');

module.exports = (db) => {
  let orchestrator = null;

  return {
    startDemo: asyncHandler(async (req, res) => {
      const io = req.app.get('io');

      orchestrator = new DemoOrchestrator(db, io);
      const result = await orchestrator.startDemo();

      res.json({
        success: true,
        message: 'Demo started successfully',
        ...result
      });
    }),

    nextStep: asyncHandler(async (req, res) => {
      if (!orchestrator) {
        return res.status(400).json({
          error: 'Demo not started'
        });
      }

      const result = await orchestrator.nextStep();

      res.json({
        success: true,
        message: `Demo step completed: ${result.step}`,
        ...result
      });
    }),

    getDemoStatus: asyncHandler(async (req, res) => {
      if (!orchestrator) {
        return res.json({
          success: true,
          status: 'not_started'
        });
      }

      res.json({
        success: true,
        status: 'running',
        data: orchestrator.getCurrentStatus()
      });
    }),

    resetDemo: asyncHandler(async (req, res) => {
      orchestrator = null;

      res.json({
        success: true,
        message: 'Demo reset successfully'
      });
    })
  };
};
