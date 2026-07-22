import NodeCache from "node-cache";

// Initialize cache
const nodeCache = new NodeCache({ stdTTL: 0, checkperiod: 120 });

export const cache = {
  get: (key) => {
    const value = nodeCache.get(key);
    return value !== undefined ? value : null;
  },

  set: (key, value) => {
    nodeCache.set(key, value);
  },

  delete: (key) => {
    nodeCache.del(key); 
  },

  getEfficiency: () => {
    const stats = nodeCache.getStats(); 
    const total = stats.hits + stats.misses;
    const hitRatio = total === 0 ? 0 : ((stats.hits / total) * 100).toFixed(2);

    return {
      totalRequests: total,
      hits: stats.hits,
      misses: stats.misses,
      hitRatio: `${hitRatio}%`
    };
  }
};