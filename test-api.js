#!/usr/bin/env node

/**
 * Comprehensive API Test Suite
 * Tests both local Express server and Cloudflare Worker functionality
 */

import fetch from 'node-fetch';

// Test configurations
const TEST_CONFIGS = {
  local: {
    baseUrl: 'http://localhost:3000',
    name: 'Local Express Server'
  },
  // Add your Cloudflare Worker URL when deployed
  worker: {
    baseUrl: 'https://prompt-main-server.prompt-tool.workers.dev',
    name: 'Cloudflare Worker (Main Load Balancer)'
  }
};

// Test prompts
const TEST_PROMPTS = [
  'a grey square',
  'a beautiful sunset over mountains',
  'a cozy coffee shop in winter',
  'a futuristic cityscape at night'
];

class APITester {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.name = config.name;
    this.results = [];
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${this.name}: ${message}`);
  }

  async testEndpoint(method, path, body = null, expectedStatus = 200) {
    const url = `${this.baseUrl}${path}`;
    const startTime = Date.now();
    
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'API-Tester/1.0'
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      await this.log(`Testing ${method} ${path}${body ? ` with body: ${JSON.stringify(body)}` : ''}`);
      
      const response = await fetch(url, options);
      const responseTime = Date.now() - startTime;
      const responseText = await response.text();
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { rawResponse: responseText };
      }

      const result = {
        method,
        path,
        body,
        status: response.status,
        expectedStatus,
        success: response.status === expectedStatus,
        responseTime: `${responseTime}ms`,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries())
      };

      this.results.push(result);

      if (result.success) {
        await this.log(`✓ ${method} ${path} - ${response.status} (${responseTime}ms)`, 'success');
        
        // Log specific details for image generation
        if (path === '/api/generate-image' && responseData.imageUrl) {
          await this.log(`  Generated image: ${responseData.imageUrl}`);
          await this.log(`  Server used: ${responseData.serverUsed || 'unknown'}`);
          if (responseData.fallback) {
            await this.log(`  ⚠️ Used fallback mechanism`, 'info');
          }
        }
      } else {
        await this.log(`✗ ${method} ${path} - Expected ${expectedStatus}, got ${response.status} (${responseTime}ms)`, 'error');
        await this.log(`  Response: ${JSON.stringify(responseData, null, 2)}`);
      }

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result = {
        method,
        path,
        body,
        status: 'ERROR',
        expectedStatus,
        success: false,
        responseTime: `${responseTime}ms`,
        error: error.message,
        data: null
      };

      this.results.push(result);
      await this.log(`✗ ${method} ${path} - Network Error: ${error.message} (${responseTime}ms)`, 'error');
      return result;
    }
  }

  async runBasicTests() {
    await this.log(`Starting basic endpoint tests...`);

    // Test root endpoint
    await this.testEndpoint('GET', '/');

    // Test health endpoint
    await this.testEndpoint('GET', '/api/health');

    // Test status endpoint
    await this.testEndpoint('GET', '/api/status');

    // Test 404 handling
    await this.testEndpoint('GET', '/api/nonexistent', null, 404);

    // Test CORS preflight
    await this.testEndpoint('OPTIONS', '/api/generate-image');
  }

  async runImageGenerationTests() {
    await this.log(`Starting image generation tests...`);

    for (const prompt of TEST_PROMPTS) {
      await this.testEndpoint('POST', '/api/generate-image', { prompt });
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test validation errors
    await this.testEndpoint('POST', '/api/generate-image', {}, 400); // Missing prompt
    await this.testEndpoint('POST', '/api/generate-image', { prompt: '' }, 400); // Empty prompt
    await this.testEndpoint('POST', '/api/generate-image', { prompt: 123 }, 400); // Invalid type
    await this.testEndpoint('POST', '/api/generate-image', { prompt: 'a'.repeat(1001) }, 400); // Too long
  }

  async runPerformanceTests() {
    await this.log(`Starting performance tests...`);

    const concurrentRequests = 3;
    const testPrompt = 'a simple test image';

    const promises = Array(concurrentRequests).fill().map(async (_, index) => {
      await new Promise(resolve => setTimeout(resolve, index * 100)); // Stagger requests
      return this.testEndpoint('POST', '/api/generate-image', { prompt: `${testPrompt} ${index + 1}` });
    });

    await Promise.all(promises);
  }

  async testImageURLValidity() {
    await this.log(`Testing generated image URL validity...`);

    const imageGenResults = this.results.filter(r => 
      r.path === '/api/generate-image' && 
      r.success && 
      r.data && 
      r.data.imageUrl
    );

    for (const result of imageGenResults.slice(0, 3)) { // Test first 3 URLs
      try {
        const imageUrl = result.data.imageUrl;
        await this.log(`Testing image URL: ${imageUrl}`);
        
        const response = await fetch(imageUrl, { method: 'HEAD', timeout: 10000 });
        const contentType = response.headers.get('content-type');
        
        if (response.ok && contentType && contentType.startsWith('image/')) {
          await this.log(`✓ Image URL valid - ${contentType}`, 'success');
        } else {
          await this.log(`✗ Image URL invalid - Status: ${response.status}, Content-Type: ${contentType}`, 'error');
        }
      } catch (error) {
        await this.log(`✗ Image URL test failed: ${error.message}`, 'error');
      }
    }
  }

  generateReport() {
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    const successRate = totalTests > 0 ? ((successfulTests / totalTests) * 100).toFixed(1) : 0;

    const avgResponseTime = this.results
      .filter(r => r.responseTime && !isNaN(parseInt(r.responseTime)))
      .reduce((sum, r, _, arr) => {
        const time = parseInt(r.responseTime);
        return sum + time / arr.length;
      }, 0);

    return {
      service: this.name,
      totalTests,
      successfulTests,
      failedTests,
      successRate: `${successRate}%`,
      avgResponseTime: `${Math.round(avgResponseTime)}ms`,
      results: this.results
    };
  }
}

// Helper function to check if server is running
async function checkServerHealth(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/health`, { timeout: 5000 });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 API Test Suite Starting...\n');

  const reports = [];

  for (const [key, config] of Object.entries(TEST_CONFIGS)) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${config.name}`);
    console.log(`URL: ${config.baseUrl}`);
    console.log(`${'='.repeat(60)}\n`);

    // Check if server is available
    const isHealthy = await checkServerHealth(config.baseUrl);
    if (!isHealthy) {
      console.log(`❌ Server not available at ${config.baseUrl}`);
      console.log(`   Skipping tests for ${config.name}\n`);
      continue;
    }

    const tester = new APITester(config);

    try {
      // Run all test suites
      await tester.runBasicTests();
      await tester.runImageGenerationTests();
      await tester.runPerformanceTests();
      await tester.testImageURLValidity();

      const report = tester.generateReport();
      reports.push(report);

    } catch (error) {
      console.log(`❌ Test suite failed for ${config.name}: ${error.message}`);
    }
  }

  // Generate final report
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 FINAL TEST REPORT');
  console.log(`${'='.repeat(60)}\n`);

  if (reports.length === 0) {
    console.log('❌ No servers were available for testing');
    process.exit(1);
  }

  reports.forEach(report => {
    console.log(`${report.service}:`);
    console.log(`  Total Tests: ${report.totalTests}`);
    console.log(`  Success Rate: ${report.successRate}`);
    console.log(`  Avg Response Time: ${report.avgResponseTime}`);
    
    if (report.failedTests > 0) {
      console.log(`  ❌ Failed Tests: ${report.failedTests}`);
      const failures = report.results.filter(r => !r.success);
      failures.forEach(failure => {
        console.log(`    - ${failure.method} ${failure.path}: ${failure.status} ${failure.error || ''}`);
      });
    }
    console.log('');
  });

  // Overall assessment
  const overallSuccess = reports.every(r => parseFloat(r.successRate) >= 80);
  console.log(`Overall Assessment: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
  
  if (overallSuccess) {
    console.log('🎉 API is ready for deployment!');
  } else {
    console.log('⚠️ Issues detected, review failed tests before deployment');
  }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { APITester, runTests };