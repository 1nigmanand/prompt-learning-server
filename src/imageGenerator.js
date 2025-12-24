/**
 * Image Generation Module for Cloudflare Workers
 * Handles image generation using ImageRouter.io API with round-robin load balancing
 */

import { API_CONFIG } from './config/constants.js';

const API_URL = API_CONFIG.IMAGEROUTER.URL;

// Round-robin counter for API key selection (per worker instance)
let apiKeyIndex = 0;

/**
 * Get next API key using round-robin load balancing from environment
 * @param {Object} env - Cloudflare Workers environment
 * @returns {string} - Next API key
 */
export const getNextApiKey = (env) => {
  const API_KEYS = [
    env.IMAGE_ROUTER_API_KEY_1,
    env.IMAGE_ROUTER_API_KEY_2,
    env.IMAGE_ROUTER_API_KEY_3,
    env.IMAGE_ROUTER_API_KEY_4,
    env.IMAGE_ROUTER_API_KEY_5,
    env.IMAGE_ROUTER_API_KEY_6,
    env.IMAGE_ROUTER_API_KEY_7
  ].filter(key => key);
  
  if (API_KEYS.length === 0) {
    throw new Error('No API keys configured');
  }
  
  const key = API_KEYS[apiKeyIndex];
  apiKeyIndex = (apiKeyIndex + 1) % API_KEYS.length;
  return key;
};

/**
 * Generate an image from a text prompt using ImageRouter.io API
 * @param {string} prompt - The text prompt to generate image from
 * @param {Object} env - Cloudflare Workers environment
 * @returns {Promise<string>} - URL of the generated image
 */
export const generateImage = async (prompt, env) => {
  try {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Prompt cannot be empty");
    }

    console.log(`🎨 Generating image with ImageRouter.io for prompt: "${prompt}"`);

    // Enhance prompt for exact literal interpretation
    const enhancedPrompt = `${prompt.trim()}, exactly as described, nothing more nothing less, literal interpretation, precise and accurate`;

    // Get next API key for load balancing
    const apiKey = getNextApiKey(env);

    // Call ImageRouter.io API with optimized parameters for accuracy
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        model: API_CONFIG.IMAGEROUTER.MODEL,
        n: 1,
        size: 'auto',
        quality: 'auto',
        output_format: API_CONFIG.IMAGEROUTER.OUTPUT_FORMAT
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`ImageRouter.io API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    // Extract image URL from response
    const imageUrl = data?.data?.[0]?.url || data?.url || data?.image_url;
    
    if (!imageUrl) {
      console.error('Unexpected API response:', data);
      throw new Error('No image URL in API response');
    }

    console.log(`✅ Successfully generated image: ${imageUrl}`);
    return imageUrl;
    
  } catch (error) {
    console.error("❌ Error in generateImage:", error);
    throw new Error(`Image generation failed: ${error.message}`);
  }
};