const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Create HTTP server ONCE
const server = http.createServer(app);

// Attach WebSocket
const io = socketIo(server, {
  cors: { origin: '*' }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('📡 New dashboard connected');
  socket.on('disconnect', () => {
    console.log('📡 Dashboard disconnected');
  });
});

// ✅ LISTEN ONLY HERE
server.listen(PORT, () => {
  console.log(`🚀 JalSetu Backend running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
