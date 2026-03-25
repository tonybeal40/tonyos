const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

export function getCached(domain) {
  const key = cleanKey(domain);
  const entry = cache.get(key);
  
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

export function setCache(domain, data) {
  const key = cleanKey(domain);
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

export function clearCache(domain) {
  if (domain) {
    cache.delete(cleanKey(domain));
  } else {
    cache.clear();
  }
}

export function getCacheStats() {
  return {
    size: cache.size,
    domains: Array.from(cache.keys())
  };
}

function cleanKey(domain) {
  return domain.toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0];
}
