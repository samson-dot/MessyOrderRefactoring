
const store = new Map();          // key → { value, expiresAt }
let hits = 0;                     // how many gets found a valid value
let misses = 0;                   // how many gets found nothing (or expired)

const TTL_MS = 10 * 1000;         // entries live 10s (matches old stdTTL:10)

export const cache = {
  get: (key) => {
    const entry = store.get(key);

    if (!entry) {                 // never stored
      misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {   // stored, but expired
      store.delete(key);
      misses++;
      return null;
    }

    hits++;                       // found and still fresh
    return entry.value;
  },

  set: (key, value) => {
    store.set(key, {
      value,
      expiresAt: Date.now() + TTL_MS,     // stamp when it should die
    });
  },

  delete: (key) => {
    store.delete(key);
  },

  getEfficiency: () => {
    const total = hits + misses;
    const hitRatio = total === 0 ? 0 : ((hits / total) * 100).toFixed(2);
    return {
      totalRequests: total,
      hits,
      misses,
      hitRatio: `${hitRatio}%`,
    };
  },
};