# Source Code Structure

This directory contains all the source code for the Prompt Learning Server.

## 📁 Directory Structure

```
src/
├── config/               # Configuration files
│   └── constants.js      # Centralized constants and config
├── utils/                # Utility modules
│   └── imageGenerator-server.js  # Server-specific image generator (with caching)
├── workers/              # Cloudflare Workers
│   ├── worker.js         # Individual worker (20 instances)
│   └── main-worker.js    # Load balancer worker
├── server/               # Express server (local development)
│   └── server.js         # Main Express application
├── imageGenerator.js     # Image generation module (for Workers)
├── imageComparison.js    # Image comparison module (for Workers)
└── loadbalancer.js       # Client-side load balancer
```

## 📝 File Descriptions

### Configuration
- **config/constants.js**: Centralized configuration for API endpoints, retry logic, and server settings

### Core Modules (Cloudflare Workers)
- **imageGenerator.js**: Image generation using ImageRouter.io API with round-robin key rotation
- **imageComparison.js**: Image comparison using SiliconFlow API with retry mechanism and exponential backoff

### Workers
- **workers/worker.js**: Individual Cloudflare Worker that handles image generation and comparison requests
- **workers/main-worker.js**: Load balancer that distributes requests across 20 worker instances

### Server
- **server/server.js**: Express.js server for local development and testing
- **utils/imageGenerator-server.js**: Server-specific image generator with caching support

### Utils
- **loadbalancer.js**: Client-side load balancer for distributing requests to multiple Cloudflare Workers

## 🔄 Module Dependencies

```
workers/worker.js
  ├── imageGenerator.js
  │   └── config/constants.js
  └── imageComparison.js
      └── config/constants.js

server/server.js
  ├── utils/imageGenerator-server.js
  └── loadbalancer.js

workers/main-worker.js
  └── (Service bindings to worker.js instances)
```

## 🎯 Module Responsibilities

### imageGenerator.js (Workers)
- Round-robin API key selection
- Image generation via ImageRouter.io
- Error handling and validation
- Works with Cloudflare Workers env

### imageComparison.js (Workers)
- Round-robin comparison key selection
- Image comparison via SiliconFlow
- Retry logic with exponential backoff
- Response parsing for Hinglish feedback

### utils/imageGenerator-server.js (Express)
- Similar to imageGenerator.js but uses `process.env`
- Includes caching functionality
- Progress callback support
- Cache management functions

## 🚀 Usage Examples

### In Cloudflare Workers
```javascript
import { generateImage } from '../imageGenerator.js';
import { compareImages } from '../imageComparison.js';

// Generate image
const imageUrl = await generateImage(prompt, env);

// Compare images
const result = await compareImages(targetImage, generatedImage, prompt, env);
```

### In Express Server
```javascript
import { generateImage, getCacheStats, clearImageCache } from '../utils/imageGenerator-server.js';

// Generate image (with caching)
const imageUrl = await generateImage(prompt);

// Get cache stats
const stats = getCacheStats();

// Clear cache
clearImageCache();
```

## 🔧 Configuration

All hardcoded values have been moved to `config/constants.js`:
- API URLs and models
- Retry configuration
- Server settings
- Worker configuration

This makes it easy to update settings in one place.
