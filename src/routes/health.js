/**
 * Health Check Routes
 * Simple health and status endpoints for monitoring
 */

/**
 * GET /api/health
 * Returns health status of the worker
 */
export async function handleHealth() {
  return new Response(JSON.stringify({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    platform: 'Cloudflare Workers',
    service: 'AI Image Generation API',
    version: '1.0.0',
    uptime: 'Always available (edge computing)'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * GET /api/status
 * Returns detailed status and configuration info
 */
export async function handleStatus(env) {
  const cf = {
    colo: env?.cf?.colo || 'Unknown',
    country: env?.cf?.country || 'Unknown',
    city: env?.cf?.city || 'Unknown'
  };
  
  return new Response(JSON.stringify({
    success: true,
    service: 'AI Image Generation API',
    status: 'operational',
    platform: 'Cloudflare Workers',
    version: '1.0.0',
    deployment: {
      region: cf.colo,
      country: cf.country,
      city: cf.city,
      edgeLocation: 'Global CDN'
    },
    features: {
      imageGeneration: 'enabled',
      multipleFormats: 'enabled',
      globalEdge: 'enabled',
      cors: 'enabled',
      streaming: 'enabled'
    },
    limits: {
      requestsPerDay: '100,000',
      maxPromptLength: '1000 characters',
      timeout: '30 seconds'
    },
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
