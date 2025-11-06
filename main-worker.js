/**
 * Main Load Balancer Worker - Single Entry Point
 * Users hit this one domain, internally distributes to 20 workers
 * 
 * Benefits:
 * - Frontend always uses same domain (no CORS issues)
 * - Server-side load distribution
 * - Automatic failover
 * - Centralized monitoring
 */

class InternalLoadBalancer {
  constructor(env) {
    // Service bindings for internal workers (Cloudflare native approach)
    this.workerBindings = [
      'SERVER1', 'SERVER2', 'SERVER3', 'SERVER4', 'SERVER5',
      'SERVER6', 'SERVER7', 'SERVER8', 'SERVER9', 'SERVER10',
      'SERVER11', 'SERVER12', 'SERVER13', 'SERVER14', 'SERVER15',
      'SERVER16', 'SERVER17', 'SERVER18', 'SERVER19', 'SERVER20'
    ];
    
    this.env = env;
    this.currentIndex = 0;
    this.failedWorkers = new Set();
  }
  
  /**
   * Get next available worker using round-robin
   */
  getNextWorker() {
    const availableWorkers = this.workerBindings.filter(binding => 
      !this.failedWorkers.has(binding)
    );
    
    if (availableWorkers.length === 0) {
      // All workers failed, reset and try again
      console.warn('All internal workers failed, resetting...');
      this.failedWorkers.clear();
      return this.workerBindings[0];
    }
    
    const worker = availableWorkers[this.currentIndex % availableWorkers.length];
    this.currentIndex++;
    
    return worker;
  }
  
  /**
   * Mark worker as failed temporarily
   */
  markWorkerFailed(workerBinding) {
    this.failedWorkers.add(workerBinding);
    console.warn(`Worker ${workerBinding} marked as failed`);
    
    // Remove from failed list after 2 minutes
    setTimeout(() => {
      this.failedWorkers.delete(workerBinding);
      console.log(`Worker ${workerBinding} restored to rotation`);
    }, 2 * 60 * 1000);
  }
  
