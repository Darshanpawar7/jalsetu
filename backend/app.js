const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
require('dotenv').config();

const createRoutes = require('./routes');

const app = express();

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.set('db', pool);

// Middleware
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api', createRoutes(app));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Backend error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

module.exports = app;
