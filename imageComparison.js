/**
 * Image Comparison Logic using SiliconFlow API
 * Compares two images and provides feedback in Hinglish for children
 */

const SILICONFLOW_API_URL = 'https://api.siliconflow.com/v1/chat/completions';
const SILICONFLOW_MODEL = 'Qwen/Qwen3-VL-8B-Instruct';

/**
 * Convert image to base64 format
 * Supports: data URLs, HTTP/HTTPS URLs, blob URLs
 */
async function imageToBase64(imagePath) {
  try {
    // If already a data URL, extract base64 part
    if (imagePath.startsWith('data:image/')) {
      const base64Match = imagePath.match(/base64,(.+)/);
      if (base64Match) {
        return base64Match[1];
      }
      throw new Error('Invalid data URL format');
    }

    // If it's a URL (HTTP/HTTPS/blob), fetch and convert
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('blob:')) {
      const response = await fetch(imagePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText} from ${imagePath}`);
      }
      
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result;
          const base64Match = dataUrl.match(/base64,(.+)/);
          if (base64Match) {
            resolve(base64Match[1]);
          } else {
            reject(new Error('Failed to convert blob to base64'));
          }
        };
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.readAsDataURL(blob);
      });
    }

    throw new Error(`Unsupported image format: ${imagePath}`);
  } catch (error) {
    throw new Error(`Image conversion failed: ${error.message}`);
  }
}

/**
 * Build prompt template for comparison
 */
function buildComparisonPrompt(originalPrompt) {
  const promptSection = originalPrompt ? `✏️ SECOND: Generated (prompt: "${originalPrompt}")` : '✏️ SECOND: Generated image';
  
  return `Compare these two images:
🎯 FIRST: Target image
${promptSection}

Note: Use simple, playful Hinglish (Hindi + English) suitable for a 5-8 year old child.
Note: Keep all suggestions simple and actionable, giving short English prompt examples where needed.

Format EXACTLY as:
SIMILARITY SCORE: [number]%
VISUAL DIFFERENCES: [max 70 simple words brief analysis in Hinglish for 5-8 year boy]
PROMPT IMPROVEMENTS: [max 70 simple words concise suggestions in Hinglish for 5-8 year boy]`;
}

/**
 * Parse AI response to extract structured data
 */
function parseComparisonResponse(responseText) {
  const result = {
    similarityScore: null,
    keyDifferences: '',
    promptImprovements: '',
    fullResponse: responseText
  };

  try {
    // Extract similarity score
    const scoreMatch = responseText.match(/SIMILARITY\s+SCORE:\s*(\d+)%/i);
    if (scoreMatch) {
      result.similarityScore = parseInt(scoreMatch[1], 10);
    }

    // Extract visual differences
    const diffMatch = responseText.match(/VISUAL\s+DIFFERENCES:\s*(.+?)(?=PROMPT\s+IMPROVEMENTS:|$)/is);
    if (diffMatch) {
      result.keyDifferences = diffMatch[1].trim();
    }

    // Extract prompt improvements
    const improvMatch = responseText.match(/PROMPT\s+IMPROVEMENTS:\s*(.+?)$/is);
    if (improvMatch) {
      result.promptImprovements = improvMatch[1].trim();
    }

    return result;
  } catch (error) {
    console.error('Error parsing response:', error);
    return result;
  }
}

/**
 * Main function: Compare two images using SiliconFlow API
 * @param {string} targetImagePath - Target image (path, URL, or data URL)
 * @param {string} generatedImagePath - Generated image (path, URL, or data URL)
 * @param {string} originalPrompt - User's original prompt (optional)
 * @param {string} apiKey - SiliconFlow API key
 * @returns {Promise<Object>} Comparison result with score, differences, and improvements
 */
export async function compareImagesWithSiliconFlow(targetImagePath, generatedImagePath, originalPrompt = '', apiKey) {
  try {
    // Validate API key
    if (!apiKey) {
      throw new Error('SiliconFlow API key not found');
    }

    console.log('🔍 Starting image comparison...');

    // Convert both images to base64
    const targetBase64 = await imageToBase64(targetImagePath);
    const generatedBase64 = await imageToBase64(generatedImagePath);

    console.log('✅ Images converted to base64');

    // Build request payload
    const requestPayload = {
      model: SILICONFLOW_MODEL,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: buildComparisonPrompt(originalPrompt)
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${targetBase64}`
            }
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${generatedBase64}`
            }
          }
        ]
      }],
      max_tokens: 800,
      temperature: 0.2,
      stream: false
    };

    console.log('📤 Sending request to SiliconFlow API...');

    // Call SiliconFlow API
    const response = await fetch(SILICONFLOW_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`SiliconFlow API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Received response from SiliconFlow');

    // Extract and parse response
    const aiResponse = data?.choices?.[0]?.message?.content || '';
    
    if (!aiResponse) {
      throw new Error('No content in API response');
    }

    const parsed = parseComparisonResponse(aiResponse);

    // Return complete result
    return {
      success: true,
      similarityScore: parsed.similarityScore,
      fullResponse: parsed.fullResponse,
      keyDifferences: parsed.keyDifferences,
      promptImprovements: parsed.promptImprovements,
      metadata: {
        model: SILICONFLOW_MODEL,
        provider: 'SiliconFlow',
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ Image comparison error:', error);
    return {
      success: false,
      error: error.message,
      similarityScore: null,
      fullResponse: '',
      keyDifferences: '',
      promptImprovements: ''
    };
  }
}

/**
 * Simplified function: Returns only similarity score
 */
export async function compareImagesSimple(targetImagePath, generatedImagePath, originalPrompt = '', apiKey) {
  const result = await compareImagesWithSiliconFlow(targetImagePath, generatedImagePath, originalPrompt, apiKey);
  return result.similarityScore || 0;
}

/**
 * Function with structured feedback for UI
 */
export async function compareImagesWithFeedback(targetImagePath, generatedImagePath, originalPrompt = '', apiKey) {
  const result = await compareImagesWithSiliconFlow(targetImagePath, generatedImagePath, originalPrompt, apiKey);
  
  if (!result.success) {
    return {
      score: 0,
      feedback: '',
      improvements: '',
      fullResponse: '',
      error: result.error
    };
  }

  return {
    score: result.similarityScore || 0,
    feedback: result.keyDifferences,
    improvements: result.promptImprovements,
    fullResponse: result.fullResponse
  };
}

/**
 * Get quality information based on similarity percentage
 */
export function getQualityInfo(percentage) {
  if (percentage >= 85) {
    return { text: 'Excellent Match!', color: '#22c55e', emoji: '🎯' };
  } else if (percentage >= 70) {
    return { text: 'Very Good Match', color: '#65a30d', emoji: '👍' };
  } else if (percentage >= 55) {
    return { text: 'Good Match', color: '#84cc16', emoji: '👌' };
  } else if (percentage >= 40) {
    return { text: 'Fair Match', color: '#ca8a04', emoji: '🤔' };
  } else if (percentage >= 25) {
    return { text: 'Poor Match', color: '#ea580c', emoji: '😐' };
  } else {
    return { text: 'Very Poor Match', color: '#dc2626', emoji: '😟' };
  }
}
