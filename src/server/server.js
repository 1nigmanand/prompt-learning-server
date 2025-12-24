import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { generateImage, generateImageWithProgress, clearImageCache, getCacheStats } from '../utils/imageGenerator-server.js';
import keyManager from '../utils/keyManager.js';

// Initialize key manager
keyManager.initializeKeys();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes

/**
 * POST /api/generate-image
 * Generate an image from a text prompt
 * Body: { prompt: string }
 * Response: { success: boolean, imageUrl?: string, error?: string }
 */
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;

    // Validate request
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    if (typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt must be a string'
      });
    }

    if (prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Prompt cannot be empty'
      });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Prompt too long (max 1000 characters)'
      });
    }

    console.log(`🎨 Generating image for prompt: "${prompt}"`);

    // Generate image
    const imageUrl = await generateImage(prompt);

    console.log(`✅ Image generated successfully: ${imageUrl}`);

    // Check if it was from cache
    const cacheStats = getCacheStats();
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      prompt: prompt,
      cached: cacheStats.prompts.includes(prompt.trim().toLowerCase()),
      totalCached: cacheStats.size
    });

  } catch (error) {
    console.error('❌ Error generating image:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate image'
    });
  }
});

/**
 * POST /api/generate-image-stream
 * Generate an image with progress updates (using Server-Sent Events)
 * Body: { prompt: string }
 * Response: Server-Sent Events stream
 */
app.post('/api/generate-image-stream', async (req, res) => {
  try {
    const { prompt } = req.body;

    // Validate request
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid prompt is required'
      });
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Progress callback function
    const onProgress = (message) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', message })}\n\n`);
    };

    try {
      // Generate image with progress
      const imageUrl = await generateImageWithProgress(prompt, onProgress);
      
      // Send success result
      res.write(`data: ${JSON.stringify({ 
        type: 'success', 
        imageUrl,
        prompt 
      })}\n\n`);
      
    } catch (error) {
      // Send error result
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        error: error.message 
      })}\n\n`);
    }

    res.end();

  } catch (error) {
    console.error('❌ Error in stream endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate image'
    });
  }
});

/**
 * POST /api/acquire-key
 * Acquire an available API key
 */
app.post('/api/acquire-key', async (req, res) => {
  try {
    // Auto-release expired keys first
    keyManager.autoReleaseExpiredKeys();

    // Acquire key with waiting
    const result = await keyManager.acquireKeyWithWait(30000, 1000);

    if (result.success) {
      console.log(`✅ Key #${result.keyId} acquired (waited ${result.waitTime}ms)`);
      res.json(result);
    } else {
      console.warn('⚠️ All keys busy');
      res.status(503).json(result);
    }
  } catch (error) {
    console.error('❌ Error acquiring key:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to acquire API key'
    });
  }
});

/**
 * POST /api/release-key
 * Release an API key back to the pool
 */
app.post('/api/release-key', async (req, res) => {
  try {
    const { keyId } = req.body;

    if (!keyId) {
      return res.status(400).json({
        success: false,
        error: 'keyId is required'
      });
    }

    const result = keyManager.releaseKey(keyId);

    if (result.success) {
      console.log(`✅ Key #${keyId} released (held for ${result.duration}ms)`);
      res.json({
        success: true,
        keyId: keyId,
        message: 'API key released successfully',
        duration: result.duration
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error releasing key:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to release API key'
    });
  }
});

/**
 * GET /api/key-status
 * Get current status of all API keys
 */
app.get('/api/key-status', (req, res) => {
  try {
    keyManager.autoReleaseExpiredKeys();
    const status = keyManager.getStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('❌ Error getting key status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get key status'
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * GET /api/status
 * Get server status and statistics
 */
app.get('/api/status', (req, res) => {
  const cacheStats = getCacheStats();
  
  res.json({
    success: true,
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      platform: process.platform
    },
    cache: {
      enabled: true,
      totalCached: cacheStats.size,
      cachedPrompts: cacheStats.prompts
    },
    api: {
      endpoints: [
        'POST /api/generate-image',
        'POST /api/generate-image-stream',
        'GET /api/health',
        'GET /api/status',
        'POST /api/clear-cache'
      ]
    }
  });
});

/**
 * POST /api/clear-cache
 * Clear the image cache
 */
app.post('/api/clear-cache', (req, res) => {
  const cleared = clearImageCache();
  res.json({
    success: true,
    message: `Cleared ${cleared} cached images`,
    clearedCount: cleared
  });
});

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    name: 'Prompt Learning Server',
    version: '1.0.0',
    description: 'AI-powered image generation API',
    endpoints: {
      'POST /api/generate-image': 'Generate an image from a text prompt',
      'POST /api/generate-image-stream': 'Generate an image with real-time progress updates',
      'GET /api/health': 'Check server health status',
      'GET /api/status': 'Get detailed server status and statistics'
    },
    usage: {
      generate_image: {
        method: 'POST',
        url: '/api/generate-image',
        body: {
          prompt: 'string (required, max 1000 characters)'
        },
        response: {
          success: 'boolean',
          imageUrl: 'string',
          prompt: 'string'
        }
      }
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📖 API Endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/                    - API documentation`);
  console.log(`   POST http://localhost:${PORT}/api/generate-image  - Generate image`);
  console.log(`   POST http://localhost:${PORT}/api/generate-image-stream - Generate with progress`);
  console.log(`   GET  http://localhost:${PORT}/api/health          - Health check`);
  console.log(`   GET  http://localhost:${PORT}/api/status          - Server status`);
  console.log(`🌐 Ready for deployment!`);
});

export default app;