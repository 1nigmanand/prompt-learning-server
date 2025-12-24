/**
 * API Key Management Routes
 * Handles acquire and release of API keys
 */

import keyManager from '../utils/keyManager.js';

/**
 * POST /api/acquire-key
 * Acquire an available API key (waits if all busy)
 */
export async function handleAcquireKey(request, env) {
  try {
    // Initialize key manager if not already done
    keyManager.initializeKeys(env);

    // Auto-release any expired keys first
    keyManager.autoReleaseExpiredKeys();

    // Try to acquire key with waiting (max 30 seconds)
    const result = await keyManager.acquireKeyWithWait(30000, 1000);

    if (result.success) {
      console.log(`✅ Key #${result.keyId} acquired (waited ${result.waitTime}ms)`);
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.warn('⚠️ All keys busy, request timed out');
      
      return new Response(JSON.stringify(result), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('❌ Error acquiring key:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to acquire API key'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * POST /api/release-key
 * Release an API key back to the pool
 */
export async function handleReleaseKey(request, env) {
  try {
    // Initialize key manager if not already done
    keyManager.initializeKeys(env);

    const body = await request.json();
    const { keyId } = body;

    if (!keyId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'keyId is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = keyManager.releaseKey(keyId);

    if (result.success) {
      console.log(`✅ Key #${keyId} released (held for ${result.duration}ms)`);
      
      return new Response(JSON.stringify({
        success: true,
        keyId: keyId,
        message: 'API key released successfully',
        duration: result.duration
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: result.error
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('❌ Error releasing key:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to release API key'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * GET /api/key-status
 * Get current status of all API keys
 */
export function handleKeyStatus(request, env) {
  try {
    // Initialize key manager if not already done
    keyManager.initializeKeys(env);

    // Auto-release expired keys before showing status
    keyManager.autoReleaseExpiredKeys();

    const status = keyManager.getStatus();

    return new Response(JSON.stringify({
      success: true,
      ...status
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ Error getting key status:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to get key status'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
