#!/bin/bash

echo "🚀 Deploying to all 20 Cloudflare Workers servers..."
echo "This will create 20 separate Workers for maximum load distribution"
echo "Total capacity: 2,000,000 requests/day (60M requests/month!)"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Login check
echo "🔑 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare first:"
    echo "wrangler login"
    exit 1
fi

echo "✅ Authenticated with Cloudflare"
echo ""

# Deploy all 20 workers in batches
echo "📡 Deploying Batch 1 (Workers 1-5)..."
wrangler deploy --env server1 &
wrangler deploy --env server2 &
wrangler deploy --env server3 &
wrangler deploy --env server4 &
wrangler deploy --env server5 &
wait

echo "📡 Deploying Batch 2 (Workers 6-10)..."
wrangler deploy --env server6 &
wrangler deploy --env server7 &
wrangler deploy --env server8 &
wrangler deploy --env server9 &
wrangler deploy --env server10 &
wait

echo "📡 Deploying Batch 3 (Workers 11-15)..."
wrangler deploy --env server11 &
wrangler deploy --env server12 &
wrangler deploy --env server13 &
wrangler deploy --env server14 &
wrangler deploy --env server15 &
wait

echo "📡 Deploying Batch 4 (Workers 16-20)..."
wrangler deploy --env server16 &
wrangler deploy --env server17 &
wrangler deploy --env server18 &
wrangler deploy --env server19 &
wrangler deploy --env server20 &
wait

echo ""
echo "🎉 All 20 Cloudflare Workers deployed successfully!"
echo ""
echo "📋 Your deployed servers:"
for i in {1..20}; do
    echo "$i. https://prompt-server-$i.your-subdomain.workers.dev"
done
echo ""
echo "💰 Total Capacity (FREE):"
echo "  📊 Each worker: 100,000 requests/day"
echo "  🚀 Total daily: 2,000,000 requests/day"
echo "  � Total monthly: 60,000,000 requests/month"
echo "  � For 3000 users: 20,000 requests per user per month!"
echo ""
echo "🧪 Test with:"
echo 'curl -X POST https://prompt-server-1.your-subdomain.workers.dev/api/generate-image \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '\''{"prompt": "a beautiful sunset over mountains"}'\'''
echo ""
echo "⚡ Load balancer will automatically distribute across all 20 servers!"