# Image Comparison Architecture Diagram

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATION                          │
│                    (Web, Mobile, Desktop, etc.)                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTP POST
                             │ /api/compare-images
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER (server.js)                     │
│                         http://localhost:3000                       │
│                                                                     │
│  Endpoints:                                                         │
│  • POST /api/generate-image      (existing)                        │
│  • POST /api/compare-images      (NEW!)                            │
│  • GET  /api/health                                                │
│  • GET  /api/status                                                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ Uses
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              LOAD BALANCER (loadbalancer.js)                        │
│              ImageGenerationLoadBalancer Class                      │
│                                                                     │
│  Methods:                                                           │
│  • generateImage()           - For image generation                │
│  • compareImages()           - For image comparison (NEW!)         │
│  • getNextServer()           - Round-robin selection               │
│  • markServerFailed()        - Failover handling                   │
│                                                                     │
│  Strategy:                                                          │
│  • Round-robin across 20 workers                                   │
│  • Max 3 retry attempts                                            │
│  • 60-second timeout for comparison                                │
│  • Automatic failover on errors                                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   WORKER 1-7    │  │   WORKER 8-14   │  │  WORKER 15-20   │
│                 │  │                 │  │                 │
│ prompt-server-1 │  │ prompt-server-8 │  │ prompt-server-15│
│ prompt-server-2 │  │ prompt-server-9 │  │ prompt-server-16│
│ prompt-server-3 │  │ prompt-server-10│  │ prompt-server-17│
│ prompt-server-4 │  │ prompt-server-11│  │ prompt-server-18│
│ prompt-server-5 │  │ prompt-server-12│  │ prompt-server-19│
│ prompt-server-6 │  │ prompt-server-13│  │ prompt-server-20│
│ prompt-server-7 │  │ prompt-server-14│  │                 │
│                 │  │                 │  │                 │
│ Each has:       │  │ Each has:       │  │ Each has:       │
│ • 7 Image Keys  │  │ • 7 Image Keys  │  │ • 7 Image Keys  │
│ • 8 Compare Keys│  │ • 8 Compare Keys│  │ • 8 Compare Keys│
│                 │  │                 │  │                 │
│ Endpoints:      │  │ Endpoints:      │  │ Endpoints:      │
│ • /api/generate │  │ • /api/generate │  │ • /api/generate │
│ • /api/compare  │  │ • /api/compare  │  │ • /api/compare  │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         │    Each worker rotates through 8 keys   │
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │         8 API KEYS (Rotating)          │
         │                                        │
         │  1. sk-dufgdzyrgxejceexpkrw... ◄─┐    │
         │  2. sk-klbnhgeqyyhlghumziqrh... ◄─┤    │
         │  3. sk-rrqdmurjhasrkogyhwxnx... ◄─┤    │
         │  4. sk-blyrbdmfzwptwzfnlzwux... ◄─┼─── Round-robin
         │  5. sk-cdkifaucvczuoonqfzlpm... ◄─┤    │
         │  6. sk-sruzwusfqszwtnjrwllfcv... ◄─┤    │
         │  7. sk-eqwhslctinxenodizmiap... ◄─┤    │
         │  8. sk-uopxmmrqiomcecvtcroop... ◄─┘    │
         └────────────────────┬───────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │        SILICONFLOW API                 │
         │                                        │
         │  Model: Qwen/Qwen3-VL-8B-Instruct     │
         │  Endpoint: api.siliconflow.com        │
         │  Task: Image Comparison               │
         │  Response: Similarity + Feedback      │
         └────────────────────────────────────────┘
```

---

## 🔄 Request Flow

### Image Comparison Request Flow

```
1. CLIENT SENDS REQUEST
   POST /api/compare-images
   {
     targetImage: "data:image/jpeg;base64,...",
     generatedImage: "data:image/png;base64,...",
     originalPrompt: "a red apple"
   }
        ↓
        
2. EXPRESS SERVER (server.js)
   • Validates request body
   • Checks data URL format
   • Calls loadBalancer.compareImages()
        ↓
        
3. LOAD BALANCER (loadbalancer.js)
   • Selects next worker (round-robin)
   • Sends request to worker
   • If fails, tries next worker (up to 3 attempts)
        ↓
        
4. CLOUDFLARE WORKER (worker.js)
   • Receives comparison request
   • Gets next comparison API key (round-robin)
   • Calls compareImages() function
        ↓
        
5. COMPARE IMAGES FUNCTION
   • Builds SiliconFlow API request
   • Sends both images as base64
   • Includes comparison prompt
        ↓
        
6. SILICONFLOW API
   • Analyzes both images
   • Generates comparison response
   • Returns similarity score + feedback
        ↓
        
7. WORKER PROCESSES RESPONSE
   • Parses AI response
   • Extracts: score, differences, improvements
   • Returns structured JSON
        ↓
        
8. LOAD BALANCER RECEIVES RESPONSE
   • Adds metadata (serverUsed, responseTime)
   • Updates server stats
   • Returns to Express server
        ↓
        
9. EXPRESS SERVER RETURNS TO CLIENT
   {
     success: true,
     similarityScore: 75,
     keyDifferences: "Dekho! Target image mein...",
     promptImprovements: "Agar sirf ek lal apple...",
     serverUsed: "prompt-server-3",
     responseTime: 2340
   }
```

---

## 🔑 API Key Distribution

### Total API Keys
- **Image Generation**: 7 keys per worker × 20 workers = **140 instances**
- **Image Comparison**: 8 keys per worker × 20 workers = **160 instances**
- **TOTAL**: **300 API key instances** across infrastructure

### Key Rotation Strategy

```
WORKER LEVEL (20 workers)
┌──────────────────────────────────────┐
│ Request 1 → Worker 1                 │
│ Request 2 → Worker 2                 │
│ Request 3 → Worker 3                 │
│ ...                                  │
│ Request 20 → Worker 20               │
│ Request 21 → Worker 1 (cycle back)   │
└──────────────────────────────────────┘

API KEY LEVEL (8 keys per worker)
┌──────────────────────────────────────┐
│ Worker 1:                            │
│   Request 1 → Key 1                  │
│   Request 2 → Key 2                  │
│   Request 3 → Key 3                  │
│   ...                                │
│   Request 8 → Key 8                  │
│   Request 9 → Key 1 (cycle back)     │
└──────────────────────────────────────┘
```

---

## ⚡ Performance Characteristics

### Response Times
```
┌──────────────────────────────────────────┐
│ Component         │ Time                 │
├──────────────────────────────────────────┤
│ Express Server    │ < 5ms                │
│ Load Balancer     │ < 10ms               │
│ Worker Processing │ < 50ms               │
│ SiliconFlow API   │ 2000-5000ms          │
│ Response Parsing  │ < 10ms               │
├──────────────────────────────────────────┤
│ TOTAL AVG         │ 2-5 seconds          │
│ TIMEOUT           │ 60 seconds           │
└──────────────────────────────────────────┘
```

### Capacity
```
┌─────────────────────────────────────────────┐
│ Metric                  │ Capacity          │
├─────────────────────────────────────────────┤
│ Concurrent Requests     │ 20 (workers)      │
│ API Key Instances       │ 160 (total)       │
│ Requests per Minute     │ ~200-300          │
│ Requests per Day        │ ~100,000+         │
└─────────────────────────────────────────────┘
```

---

## 🛡️ Reliability Features

### Failover Strategy
```
Request arrives
    ↓
Try Worker 1 ────► Success ──► Return result
    │                             
    │ Fails                        
    ↓                             
Try Worker 2 ────► Success ──► Return result
    │                             
    │ Fails                        
    ↓                             
Try Worker 3 ────► Success ──► Return result
    │                             
    │ Fails                        
    ↓                             
Return Error
(All 3 attempts failed)
```

### Worker Failure Handling
```
Worker fails ──► Mark as DOWN ──► Remove from rotation
                                         │
                                         │ 5 minutes
                                         ▼
                                 Restore to rotation
```

---

## 💾 Data Flow

### Image Processing
```
Client
  │
  │ Uploads images as base64 data URLs
  │
  ▼
Server
  │
  │ Validates format
  │ (data:image/jpeg;base64,...)
  │
  ▼
Load Balancer
  │
  │ Passes data URLs to worker
  │
  ▼
Worker
  │
  │ Forwards to SiliconFlow API
  │ (Images already in base64)
  │
  ▼
SiliconFlow
  │
  │ Processes images
  │ Returns comparison
  │
  ▼
Client
  (Images never stored anywhere)
```

---

## 🎯 Quality Score Mapping

```
Similarity Score
     │
     ├─► 85-100% ──► Excellent Match 🎯 ──► Green (#22c55e)
     │
     ├─► 70-84%  ──► Very Good Match 👍 ──► Lime (#65a30d)
     │
     ├─► 55-69%  ──► Good Match 👌 ──► Light Green (#84cc16)
     │
     ├─► 40-54%  ──► Fair Match 🤔 ──► Yellow (#ca8a04)
     │
     ├─► 25-39%  ──► Poor Match 😐 ──► Orange (#ea580c)
     │
     └─► 0-24%   ──► Very Poor Match 😟 ──► Red (#dc2626)
```

---

## 📊 Monitoring Points

```
┌────────────────────────────────────────────────────┐
│ Monitoring Layer        │ What to Monitor          │
├────────────────────────────────────────────────────┤
│ Client                  │ Response times           │
│                         │ Error rates              │
├────────────────────────────────────────────────────┤
│ Express Server          │ Request count            │
│                         │ Error logs               │
│                         │ /api/status endpoint     │
├────────────────────────────────────────────────────┤
│ Load Balancer           │ Server rotation          │
│                         │ Failover frequency       │
│                         │ Server stats             │
├────────────────────────────────────────────────────┤
│ Workers                 │ wrangler tail logs       │
│                         │ /api/health endpoint     │
│                         │ API key rotation         │
├────────────────────────────────────────────────────┤
│ SiliconFlow API         │ API usage               │
│                         │ Rate limits              │
│                         │ Cost tracking            │
└────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
Development
    │
    │ npm start
    │
    ▼
Local Server (localhost:3000)
    │
    │ ./deploy-workers.sh
    │
    ▼
20 Cloudflare Workers (Global Edge)
    │
    │ Connects to
    │
    ▼
SiliconFlow API (Cloud)
    │
    ▼
Production Ready! 🎉
```

---

This architecture provides:
- ✅ High availability (20 workers)
- ✅ Load distribution (160 API keys)
- ✅ Automatic failover
- ✅ Global edge deployment
- ✅ Cost-effective scaling
- ✅ Simple maintenance
