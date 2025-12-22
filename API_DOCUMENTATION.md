# Image Comparison Logic Documentation

## Overview
SiliconFlow API का इस्तेमाल करके two images को compare करने का complete logic.

---

## API Configuration

**Provider:** SiliconFlow  
**Model:** Qwen/Qwen3-VL-8B-Instruct  
**Endpoint:** https://api.siliconflow.com/v1/chat/completions  
**Cost:** $0.05 per million tokens  

### Environment Setup
```env
VITE_SILICONFLOW_API_KEY=your_api_key_here
```

---

## Request Format

### 1. Basic Request Structure

```javascript
{
  model: "Qwen/Qwen3-VL-8B-Instruct",
  messages: [{
    role: "user",
    content: [
      { 
        type: "text", 
        text: "Compare these images..." 
      },
      { 
        type: "image_url", 
        image_url: { 
          url: "data:image/jpeg;base64,<BASE64_IMAGE_1>" 
        } 
      },
      { 
        type: "image_url", 
        image_url: { 
          url: "data:image/jpeg;base64,<BASE64_IMAGE_2>" 
        } 
      }
    ]
  }],
  max_tokens: 800,
  temperature: 0.2,
  stream: false
}
```

### 2. Headers
```javascript
{
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
}
```

### 3. Prompt Template (With Original Prompt)
```text
Compare these two images:
🎯 FIRST: Target image
✏️ SECOND: Generated (prompt: "user's original prompt")

Note: Use simple, playful Hinglish (Hindi + English) suitable for a 5-8 year old child.
Note: Keep all suggestions simple and actionable, giving short English prompt examples where needed.

Format EXACTLY as:
SIMILARITY SCORE: [number]%
VISUAL DIFFERENCES: [max 70 simple words brief analysis in Hinglish for 5-8 year boy]
PROMPT IMPROVEMENTS: [max 70 simple words concise suggestions in Hinglish for 5-8 year boy]
```

---

## Response Format

### Success Response Structure
```javascript
{
  success: true,
  similarityScore: 75,  // 0-100
  fullResponse: "SIMILARITY SCORE: 75%\nVISUAL DIFFERENCES: ...\nPROMPT IMPROVEMENTS: ...",
  keyDifferences: "Dekho! Target image mein ek bada lal apple hai...",
  promptImprovements: "Agar sirf ek lal apple chahiye...",
  metadata: {
    model: "Qwen/Qwen3-VL-8B-Instruct",
    provider: "SiliconFlow",
    timestamp: "2025-12-21T10:30:45.123Z"
  }
}
```

### Error Response Structure
```javascript
{
  success: false,
  error: "Error message here",
  similarityScore: null,
  fullResponse: "",
  keyDifferences: "",
  promptImprovements: ""
}
```

---

## API Response Example

### Raw API Response
```json
{
  "choices": [
    {
      "message": {
        "content": "SIMILARITY SCORE: 75%\nVISUAL DIFFERENCES: Dekho! Target image mein ek bada lal apple hai. Lekin generated image mein do apple hain — ek orange aur ek lal! Background bhi safed nahi, hara hai.\nPROMPT IMPROVEMENTS: Agar sirf ek lal apple chahiye, toh likho 'one red apple on white background'. Agar leaves nahi chahiye, toh likho 'no leaves'."
      }
    }
  ]
}
```

### Parsed Response
```javascript
{
  success: true,
  similarityScore: 75,
  fullResponse: "SIMILARITY SCORE: 75%\nVISUAL DIFFERENCES: Dekho! Target image mein...",
  keyDifferences: "Dekho! Target image mein ek bada lal apple hai. Lekin generated image mein do apple hain — ek orange aur ek lal! Background bhi safed nahi, hara hai.",
  promptImprovements: "Agar sirf ek lal apple chahiye, toh likho 'one red apple on white background'. Agar leaves nahi chahiye, toh likho 'no leaves'.",
  metadata: {
    model: "Qwen/Qwen3-VL-8B-Instruct",
    provider: "SiliconFlow",
    timestamp: "2025-12-21T10:30:45.123Z"
  }
}
```

---

## Function Exports

### 1. `compareImagesWithSiliconFlow(targetImagePath, generatedImagePath, originalPrompt)`
**Input:**
- `targetImagePath`: String - Path or data URL of target image
- `generatedImagePath`: String - Path or data URL of generated image  
- `originalPrompt`: String (optional) - User's original prompt

**Output:**
```javascript
{
  success: Boolean,
  similarityScore: Number | null,
  fullResponse: String,
  keyDifferences: String,
  promptImprovements: String,
  metadata?: Object,
  error?: String
}
```

---

### 2. `compareImagesSimple(targetImagePath, generatedImagePath, originalPrompt)`
**Input:**
- Same as above

**Output:**
```javascript
Number // 0-100 similarity score
```

---

### 3. `compareImagesWithFeedback(targetImagePath, generatedImagePath, originalPrompt)`
**Input:**
- Same as above

**Output:**
```javascript
{
  score: Number,           // 0-100
  feedback: String,        // Visual differences
  improvements: String,    // Prompt improvements
  fullResponse: String,    // Complete AI response
  error?: String          // If failed
}
```

