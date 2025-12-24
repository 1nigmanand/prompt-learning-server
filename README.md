# 🎨 Prompt Learning Server

AI-powered Image Generation API deployed on Cloudflare Workers with load balancing across 20 edge servers.

## 📁 Project Structure

```
prompt_learning_server/
├── src/
│   ├── workers/           # Cloudflare Workers
│   │   ├── worker.js      # Individual worker (20 instances)
│   │   └── main-worker.js # Load balancer (public entry)
│   ├── server/            # Express server (local dev)
│   │   └── server.js
│   └── *.js              # Utility modules
├── tests/                 # Test files
│   └── test-api.js
├── scripts/               # Deployment scripts
├── docs/                  # Documentation
├── package.json          # Dependencies & scripts
├── wrangler.toml         # Cloudflare Workers config
├── .env.example          # Environment variables template
└── README.md             # This file
```

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start Express server
npm run dev

# Test API
npm test
```

### Cloudflare Workers Deployment
```bash
# Deploy load balancer + all workers
npm run worker:deploy:all

# Deploy specific server
npm run worker:deploy:server1

# Watch logs
npm run worker:tail
```

## 🔑 Environment Variables

Create `.env` file with:
```env
# Image Generation API Keys (7 keys for load balancing)
IMAGE_ROUTER_API_KEY_1=your_key_1
IMAGE_ROUTER_API_KEY_2=your_key_2
...

# Image Comparison API Keys (8 keys for load balancing)
COMPARISON_API_KEY_1=your_comparison_key_1
COMPARISON_API_KEY_2=your_comparison_key_2
...
```

## 📡 API Endpoints

### Generate Image
```bash
POST /api/generate-image
Content-Type: application/json

{
  "prompt": "a beautiful sunset over mountains"
}
```

### Compare Images
```bash
POST /api/compare-images
Content-Type: application/json

{
  "targetImage": "data:image/jpeg;base64,...",
  "generatedImage": "data:image/jpeg;base64,...",
  "originalPrompt": "sunset"
}
```

### Health Check
```bash
GET /api/health
```

## 🌐 Live URLs

- **Main Load Balancer**: `https://prompt-learning-server.prompt-tool.workers.dev`
- **Individual Workers**: `https://prompt-server-{1-20}.prompt-tool.workers.dev`

## 🛠️ Tech Stack

- **Runtime**: Cloudflare Workers (Edge Computing)
- **Image Generation**: ImageRouter.io (Juggernaut-Lightning-Flux)
- **Image Comparison**: SiliconFlow API (Qwen3-VL-8B-Instruct)
- **Local Dev**: Express.js
- **Load Balancing**: 20 Workers + Round-robin API key rotation

## 📊 Features

✅ Global edge deployment (200+ cities)  
✅ Load balancing across 20 workers  
✅ Round-robin API key rotation  
✅ Automatic retry with exponential backoff  
✅ Image generation with prompt enhancement  
✅ Image comparison in Hinglish for kids  
✅ < 50ms average response time  

## 🔒 Security

- API keys stored as Cloudflare secrets
- CORS enabled for authorized domains
- Rate limiting per worker
- Input validation & sanitization

## 📝 License

MIT
