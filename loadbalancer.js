/**
 * Load Balancer Client for Multiple Cloudflare Workers
 * Distributes traffic across 5+ servers for maximum reliability
 */

class ImageGenerationLoadBalancer {
  constructor() {
    // List of all 20 Cloudflare Workers for maximum load distribution
    this.servers = [
      // Cloudflare Workers (Primary - 20 servers)
      'https://prompt-server-1.prompt-tool.workers.dev',
      'https://prompt-server-2.prompt-tool.workers.dev',
      'https://prompt-server-3.prompt-tool.workers.dev',
      'https://prompt-server-4.prompt-tool.workers.dev',
      'https://prompt-server-5.prompt-tool.workers.dev',
      'https://prompt-server-6.prompt-tool.workers.dev',
      'https://prompt-server-7.prompt-tool.workers.dev',
      'https://prompt-server-8.prompt-tool.workers.dev',
      'https://prompt-server-9.prompt-tool.workers.dev',
      'https://prompt-server-10.prompt-tool.workers.dev',
      'https://prompt-server-11.prompt-tool.workers.dev',
      'https://prompt-server-12.prompt-tool.workers.dev',
      'https://prompt-server-13.prompt-tool.workers.dev',
      'https://prompt-server-14.prompt-tool.workers.dev',
      'https://prompt-server-15.prompt-tool.workers.dev',
      'https://prompt-server-16.prompt-tool.workers.dev',
      'https://prompt-server-17.prompt-tool.workers.dev',
      'https://prompt-server-18.prompt-tool.workers.dev',
      'https://prompt-server-19.prompt-tool.workers.dev',
      'https://prompt-server-20.prompt-tool.workers.dev',
      
      // Railway (Secondary - 2 servers) - Add after Railway deployment
      // 'https://prompt-server-prod.up.railway.app',
      // 'https://prompt-server-backup.up.railway.app',
      
      // Other platforms (Tertiary) - Add after other deployments
      // 'https://your-app.render.com',
      // 'https://your-app.vercel.app',
      // 'https://your-app.cyclic.app'
    ];
    
    this.currentServerIndex = 0;
    this.failedServers = new Set();
    this.serverStats = new Map();
    
    // Initialize stats
    this.servers.forEach(server => {
      this.serverStats.set(server, {
        requests: 0,
        failures: 0,
        avgResponseTime: 0,
        lastUsed: null
      });
    });
  }
  
  /**
   * Get next available server using round-robin with failure detection
   */
  getNextServer() {
    const availableServers = this.servers.filter(server => !this.failedServers.has(server));
    
    if (availableServers.length === 0) {
      // All servers failed, reset and try again
      console.warn('All servers failed, resetting failure list...');
      this.failedServers.clear();
      return this.servers[0];
    }
    
    // Round-robin through available servers
    const server = availableServers[this.currentServerIndex % availableServers.length];
    this.currentServerIndex++;
    
    return server;
  }
  
  /**
   * Mark server as failed temporarily
   */
  markServerFailed(serverUrl) {
    this.failedServers.add(serverUrl);
    const stats = this.serverStats.get(serverUrl);
    if (stats) {
      stats.failures++;
    }
    
    // Remove from failed list after 5 minutes
    setTimeout(() => {
      this.failedServers.delete(serverUrl);
      console.log(`Server ${serverUrl} restored to rotation`);
    }, 5 * 60 * 1000);
  }
  
  /**
   * Update server statistics
   */
  updateServerStats(serverUrl, responseTime, success) {
    const stats = this.serverStats.get(serverUrl);
    if (stats) {
      stats.requests++;
      stats.lastUsed = new Date();
      
      if (success) {
        // Update average response time
        stats.avgResponseTime = (stats.avgResponseTime + responseTime) / 2;
      } else {
        stats.failures++;
      }
    }
  }
  
  /**
   * Generate image with automatic load balancing and failover
   */
  async generateImage(prompt, options = {}) {
    const maxAttempts = Math.min(this.servers.length, 3); // Try max 3 servers
    const timeout = options.timeout || 30000; // 30 second timeout
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const serverUrl = this.getNextServer();
      const startTime = Date.now();
      
      try {
        console.log(`🎯 Attempt ${attempt + 1}: Using server ${serverUrl}`);
        
        const response = await fetch(`${serverUrl}/api/generate-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
          signal: AbortSignal.timeout(timeout)
        });
        
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          const data = await response.json();
          this.updateServerStats(serverUrl, responseTime, true);
          
          console.log(`✅ Success with ${serverUrl} in ${responseTime}ms`);
          
          return {
            ...data,
            serverUsed: serverUrl,
            responseTime: responseTime,
            attempt: attempt + 1
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        this.updateServerStats(serverUrl, responseTime, false);
        
        console.warn(`❌ Server ${serverUrl} failed (attempt ${attempt + 1}):`, error.message);
        
        if (error.name === 'TimeoutError' || responseTime > timeout) {
          this.markServerFailed(serverUrl);
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxAttempts - 1) {
          throw new Error(`All ${maxAttempts} server attempts failed. Last error: ${error.message}`);
        }
      }
    }
  }
  
  /**
   * Generate image with progress updates (simplified for multiple servers)
   */
  async generateImageWithProgress(prompt, onProgress = null) {
    try {
      if (onProgress) onProgress("Starting image generation...");
      if (onProgress) onProgress("Selecting optimal server...");
      
      const result = await this.generateImage(prompt);
      
      if (onProgress) onProgress(`Image generated successfully using ${result.serverUsed}!`);
      
      return result;
    } catch (error) {
      if (onProgress) onProgress(`Error: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Compare images with automatic load balancing and failover
   */
  async compareImages(targetImage, generatedImage, originalPrompt = '', options = {}) {
    const maxAttempts = Math.min(this.servers.length, 3); // Try max 3 servers
    const timeout = options.timeout || 60000; // 60 second timeout for comparison
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const serverUrl = this.getNextServer();
      const startTime = Date.now();
      
      try {
        console.log(`🔍 Attempt ${attempt + 1}: Comparing images using server ${serverUrl}`);
        
        const response = await fetch(`${serverUrl}/api/compare-images`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            targetImage, 
            generatedImage, 
            originalPrompt 
          }),
          signal: AbortSignal.timeout(timeout)
        });
        
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          const data = await response.json();
          this.updateServerStats(serverUrl, responseTime, true);
          
          console.log(`✅ Comparison success with ${serverUrl} in ${responseTime}ms`);
          
          return {
            ...data,
            serverUsed: serverUrl,
            responseTime: responseTime,
            attempt: attempt + 1
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        this.updateServerStats(serverUrl, responseTime, false);
        
        console.warn(`❌ Server ${serverUrl} failed (attempt ${attempt + 1}):`, error.message);
        
        if (error.name === 'TimeoutError' || responseTime > timeout) {
          this.markServerFailed(serverUrl);
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxAttempts - 1) {
          throw new Error(`All ${maxAttempts} server attempts failed. Last error: ${error.message}`);
        }
      }
    }
  }
  
