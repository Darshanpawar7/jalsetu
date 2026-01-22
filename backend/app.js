const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const routes = require('./routes');
const { setupWebSocket } = require('./services/websocket');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Setup WebSocket
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
app.set('io', io);
setupWebSocket(io);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
  }
});

app.set('db', pool);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(helmet({
  contentSecurityPolicy: false // Adjust for production
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'JalSetu Backend',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Error:', err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path
  });
});

module.exports = { app, server, pool };