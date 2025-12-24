#!/bin/bash

# Script to deploy Cloudflare Workers with API key secrets
# This sets up API keys for all workers securely

echo "🔐 Setting up API keys for Cloudflare Workers..."
echo ""

# API Keys
API_KEY_1="04c618b52982756a8e52273bb23880a17d7da4d2c0ae0527f9a7ed7920c94194"
API_KEY_2="3a3d680ebf7097852d13c7b3ac1b7995630d8ff574f3d33c4881ecfda38ba5ba"
API_KEY_3="251611046236284b838d214efd71aaba8558dc578c615e6d90473c9e8111a4bf"
API_KEY_4="856c7a5f584bc26ebf62e6691d3358695daf02207415fa32cf15e95004ca7739"
API_KEY_5="08b92480055ebcede4cd20d8f62e57099b982c1e990df46d1d9b7775a0d2b69d"
API_KEY_6="d29ad7892ebb97ece95adf0d7a314e9d1ade49d03cd794601c46a399b22da2a6"
API_KEY_7="4ef519663eb8b1c625030b01bd188701bb60a276111127f0afdf00672dfff9dd"

# Function to set secrets for an environment
set_secrets_for_env() {
    local env=$1
    echo "📦 Setting secrets for $env..."
    
    echo "$API_KEY_1" | wrangler secret put IMAGE_ROUTER_API_KEY_1 --env $env
    echo "$API_KEY_2" | wrangler secret put IMAGE_ROUTER_API_KEY_2 --env $env
    echo "$API_KEY_3" | wrangler secret put IMAGE_ROUTER_API_KEY_3 --env $env
    echo "$API_KEY_4" | wrangler secret put IMAGE_ROUTER_API_KEY_4 --env $env
    echo "$API_KEY_5" | wrangler secret put IMAGE_ROUTER_API_KEY_5 --env $env
    echo "$API_KEY_6" | wrangler secret put IMAGE_ROUTER_API_KEY_6 --env $env
    echo "$API_KEY_7" | wrangler secret put IMAGE_ROUTER_API_KEY_7 --env $env
    
    echo "✅ Secrets set for $env"
    echo ""
}

# Set secrets for main worker
echo "🚀 Setting up Main Worker..."
set_secrets_for_env "main"

# Set secrets for all 20 workers
for i in {1..20}; do
    echo "🔧 Setting up Worker Server $i..."
    set_secrets_for_env "server$i"
done

echo "✅ All API keys configured successfully!"
echo ""
echo "🚀 Now you can deploy all workers:"
echo "   npm run worker:deploy:all"