  /**
   * Compare images with progress updates
   */
  async compareImagesWithProgress(targetImage, generatedImage, originalPrompt = '', onProgress = null) {
    try {
      if (onProgress) onProgress("Starting image comparison...");
      if (onProgress) onProgress("Selecting optimal server...");
      
      const result = await this.compareImages(targetImage, generatedImage, originalPrompt);
      
      if (onProgress) onProgress(`Comparison completed using ${result.serverUsed}!`);
      
      return result;
    } catch (error) {
      if (onProgress) onProgress(`Error: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Health check for all servers
   */
  async checkAllServersHealth() {
    const healthChecks = await Promise.allSettled(
      this.servers.map(async (server) => {
        const startTime = Date.now();
        try {
          const response = await fetch(`${server}/api/health`, {
            signal: AbortSignal.timeout(5000)
          });
          const responseTime = Date.now() - startTime;
          
          return {
            server,
            status: response.ok ? 'UP' : 'DOWN',
            responseTime: `${responseTime}ms`,
            statusCode: response.status
          };
        } catch (error) {
          return {
            server,
            status: 'DOWN',
            responseTime: 'TIMEOUT',
            error: error.message
          };
        }
      })
    );
    
    const results = healthChecks.map(result => 
      result.status === 'fulfilled' ? result.value : {
        server: 'Unknown',
        status: 'ERROR',
        error: result.reason?.message || 'Unknown error'
      }
    );
    
    console.table(results);
    return results;
  }
  
  /**
   * Get server statistics
   */
  getServerStats() {
    const stats = {};
    this.serverStats.forEach((stat, server) => {
      stats[server] = {
        ...stat,
        uptime: this.failedServers.has(server) ? 'DOWN' : 'UP',
        successRate: stat.requests > 0 ? 
          ((stat.requests - stat.failures) / stat.requests * 100).toFixed(2) + '%' : 'N/A'
      };
    });
    return stats;
  }
  
  /**
   * Add new server to rotation
   */
  addServer(serverUrl) {
    if (!this.servers.includes(serverUrl)) {
      this.servers.push(serverUrl);
      this.serverStats.set(serverUrl, {
        requests: 0,
        failures: 0,
        avgResponseTime: 0,
        lastUsed: null
      });
      console.log(`✅ Added new server: ${serverUrl}`);
    }
  }
  
  /**
   * Remove server from rotation
   */
  removeServer(serverUrl) {
    const index = this.servers.indexOf(serverUrl);
    if (index > -1) {
      this.servers.splice(index, 1);
      this.serverStats.delete(serverUrl);
      this.failedServers.delete(serverUrl);
      console.log(`❌ Removed server: ${serverUrl}`);
    }
  }
}

// Usage Examples:

// Create load balancer instance
const imageGenerator = new ImageGenerationLoadBalancer();

// Example 1: Basic image generation with load balancing
async function generateImageExample() {
  try {
    const result = await imageGenerator.generateImage("a beautiful sunset over mountains");
    console.log('Generated image:', result.imageUrl);
    console.log('Server used:', result.serverUsed);
    console.log('Response time:', result.responseTime + 'ms');
  } catch (error) {
    console.error('Generation failed:', error.message);
  }
}

// Example 2: Image generation with progress updates
async function generateImageWithProgressExample() {
  try {
    const result = await imageGenerator.generateImageWithProgress(
      "a cozy coffee shop in winter",
      (message) => console.log('Progress:', message)
    );
    console.log('Generated image:', result.imageUrl);
  } catch (error) {
    console.error('Generation failed:', error.message);
  }
}

// Example 3: Health check all servers
async function healthCheckExample() {
  console.log('Checking health of all servers...');
  const health = await imageGenerator.checkAllServersHealth();
  console.log('Health check completed');
}

// Example 4: Get server statistics
function getStatsExample() {
  const stats = imageGenerator.getServerStats();
  console.log('Server Statistics:', stats);
}

// ES6 export for Node.js modules
export default ImageGenerationLoadBalancer;

// Browser export
if (typeof window !== 'undefined') {
  window.ImageGenerationLoadBalancer = ImageGenerationLoadBalancer;
}