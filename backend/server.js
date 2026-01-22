const { server, pool } = require('./app');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

// Import MQTT client
require('./mqtt/mqttClient');

// Start server
server.listen(PORT, () => {
  console.log(`🚀 JalSetu Backend running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket running on ws://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await pool.end();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await pool.end();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});