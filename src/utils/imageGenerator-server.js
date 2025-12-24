/**
 * Image Generation Module for Express Server (Local Development)
 * Uses process.env for environment variables and includes caching
 */

// API Configuration - Load balancing across multiple API keys
const API_KEYS = [
  process.env.IMAGE_ROUTER_API_KEY_1,
  process.env.IMAGE_ROUTER_API_KEY_2,
  process.env.IMAGE_ROUTER_API_KEY_3,
  process.env.IMAGE_ROUTER_API_KEY_4,
  process.env.IMAGE_ROUTER_API_KEY_5,
  process.env.IMAGE_ROUTER_API_KEY_6,
  process.env.IMAGE_ROUTER_API_KEY_7
].filter(key => key); // Remove undefined keys

const API_URL = 'https://api.imagerouter.io/v1/openai/images/generations';

// Validate API keys on module load
if (API_KEYS.length === 0) {
  console.warn('⚠️ WARNING: No API keys found in environment variables!');
} else {
  console.log(`✅ Loaded ${API_KEYS.length} API keys for load balancing`);
}

// Round-robin counter for API key selection
let apiKeyIndex = 0;

/**
 * Get next API key using round-robin load balancing
 */
const getNextApiKey = () => {
  if (API_KEYS.length === 0) return '';
  const key = API_KEYS[apiKeyIndex];
  apiKeyIndex = (apiKeyIndex + 1) % API_KEYS.length;
  console.log(`🔑 Using API key #${apiKeyIndex === 0 ? API_KEYS.length : apiKeyIndex} of ${API_KEYS.length}`);
  return key;
};

// Cache for storing prompt -> imageUrl mappings
const imageCache = new Map();

/**
 * Generate an image from a text prompt using ImageRouter.io API
 * Uses caching - same prompt returns same image without API call
 * @param {string} prompt - The text prompt to generate image from
 * @returns {Promise<string>} - URL of the generated image
 */
export const generateImage = async (prompt) => {
  try {
    // Validate prompt
    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Prompt cannot be empty");
    }

    const normalizedPrompt = prompt.trim().toLowerCase();
    
    // Check cache first
    if (imageCache.has(normalizedPrompt)) {
      const cachedUrl = imageCache.get(normalizedPrompt);
      console.log(`✅ Returning cached image for prompt: "${prompt}"`);
      console.log(`📦 Cache hit! Image URL: ${cachedUrl}`);
      return cachedUrl;
    }

    console.log(`🎨 Generating NEW image with ImageRouter.io for prompt: "${prompt}"`);

    // Enhance prompt for exact literal interpretation
    const enhancedPrompt = `${prompt.trim()}, exactly as described, nothing more nothing less, literal interpretation, precise and accurate`;

    // Get next API key for load balancing
    const apiKey = getNextApiKey();
    
    if (!apiKey) {
      throw new Error('No API key available');
    }

    // Call ImageRouter.io API with optimized parameters for accuracy
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        model: 'run-diffusion/Juggernaut-Lightning-Flux',
        n: 1,
        size: 'auto',
        quality: 'auto',
        output_format: 'webp'
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

    // Store in cache
    imageCache.set(normalizedPrompt, imageUrl);
    console.log(`✅ Successfully generated image: ${imageUrl}`);
    console.log(`💾 Cached for future use. Total cached prompts: ${imageCache.size}`);
    
    return imageUrl;
    
  } catch (error) {
    console.error("❌ Error in generateImage:", error);
    throw new Error(`Image generation failed: ${error.message}`);
  }
};

/**
 * Clear the image cache
 */
export const clearImageCache = () => {
  const size = imageCache.size;
  imageCache.clear();
  console.log(`🗑️ Cleared ${size} cached images`);
  return size;
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: imageCache.size,
    prompts: Array.from(imageCache.keys())
  };
};

/**
 * Generate image with progress callback
 * @param {string} prompt - The text prompt
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<string>} - Generated image URL
 */
export const generateImageWithProgress = async (prompt, onProgress = null) => {
  try {
    if (onProgress) onProgress("Starting image generation...");
    
    const imageUrl = await generateImage(prompt);
    
    if (onProgress) onProgress("Image generated successfully!");
    
    return imageUrl;
  } catch (error) {
    if (onProgress) onProgress(`Error: ${error.message}`);
    throw error;
  }
};
