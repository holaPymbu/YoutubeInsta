// Vercel Serverless API Handler
// This wraps the Express app for Vercel serverless functions

// Load environment variables from root
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes from server directory
const apiRoutes = require('../server/routes/api');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Health check at root API
app.get('/api', (req, res) => {
    res.json({
        status: 'ok',
        message: 'YoutubeInsta API is running on Vercel',
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL ? 'vercel' : 'local'
    });
});

// Export for Vercel serverless
module.exports = app;
