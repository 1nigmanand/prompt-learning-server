// Simple Image Generation Utility for Prompt Learning Tool

/**
 * Generate an image from a text prompt using Pollinations AI
 * @param {string} prompt - The text prompt to generate image from
 * @returns {Promise<string>} - URL of the generated image
 */
export const generateImage = async (prompt) => {
  try {
    // Validate prompt
    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Prompt cannot be empty");
    }

    // Generation pattern with better error handling
    const width = 1024;
    const height = 1024;
    const seed = Math.floor(Math.random() * 1000);
    const encodedPrompt = encodeURIComponent(prompt.trim());
    
    // Multiple URL formats for better compatibility
    const urlFormats = [
      // Try this first since it's working
      () => `https://image.pollinations.ai/prompt/${encodedPrompt}`,
      // With minimal parameters
      () => `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}`,
      // With seed
      () => `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}`,
      // Full parameters without model parameter
      () => {
        const params = new URLSearchParams({
          width: width,
          height: height,
          seed: seed,
          nologo: 'true'
        });
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;
      }
    ];
    
    // Try each URL format
    for (let i = 0; i < urlFormats.length; i++) {
      const imageUrl = urlFormats[i]();
      
      try {
        // Test if the URL is accessible
        const isAccessible = await testImageUrl(imageUrl);
        
        if (isAccessible) {
          console.log(`✅ Successfully generated image using format ${i + 1}`);
          return imageUrl;
        }
      } catch (error) {
        console.warn(`❌ Format ${i + 1} failed:`, error.message);
        // Continue to next format
      }
    }
    
    // If all Pollinations URLs fail, throw error
    throw new Error("All image generation URL formats failed");
    
  } catch (error) {
    console.error("❌ Error in generateImage:", error);
    throw new Error(`Image generation failed: ${error.message}`);
  }
};

/**
 * Test if an image URL is accessible and loads successfully
 * @param {string} imageUrl - The image URL to test
 * @returns {Promise<boolean>} - True if image loads successfully
 */
const testImageUrl = async (imageUrl) => {
  try {
    // For server-side, we'll use fetch to test the URL
    const response = await fetch(imageUrl, { 
      method: 'HEAD',
      timeout: 10000 // 10 seconds timeout
    });
    
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch (error) {
    return false;
  }
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