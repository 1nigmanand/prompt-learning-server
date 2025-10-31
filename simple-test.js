#!/usr/bin/env node

/**
 * Simple Image Generation Test
 * Tests the specific "a grey square" prompt that was failing
 */

async function testImageGeneration(baseUrl, serviceName) {
  console.log(`\n🧪 Testing ${serviceName}`);
  console.log(`URL: ${baseUrl}`);
  console.log('='.repeat(50));

  const testCases = [
    { prompt: "a grey square", description: "Original failing prompt" },
    { prompt: "a beautiful sunset", description: "Simple working prompt" },
    { prompt: "", description: "Empty prompt (should fail)" }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n📝 Testing: ${testCase.description}`);
      console.log(`Prompt: "${testCase.prompt}"`);
      
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/api/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: testCase.prompt })
      });
      
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      console.log(`Status: ${response.status} (${responseTime}ms)`);
      
      if (response.ok) {
        console.log(`✅ SUCCESS`);
        console.log(`Image URL: ${data.imageUrl}`);
        if (data.serverUsed) {
          console.log(`Server: ${data.serverUsed}`);
        }
        if (data.fallback) {
          console.log(`⚠️ Used fallback mechanism`);
        }
      } else {
        console.log(`❌ FAILED`);
        console.log(`Error: ${data.error || 'Unknown error'}`);
        if (data.details) {
          console.log(`Details: ${data.details}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ NETWORK ERROR: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Simple Image Generation Test Suite');
  
  // Import fetch for Node.js
  const { default: fetch } = await import('node-fetch');
  global.fetch = fetch;
  
  // Test local server
  try {
    const healthResponse = await fetch('http://localhost:3000/api/health');
    if (healthResponse.ok) {
      await testImageGeneration('http://localhost:3000', 'Local Express Server');
    } else {
      console.log('❌ Local server not available');
    }
  } catch (error) {
    console.log('❌ Local server not available');
  }
  
  // Test Cloudflare Worker
  await testImageGeneration('https://prompt-main-server.prompt-tool.workers.dev', 'Cloudflare Worker');
  
  console.log('\n🎯 Test Summary:');
  console.log('- Local server tests Express.js implementation');
  console.log('- Worker tests load balancer with fallback mechanism');
  console.log('- Both should handle "a grey square" successfully now');
}

main().catch(console.error);