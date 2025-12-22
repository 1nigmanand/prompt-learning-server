#!/bin/bash

# Script to add comparison API keys to all 20 Cloudflare Workers
# Run this after setting up the workers with image generation keys

echo "🔐 Setting up Comparison API Keys for all workers..."
echo ""

# Comparison API Keys
COMPARISON_KEYS=(
  "sk-dufgdzyrgxejceexpkrwfaptkscwtrempqswknucrwzrvlhp"
  "sk-klbnhgeqyyhlghumziqrhggnpizegebymadfqedpildqcbxu"
  "sk-rrqdmurjhasrkogyhwxnxitlliqleoevxfyylinwbemricov"
  "sk-blyrbdmfzwptwzfnlzwuxugytwuhwdpyjfhxtbxtvjcdnolh"
  "sk-cdkifaucvczuoonqfzlpmzjodtwyxqakmhxsjshyijdstzne"
  "sk-sruzwusfqszwtnjrwllfcvnyuwpspfvxysqxddgtkjforkjc"
  "sk-eqwhslctinxenodizmiapcnmrvgroadfhxvmirknrjcflkwv"
  "sk-uopxmmrqiomcecvtcroopxasggnvxmgkqlnnbcuedlnegknq"
)

# Worker names
WORKERS=(
  "prompt-server-1"
  "prompt-server-2"
  "prompt-server-3"
  "prompt-server-4"
  "prompt-server-5"
  "prompt-server-6"
  "prompt-server-7"
  "prompt-server-8"
  "prompt-server-9"
  "prompt-server-10"
  "prompt-server-11"
  "prompt-server-12"
  "prompt-server-13"
  "prompt-server-14"
  "prompt-server-15"
  "prompt-server-16"
  "prompt-server-17"
  "prompt-server-18"
  "prompt-server-19"
  "prompt-server-20"
)

# Function to add secrets to a worker
add_comparison_secrets_to_worker() {
  local worker_name=$1
  echo "📦 Adding comparison keys to $worker_name..."
  
  # Add all 8 comparison API keys
  for i in {0..7}; do
    local key_num=$((i + 1))
    local key_value="${COMPARISON_KEYS[$i]}"
    
    echo "  ➕ Adding COMPARISON_API_KEY_$key_num"
    echo "$key_value" | npx wrangler secret put "COMPARISON_API_KEY_$key_num" --name "$worker_name" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
      echo "  ✅ COMPARISON_API_KEY_$key_num added successfully"
    else
      echo "  ❌ Failed to add COMPARISON_API_KEY_$key_num"
    fi
  done
  
  echo "  ✨ Completed $worker_name"
  echo ""
}

# Main execution
echo "Starting to add comparison secrets to all workers..."
echo "This will add 8 comparison API keys to each of the 20 workers"
echo "Total operations: 160 secrets"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Loop through all workers and add secrets
for worker in "${WORKERS[@]}"; do
  add_comparison_secrets_to_worker "$worker"
  sleep 1  # Small delay to avoid rate limiting
done

echo "🎉 All comparison secrets have been added!"
echo ""
echo "Summary:"
echo "  • Workers configured: ${#WORKERS[@]}"
echo "  • Keys per worker: ${#COMPARISON_KEYS[@]}"
echo "  • Total secrets added: $((${#WORKERS[@]} * ${#COMPARISON_KEYS[@]}))"
echo ""
echo "✅ Your workers are now ready for image comparison!"
echo ""
echo "Test with:"
echo "  curl -X POST https://prompt-server-1.prompt-tool.workers.dev/api/compare-images \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"targetImage\":\"data:image/...\",\"generatedImage\":\"data:image/...\"}'"
