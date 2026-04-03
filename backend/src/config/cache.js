/**
 * @module cache
 * @description Simple in-memory cache with TTL for auth middleware user data
 */

const CACHE_TTL_SECONDS = 300;

class Cache {
  constructor(cleanupIntervalMs = 60000) {
    this.store = new Map();
    this.cleanupIntervalMs = cleanupIntervalMs;
    this.cleanupInterval = null;
    this.startCleanupInterval();
  }

  startCleanupInterval() {
    if (this.cleanupInterval) {
      return;
    }
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.store.entries()) {
        if (now > item.expiry) {
          this.store.delete(key);
        }
      }
    }, this.cleanupIntervalMs).unref();
  }

  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }

  set(key, value, ttlSeconds = CACHE_TTL_SECONDS) {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

const userCache = new Cache();

const invalidateUserCache = (userId) => {
  userCache.delete(`user:${userId}`);
};

module.exports = { userCache, invalidateUserCache, CACHE_TTL_SECONDS };