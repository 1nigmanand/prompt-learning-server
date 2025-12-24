/**
 * Documentation Route
 * API documentation and information endpoint
 */

/**
 * GET /
 * Returns API documentation
 */
export async function handleRoot(request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  const apiDocs = {
    name: "AI Image Generation API",
    version: "1.0.0",
    description: "Generate images from text prompts using ImageRouter.io (Juggernaut-Lightning-Flux) - Deployed on Cloudflare Workers",
    platform: "Cloudflare Workers Edge",
    performance: {
      globalEdge: "Available in 200+ cities worldwide",
      latency: "< 50ms average response time",
      capacity: "100,000 requests/day per worker"
    },
    endpoints: {
      health: {
        method: "GET",
        path: "/api/health",
        description: "Health check endpoint"
      },
      status: {
        method: "GET", 
        path: "/api/status",
        description: "Service status and metrics"
      },
      generateImage: {
        method: "POST",
        path: "/api/generate-image",
        description: "Generate image from text prompt",
        body: {
          prompt: "string (required, max 1000 characters) - Text description for image generation"
        },
        example: {
          prompt: "a beautiful sunset over mountains with vibrant colors"
        }
      },
      generateImageStream: {
        method: "POST",
        path: "/api/generate-image-stream",
        description: "Generate image with progress updates",
        body: {
          prompt: "string (required, max 1000 characters)"
        }
      }
    },
    examples: {
      curl: `curl -X POST ${baseUrl}/api/generate-image \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "a beautiful sunset over mountains"}'`,
      javascript: `fetch('${baseUrl}/api/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'a beautiful sunset over mountains' })
}).then(res => res.json()).then(data => console.log(data));`,
      python: `import requests
response = requests.post('${baseUrl}/api/generate-image', 
  json={'prompt': 'a beautiful sunset over mountains'})
print(response.json())`
    },
    features: [
      "🎨 AI-powered image generation",
      "🔄 Multiple URL format fallbacks",
      "🌍 Global edge deployment",
      "⚡ Ultra-fast response times",
      "🛡️ Built-in error handling",
      "📊 Real-time progress updates"
    ]
  };
  
  return new Response(JSON.stringify(apiDocs, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
