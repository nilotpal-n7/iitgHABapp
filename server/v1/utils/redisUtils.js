/**
 * Safely deletes all Redis keys matching a specific pattern using SCAN.
 * @param {string} pattern - The wildcard pattern to match (e.g., 'hostel_by_id_123*')
 */
const clearCacheByPattern = async (pattern) => {
  try {
    if (!redis.isReady) return;
    
    let cursor = 0;
    do {
      // Scan in batches of 100 to prevent blocking the Redis event loop
      const result = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = result.cursor;
      const keys = result.keys;
      
      if (keys.length > 0) {
        // Delete the batch of matched keys
        await redis.del(keys);
      }
    } while (cursor !== 0);
    
  } catch (err) {
    console.error(`Failed to clear cache for pattern ${pattern}:`, err);
  }
};

module.exports = {
  clearCacheByPattern,
};