  /**
   * Forward request to internal worker using Service Bindings
   */
  async forwardRequest(request, env) {
    const maxRetries = 3;
    let lastError;
    let originalRequestBody = null;
    
    // Cache the request body once since it can only be read once
    try {
      if (request.method === 'POST') {
        const clone = request.clone();
        originalRequestBody = await clone.json();
      }
    } catch (e) {
      // Not JSON or already consumed, that's okay
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const workerBinding = this.getNextWorker();
      
      try {
        console.log(`Forwarding request to worker binding ${workerBinding} (attempt ${attempt}/3)`);
        
        // Use service binding to call internal worker
        const response = await env[workerBinding].fetch(request.clone());
        
        if (response.ok) {
          console.log(`Internal worker ${workerBinding} responded successfully`);
          
          // Return response without modifying headers (CORS handled at main level)
          return response;
        } else {
          throw new Error(`Worker returned status: ${response.status}`);
        }
        
      } catch (error) {
        console.error(`Worker binding ${workerBinding} failed (attempt ${attempt}):`, error.message);
        lastError = error;
        
        if (attempt < maxRetries) {
          this.markWorkerFailed(workerBinding);
          continue;
        }
      }
    }
    
    // All retries failed - attempt fallback before returning 503
    console.error('All internal workers failed after retries');
    
    const url = new URL(request.url);
    // Only attempt fallback for direct image generation requests
    if (url.pathname === '/api/generate-image' && request.method === 'POST') {
      try {
        const prompt = originalRequestBody?.prompt;
        if (prompt && typeof prompt === 'string' && prompt.trim().length > 0 && prompt.length <= 1000) {
          const encoded = encodeURIComponent(prompt.trim());
          const imageUrl = `https://image.pollinations.ai/prompt/${encoded}`;
          console.warn('Using direct Pollinations fallback for prompt:', prompt);

          return new Response(JSON.stringify({
            success: true,
            imageUrl,
            prompt,
            serverUsed: 'pollinations-direct-fallback',
            fallback: true,
            timestamp: new Date().toISOString()
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
      } catch (e) {
        // If fallback attempt fails, continue to return 503 below
        console.warn('Fallback attempt failed:', e?.message || e);
      }
    }

    return new Response(JSON.stringify({
      error: 'All internal workers unavailable',
      details: lastError?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: { 
        'Content-Type': 'application/json'
        // CORS headers will be added at the main handler level
      }
    });
  }
  
  /**
   * Get load balancer status
   */
  getStatus() {
    const totalWorkers = this.workerBindings.length;
    const failedWorkers = this.failedWorkers.size;
    const activeWorkers = totalWorkers - failedWorkers;
    
    return {
      totalWorkers,
      activeWorkers,
      failedWorkers,
      healthPercent: Math.round((activeWorkers / totalWorkers) * 100),
      currentIndex: this.currentIndex,
      failedList: Array.from(this.failedWorkers)
    };
  }
}

// CORS headers with specific allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  'https://testing-repo-swart-eight.vercel.app',
  'https://abracadraw.navgurukul.org'
];

const getCorsHeaders = (origin) => {
  const isAllowed = allowedOrigins.includes(origin) || !origin; // Allow no origin for direct API calls
  return {
    'Access-Control-Allow-Origin': isAllowed ? (origin || '*') : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
};

// Main request handler
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const origin = request.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  // Initialize load balancer
  const loadBalancer = new InternalLoadBalancer(env);

  try {
    // API routes - forward to internal workers
    if (path.startsWith('/api/')) {
      const response = await loadBalancer.forwardRequest(request, env);
      
      // Read the response body first
      const responseBody = await response.text();
      
      // Add CORS headers to the response
      const modifiedResponse = new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
          'X-Load-Balancer': 'main-worker'
        }
      });
      
      return modifiedResponse;
    }
    
    // Root endpoint - Main API documentation
    if (path === '/' && method === 'GET') {
      const status = loadBalancer.getStatus();
      
      return new Response(JSON.stringify({
        name: "AI Image Generation API - Load Balanced",
        version: "2.0.0",
        description: "High-capacity AI image generation with 20-worker load balancing",
        platform: "Cloudflare Workers (Main Load Balancer)",
        
        loadBalancer: {
          totalWorkers: status.totalWorkers,
          activeWorkers: status.activeWorkers,
          healthPercent: status.healthPercent + '%',
          distribution: 'Round-robin with automatic failover'
        },
        
        capacity: {
          dailyRequests: '2,000,000',
          monthlyRequests: '60,000,000',
          perUserCapacity: '20,000 requests/month (for 3000 users)'
        },
        
        endpoints: {
          generateImage: {
            method: "POST",
            path: "/api/generate-image",
            description: "Generate image from text prompt with load balancing",
            body: {
              prompt: "string (required, max 1000 characters)"
            }
          },
          health: {
            method: "GET",
            path: "/api/health", 
            description: "Health check of load balancer and workers"
          },
          status: {
            method: "GET",
            path: "/api/status",
            description: "Detailed load balancer statistics"
          }
        },
        
        examples: {
          curl: `curl -X POST ${url.origin}/api/generate-image \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "a beautiful sunset over mountains"}'`,
          
          javascript: `fetch('${url.origin}/api/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'a beautiful sunset over mountains' })
}).then(res => res.json()).then(data => console.log(data));`
        },
        
        features: [
          "🎨 AI-powered image generation",
          "⚡ 20-worker load balancing", 
          "🔄 Automatic failover",
          "🌍 Global edge deployment",
          "📊 2M daily request capacity",
          "🛡️ Built-in error handling"
        ],
        
        timestamp: new Date().toISOString()
      }, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Load balancer status endpoint
    if (path === '/status' && method === 'GET') {
      const status = loadBalancer.getStatus();
      
      return new Response(JSON.stringify({
        success: true,
        loadBalancer: status,
        timestamp: new Date().toISOString()
      }, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // 404 for unknown routes
    return new Response(JSON.stringify({
      success: false,
      error: 'Route not found',
      availableEndpoints: [
        'GET /',
        'GET /status', 
        'POST /api/generate-image',
        'GET /api/health',
        'GET /api/status'
      ]
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Main worker error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal load balancer error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Export for Cloudflare Workers
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};