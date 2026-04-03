/**
 * @module cache
 * @description Simple in-memory cache with TTL for auth middleware user data
 */

const CACHE_TTL_SECONDS = 300;

class Cache {
  constructor() {
    this.store = new Map();
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