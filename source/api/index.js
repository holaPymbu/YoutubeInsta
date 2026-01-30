// Vercel Serverless API Handler
// This wraps the Express app for Vercel serverless functions

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Health check at root for Vercel
app.get('/api', (req, res) => {
    res.json({
        status: 'ok',
        message: 'YoutubeInsta API is running on Vercel',
        timestamp: new Date().toISOString()
    });
});

// Export for Vercel serverless
module.exports = app;
