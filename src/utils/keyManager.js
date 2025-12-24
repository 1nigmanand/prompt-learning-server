/**
 * API Key Manager
 * Manages API key pool with acquire/release mechanism
 */

class KeyManager {
  constructor() {
    this.keys = [];
    this.initialized = false;
  }

  /**
   * Initialize key pool from environment variables
   * Manages COMPARISON_API_KEY (SiliconFlow) keys
   */
  initializeKeys(env = process.env) {
    if (this.initialized) return;

    const apiKeys = [
      env.COMPARISON_API_KEY_1,
      env.COMPARISON_API_KEY_2,
      env.COMPARISON_API_KEY_3,
      env.COMPARISON_API_KEY_4,
      env.COMPARISON_API_KEY_5,
      env.COMPARISON_API_KEY_6,
      env.COMPARISON_API_KEY_7,
      env.COMPARISON_API_KEY_8,
      env.COMPARISON_API_KEY_9,
      env.COMPARISON_API_KEY_10
    ].filter(key => key); // Remove undefined keys

    this.keys = apiKeys.map((apiKey, index) => ({
      id: index + 1,
      apiKey: apiKey,
      status: 'available',
      acquiredAt: null,
      lastUsed: null
    }));

    this.initialized = true;
    console.log(`✅ Key Manager initialized with ${this.keys.length} API keys`);
  }

  /**
   * Get an available key immediately or null if all busy
   */
  getAvailableKey() {
    if (!this.initialized) return null;
    
    const availableKey = this.keys.find(k => k.status === 'available');
    return availableKey || null;
  }

  /**
   * Acquire a key (mark as active)
   */
  acquireKey(keyId) {
    const key = this.keys.find(k => k.id === keyId);
    if (!key) return false;

    key.status = 'active';
    key.acquiredAt = Date.now();
    return true;
  }

  /**
   * Release a key (mark as available)
   */
  releaseKey(keyId) {
    const key = this.keys.find(k => k.id === keyId);
    if (!key) return { success: false, error: 'Key not found' };

    const duration = key.acquiredAt ? Date.now() - key.acquiredAt : 0;
    
    key.status = 'available';
    key.lastUsed = Date.now();
    key.acquiredAt = null;

    return { success: true, duration };
  }

  /**
   * Acquire key with polling (wait if all busy)
   */
  async acquireKeyWithWait(maxWaitMs = 30000, pollIntervalMs = 1000) {
    const startTime = Date.now();
    
    while (true) {
      // Check if key available
      const availableKey = this.getAvailableKey();
      
      if (availableKey) {
        this.acquireKey(availableKey.id);
        const waitTime = Date.now() - startTime;
        
        return {
          success: true,
          keyId: availableKey.id,
          apiKey: availableKey.apiKey,
          status: 'active',
          waitTime: waitTime,
          expiresIn: 60000 // Auto-release after 60s
        };
      }

      // Check timeout
      const elapsed = Date.now() - startTime;
      if (elapsed >= maxWaitMs) {
        return {
          success: false,
          error: 'All API keys are currently busy',
          totalKeys: this.keys.length,
          availableKeys: 0,
          retryAfter: 5
        };
      }

      // Wait before next check
      await this.sleep(pollIntervalMs);
    }
  }

  /**
   * Get current status of all keys
   */
  getStatus() {
    const available = this.keys.filter(k => k.status === 'available').length;
    const active = this.keys.filter(k => k.status === 'active').length;

    return {
      total: this.keys.length,
      available: available,
      active: active,
      keys: this.keys.map(k => ({
        id: k.id,
        status: k.status,
        acquiredAt: k.acquiredAt,
        lastUsed: k.lastUsed
      }))
    };
  }

  /**
   * Auto-release keys that have been held for too long (60s)
   */
  autoReleaseExpiredKeys() {
    const now = Date.now();
    const expiryTime = 60000; // 60 seconds

    this.keys.forEach(key => {
      if (key.status === 'active' && key.acquiredAt) {
        const heldTime = now - key.acquiredAt;
        if (heldTime > expiryTime) {
          console.warn(`⚠️ Auto-releasing key #${key.id} (held for ${heldTime}ms)`);
          this.releaseKey(key.id);
        }
      }
    });
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
const keyManager = new KeyManager();

export default keyManager;
