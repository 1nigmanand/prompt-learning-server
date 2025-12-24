/**
 * API Test Suite
 * Tests all endpoints of the image generation API
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

console.log(`🧪 Testing API at: ${BASE_URL}\n`);

// Test 1: Health Check
async function testHealth() {
  console.log('1️⃣ Testing Health Endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    console.log('   ✅ Health check passed:', data.status);
    return true;
  } catch (error) {
    console.error('   ❌ Health check failed:', error.message);
    return false;
  }
}

// Test 2: Status Check
async function testStatus() {
  console.log('\n2️⃣ Testing Status Endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/status`);
    const data = await response.json();
    console.log('   ✅ Status check passed:', data.service);
    return true;
  } catch (error) {
    console.error('   ❌ Status check failed:', error.message);
    return false;
  }
}

// Test 3: Generate Image
async function testGenerateImage() {
  console.log('\n3️⃣ Testing Image Generation...');
  try {
    const response = await fetch(`${BASE_URL}/api/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'a cute cat' })
    });
    const data = await response.json();
    if (data.success && data.imageUrl) {
      console.log('   ✅ Image generated:', data.imageUrl.substring(0, 50) + '...');
      return true;
    } else {
      console.error('   ❌ Image generation failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('   ❌ Image generation error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('=' .repeat(50));
  console.log('🧪 API TEST SUITE');
  console.log('=' .repeat(50) + '\n');

  const results = [];
  results.push(await testHealth());
  results.push(await testStatus());
  results.push(await testGenerateImage());

  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST RESULTS');
  console.log('=' .repeat(50));
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed!');
    process.exit(1);
  }
}

runTests();
