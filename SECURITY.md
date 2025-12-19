# Security & Deployment Guide

## ✅ API Key Security

Your API key is now secured using environment variables.

### For Local Development:

1. The API key is stored in `.env` file (already created)
2. `.env` is in `.gitignore` - it won't be committed to git
3. The server automatically loads from `.env`

### For Cloudflare Workers Deployment:

To securely add your API key to Cloudflare Workers, run:

```bash
wrangler secret put IMAGE_ROUTER_API_KEY
```

When prompted, paste your API key:
```
587c228c70fc84c3c1dcab2d9836a209781bfd01f8f4c3a4f6226ce9ec8e46b2
```

This needs to be done for each worker environment:

```bash
# Main worker
wrangler secret put IMAGE_ROUTER_API_KEY --env main

# For each of the 20 workers
wrangler secret put IMAGE_ROUTER_API_KEY --env server1
wrangler secret put IMAGE_ROUTER_API_KEY --env server2
# ... and so on for server3 to server20
```

Or use this quick script to set all at once:

```bash
# Set secret for main worker
echo "587c228c70fc84c3c1dcab2d9836a209781bfd01f8f4c3a4f6226ce9ec8e46b2" | wrangler secret put IMAGE_ROUTER_API_KEY --env main

# Set for all 20 workers
for i in {1..20}; do
  echo "587c228c70fc84c3c1dcab2d9836a209781bfd01f8f4c3a4f6226ce9ec8e46b2" | wrangler secret put IMAGE_ROUTER_API_KEY --env server$i
done
```

## Files Changed:

✅ `.env` - Contains your API key (gitignored)
✅ `.env.example` - Template for others (safe to commit)
✅ `imageGenerator.js` - Reads from environment
✅ `server.js` - Loads dotenv
✅ `wrangler.toml` - Updated for workers

## Never Commit:

❌ `.env` file
❌ API keys in code
❌ Secrets or credentials

## Safe to Commit:

✅ `.env.example`
✅ Code that reads from environment variables
✅ Configuration files