---

### 4. `getQualityInfo(percentage)`
**Input:**
- `percentage`: Number (0-100)

**Output:**
```javascript
{
  text: String,    // "Excellent Match!", "Good Match", etc.
  color: String,   // Hex color code
  emoji: String    // "🎯", "👍", "😐", etc.
}
```

**Quality Ranges:**
- 85-100%: Excellent Match! 🎯 (Green #22c55e)
- 70-84%: Very Good Match 👍 (Lime #65a30d)
- 55-69%: Good Match 👌 (Light green #84cc16)
- 40-54%: Fair Match 🤔 (Yellow #ca8a04)
- 25-39%: Poor Match 😐 (Orange #ea580c)
- 0-24%: Very Poor Match 😟 (Red #dc2626)

---

## Image Processing Logic

### Supported Image Formats

1. **Data URLs**
   ```javascript
   "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
   ```

2. **Vite Asset Paths**
   ```javascript
   "/src/assets/images/apple.png"
   "src/assets/images/apple.png"
   ```

3. **HTTP/HTTPS URLs**
   ```javascript
   "https://example.com/image.jpg"
   ```

4. **Blob URLs**
   ```javascript
   "blob:http://localhost:5173/abc-123-def"
   ```

### Image to Base64 Conversion Flow

```
Input Image Path
     ↓
Is it data URL? → Yes → Extract base64 part
     ↓ No
Is it /src/ path? → Yes → Convert to URL with origin
     ↓ No
Is it HTTP/HTTPS/blob? → Yes → Fetch → Convert to blob → FileReader → Base64
     ↓ No
Throw Error
```

---

## Error Handling

### Common Errors

1. **Missing API Key**
   ```javascript
   Error: "SiliconFlow API key not found. Please set VITE_SILICONFLOW_API_KEY in .env file."
   ```

2. **Image Fetch Failed**
   ```javascript
   Error: "Failed to fetch image: 404 Not Found from https://..."
   ```

3. **Invalid Image Format**
   ```javascript
   Error: "Unsupported image format: ..."
   ```

4. **API Error**
   ```javascript
   Error: "SiliconFlow API error: 401 - Unauthorized"
   ```

---

## Usage Examples

### Example 1: Simple Score Only
```javascript
import { compareImagesSimple } from './utils/imageComparison';

const score = await compareImagesSimple(
  '/src/assets/target.png',
  'data:image/jpeg;base64,/9j/4AAQ...',
  'a red apple'
);

console.log(score); // 75
```

### Example 2: With Full Feedback
```javascript
import { compareImagesWithFeedback } from './utils/imageComparison';

const result = await compareImagesWithFeedback(
  targetImage,
  generatedImage,
  'a red apple on white background'
);

console.log(result.score);         // 75
console.log(result.feedback);      // "Dekho! Target image mein..."
console.log(result.improvements);  // "Agar sirf ek lal apple..."
```

### Example 3: Complete Analysis
```javascript
import { compareImagesWithSiliconFlow } from './utils/imageComparison';

const analysis = await compareImagesWithSiliconFlow(
  targetImage,
  generatedImage,
  'a red apple'
);

if (analysis.success) {
  console.log(`Score: ${analysis.similarityScore}%`);
  console.log(`Differences: ${analysis.keyDifferences}`);
  console.log(`Improvements: ${analysis.promptImprovements}`);
  console.log(`Timestamp: ${analysis.metadata.timestamp}`);
}
```

### Example 4: Quality Info
```javascript
import { getQualityInfo } from './utils/imageComparison';

const quality = getQualityInfo(75);
console.log(quality);
// { text: "Very Good Match", color: "#65a30d", emoji: "👍" }
```

---

## Complete Flow Diagram

```
User Input (2 images + prompt)
         ↓
    initSiliconFlow() - Check API key
         ↓
    imageToBase64() - Convert both images
         ↓
    Build request payload with prompt template
         ↓
    POST to SiliconFlow API
         ↓
    Receive AI response
         ↓
    Parse response using regex patterns:
      - SIMILARITY SCORE: (\d+)%
      - VISUAL DIFFERENCES: (.+?)
      - PROMPT IMPROVEMENTS: (.+?)
         ↓
    Return formatted result object
         ↓
    Display to user (optional: getQualityInfo)
```

---

## Best Practices

1. **Always provide original prompt** for better feedback
2. **Handle errors gracefully** - API might fail
3. **Show loading state** - API takes 2-5 seconds
4. **Cache results** if comparing same images multiple times
5. **Use compareImagesSimple** for just score
6. **Use compareImagesWithFeedback** for UI feedback display
7. **Validate images** before sending to API

---

## Performance

- **Average Response Time:** 2-5 seconds
- **Max Tokens:** 800 (configured)
- **Temperature:** 0.2 (consistent results)
- **Stream:** false (get complete response at once)

---

## Notes

- Response is in **Hinglish** (Hindi + English) for 5-8 year old children
- Feedback is simple and playful
- Suggestions include example prompts in English
- Maximum 70 words per section (differences & improvements)
