const express = require('express');
const cors = require('cors');
const path = require('path');

// Import DB to initialize tables + seed on startup
require('./db');

const standardsRouter = require('./routes/standards');
const fastenersRouter = require('./routes/fasteners');
const boxesRouter    = require('./routes/boxes');
const exportRouter   = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API routes
app.use('/api/standards', standardsRouter);
app.use('/api/fasteners', fastenersRouter);
app.use('/api/boxes',     boxesRouter);
app.use('/api/export',    exportRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Fastener Tracker server running on http://localhost:${PORT}`);
});
