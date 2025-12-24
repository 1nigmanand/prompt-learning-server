/**
 * AI Image Generation Worker
 * Individual worker that handles image generation requests
 * Used internally by the main load balancer
 */

import {
  handleRoot,
  handleHealth,
  handleStatus,
  handleGenerateImage,
  handleGenerateImageStream
} from '../routes/index.js';

// Basic headers for internal responses (CORS handled at load balancer level)
const basicHeaders = {
  'Content-Type': 'application/json'
};

// Main request handler
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Handle CORS preflight requests (not needed for internal workers)
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: basicHeaders
    });
  }

  try {
    // Route handling
    if (path === '/' && method === 'GET') {
      return handleRoot(request);
    }
    
    if (path === '/api/health' && method === 'GET') {
      return handleHealth();
    }
    
    if (path === '/api/status' && method === 'GET') {
      return handleStatus(env);
    }
    
    if (path === '/api/generate-image' && method === 'POST') {
      return handleGenerateImage(request, env);
    }
    
    if (path === '/api/generate-image-stream' && method === 'POST') {
      return handleGenerateImageStream(request, env);
    }
    
    // 404 for unknown routes
    return new Response(JSON.stringify({
      success: false,
      error: 'Route not found',
      availableEndpoints: [
        'GET /',
        'GET /api/health',
        'GET /api/status',
        'POST /api/generate-image',
        'POST /api/generate-image-stream'
      ]
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...basicHeaders
      }
    });
    
  } catch (error) {
    console.error('Global error handler:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...basicHeaders
      }
    });
  }
}

// Main export for Cloudflare Workers
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};