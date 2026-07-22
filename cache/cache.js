// A simple Map to store our data in memory
const store = new Map();

// Objects to keep track of counts for your assignment
export const stats = {
  hits: 0,
  misses: 0
};

export const cache = {
  // Get data from cache
  get: (key) => {
    if (store.has(key)) {
      stats.hits++;
      return store.get(key); // Found it!
    }
    stats.misses++;
    return null; // Not in cache
  },

  // Save data to cache
  set: (key, value) => {
    store.set(key, value);
  },

  // Delete data from cache (when order changes)
  delete: (key) => {
    store.delete(key);
  },

  getEfficiency: () => {
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

