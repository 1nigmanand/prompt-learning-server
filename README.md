# Prompt Learning Server - API Only

A lightweight Node.js Express API server for AI-powered image generation using Pollinations AI. This is a backend-only service designed for deployment without any frontend dependencies.

## 🚀 Features

- 🎨 **AI Image Generation**: Generate high-quality images from text prompts
- 🔄 **Multiple Fallback URLs**: Ensures high success rate with various URL formats
- 📡 **Pure REST API**: Clean JSON API with no frontend dependencies
- 🚀 **Real-time Progress**: Server-Sent Events for progress updates
- 🛡️ **Production Ready**: Comprehensive error handling and security
- 📊 **Health Monitoring**: Built-in health check and status endpoints
- ⚡ **Lightweight**: Minimal dependencies for fast deployment

## 📋 API Endpoints

### `GET /`
Get API documentation and endpoint information.

**Response:**
```json
{
  "name": "Prompt Learning Server",
  "version": "1.0.0",
  "description": "AI-powered image generation API using Pollinations AI",
  "endpoints": {...},
  "usage": {...},
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### `POST /api/generate-image`
Generate an image from a text prompt.

**Request:**
```json
{
  "prompt": "a beautiful sunset over mountains"
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://image.pollinations.ai/prompt/...",
  "prompt": "a beautiful sunset over mountains"
}
```

### `POST /api/generate-image-stream`
Generate an image with real-time progress updates via Server-Sent Events.

**Request:**
```json
{
  "prompt": "a beautiful sunset over mountains"
}
```

**Response:** Server-Sent Events stream with progress updates.

### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

### `GET /api/status`
Detailed server status and statistics.

## 🚀 Deployment

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Test the API:**
   ```bash
   curl http://localhost:3000/api/health
   ```

### Production Deployment

#### Environment Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Set to "production" for production deployment

#### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t prompt-learning-server .
docker run -p 3000:3000 prompt-learning-server
```

#### Platform-Specific Deployments

**Heroku:**
```bash
# Create Procfile
echo "web: npm start" > Procfile

# Deploy
git init
git add .
git commit -m "Initial commit"
heroku create your-app-name
git push heroku main
```

**Railway:**
```bash
# No additional configuration needed
# Connect your GitHub repo to Railway
```

**Render:**
```bash
# Build Command: npm install
# Start Command: npm start
```

**DigitalOcean App Platform:**
```bash
# Runtime: Node.js
# Build Command: npm install
# Run Command: npm start
```

## 📝 Usage Examples

### cURL Examples

**Generate Image:**
```bash
curl -X POST https://your-domain.com/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a majestic lion in the African savanna"}'
```

**Health Check:**
```bash
curl https://your-domain.com/api/health
```

### JavaScript/Node.js

```javascript
const response = await fetch('https://your-domain.com/api/generate-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'a cozy coffee shop in winter'
  })
});

const data = await response.json();
console.log(data.imageUrl);
```

### Python

```python
import requests

response = requests.post('https://your-domain.com/api/generate-image', 
  json={'prompt': 'a futuristic cityscape'})

data = response.json()
print(data['imageUrl'])
```

## 🔧 Configuration

### Image Generation Parameters
- **Width**: 1024px (fixed)
- **Height**: 1024px (fixed)
- **Format**: Auto-detected by Pollinations AI
- **Fallback URLs**: 4 different URL formats for reliability

### Error Handling
- Input validation (prompt length, type)
- Network timeout handling
- Multiple URL format fallbacks
- Comprehensive error responses

## 📁 File Structure

```
prompt_learning_server/
├── server.js              # Main Express server
├── imageGenerator.js      # Image generation logic
├── package.json          # Dependencies
└── README.md            # This file
```

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin requests
- **Input validation**: Prompt sanitization
- **Rate limiting**: Request size limits

## 📊 Performance

- **Lightweight**: ~15MB total deployment size
- **Fast startup**: < 2 seconds cold start
- **Memory usage**: ~50MB base memory
- **Response time**: ~2-10 seconds per image generation

## 🛠️ Dependencies

**Production:**
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `helmet` - Security middleware

**Total bundle size:** ~15MB

## 🔍 Monitoring

The API provides built-in monitoring endpoints:

- `GET /api/health` - Basic health check
- `GET /api/status` - Detailed server statistics

## 📋 Requirements

- **Node.js**: 16.0.0 or higher
- **Memory**: 512MB minimum
- **Network**: Outbound HTTPS access for Pollinations AI

## 🐛 Troubleshooting

**Common Issues:**

1. **Image generation fails:**
   - Check network connectivity
   - Verify Pollinations AI service status
   - Review server logs for specific errors

2. **Server won't start:**
   - Verify Node.js version (16+)
   - Check port availability
   - Ensure all dependencies are installed

3. **CORS errors:**
   - Configure CORS origins in server.js
   - Verify request headers

## 📄 License

MIT License - Open source and free to use.

## 🤝 API Integration

This API is designed to be easily integrated into:
- Web applications
- Mobile apps
- Desktop applications
- Other microservices
- Automation tools

No frontend dependencies means faster deployment and better scalability for your specific use case.








create a lion running behind a dog and dog is barking on the lion 
