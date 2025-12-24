/**
 * Image Generation Routes
 * Handles all image generation related endpoints
 */

import { generateImage } from '../imageGenerator.js';

const basicHeaders = {
  'Content-Type': 'application/json'
};

/**
 * POST /api/generate-image
 * Generate image from text prompt
 */
export async function handleGenerateImage(request, env) {
  try {
    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content-Type must be application/json'
      }), {
        status: 400,
        headers: basicHeaders
      });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: basicHeaders
      });
    }

    const { prompt } = body;
    
    // Validation
    if (!prompt) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Prompt is required'
      }), {
        status: 400,
        headers: basicHeaders
      });
    }
    
    if (typeof prompt !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Prompt must be a string'
      }), {
        status: 400,
        headers: basicHeaders
      });
    }
    
    if (prompt.trim().length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Prompt cannot be empty'
      }), {
        status: 400,
        headers: basicHeaders
      });
    }
    
    if (prompt.length > 1000) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Prompt too long (max 1000 characters)'
      }), {
        status: 400,
        headers: basicHeaders
      });
    }
    
    console.log(`🎨 Generating image for prompt: "${prompt}"`);
    
    // Generate image
    const imageUrl = await generateImage(prompt, env);
    
    console.log(`✅ Image generated successfully: ${imageUrl}`);
    
    return new Response(JSON.stringify({
      success: true,
      imageUrl: imageUrl,
      prompt: prompt,
      timestamp: new Date().toISOString(),
      generatedBy: 'ImageRouter.io (Juggernaut-Lightning-Flux)',
      platform: 'Cloudflare Workers'
    }), {
      status: 200,
      headers: basicHeaders
    });
    
  } catch (error) {
    console.error('❌ Error generating image:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to generate image',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: basicHeaders
    });
  }
}

/**
 * POST /api/generate-image-stream
 * Generate image with streaming response (simplified for Workers)
 */
export async function handleGenerateImageStream(request, env) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.prompt) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Valid prompt is required'
      }), {
        status: 400,
        headers: basicHeaders
      });
    }

    const { prompt } = body;
    
    // Validation
    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Valid prompt is required'
      }), {
        status: 400,
        headers: basicHeaders
      });
    }
    
    // For Workers, return immediate result
    try {
      const imageUrl = await generateImage(prompt, env);
      
      return new Response(JSON.stringify({
        success: true,
        imageUrl: imageUrl,
        prompt: prompt,
        timestamp: new Date().toISOString(),
        generatedBy: 'ImageRouter.io (Juggernaut-Lightning-Flux)',
        platform: 'Cloudflare Workers',
        note: 'Streaming simplified for Workers environment'
      }), {
        status: 200,
        headers: basicHeaders
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: basicHeaders
      });
    }
    
  } catch (error) {
    console.error('❌ Error in stream endpoint:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to generate image'
    }), {
      status: 500,
      headers: basicHeaders
    });
  }
}
