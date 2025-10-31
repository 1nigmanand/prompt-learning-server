#!/usr/bin/env node

/**
 * Final Deployment Verification
 * Quick test to verify the fix is working in production
 */

async function quickTest() {
  // Import fetch for Node.js
  const { default: fetch } = await import('node-fetch');
  
  console.log('🔍 Quick Deployment Verification');
  console.log('Testing the original failing case...\n');
  
  const url = 'https://prompt-main-server.prompt-tool.workers.dev/api/generate-image';
  const payload = { prompt: 'a grey square' };
  
  console.log(`POST ${url}`);
  console.log(`Body: ${JSON.stringify(payload)}\n`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response Time: ${responseTime}ms`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok && data.success && data.imageUrl) {
      console.log('\n✅ SUCCESS! The fix is working.');
      console.log(`🖼️  Image URL: ${data.imageUrl}`);
      
      if (data.fallback) {
        console.log('⚠️  Used fallback mechanism (as expected when workers are down)');
      } else {
        console.log('✨ Normal worker response (workers are healthy)');
      }
      
      console.log('\n🎉 Ready for production use!');
      return true;
    } else {
      console.log('\n❌ FAILED! The issue is not fixed.');
      console.log('Review the deployment and try again.');
      return false;
    }
    
  } catch (error) {
    console.log('\n❌ NETWORK ERROR!');
    console.log(`Error: ${error.message}`);
    console.log('Check the worker deployment status.');
    return false;
  }
}

// Run the test
quickTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });