import LRUCache from 'lru-cache';

const mediaCache = new LRUCache<string, Map<number, string>>({ max: 1000 });

export const queryMediaCache = (
  source: string,
  width: number,
): { inCache: boolean; uri?: string; alternateURI?: string } => {
  const sourceCache = mediaCache.get(source);
  if (!sourceCache) {
    return { inCache: false };
  }
  const uri = sourceCache.get(width);
  if (uri) {
    return { inCache: true, uri };
  }
  const mapEntry = Array.from(sourceCache.entries()).reduce(
    (currentEntry, entry) => {
      if (Math.abs(currentEntry[0] - width) < Math.abs(entry[0] - width)) {
        return entry;
      }
      return currentEntry;
    },
  );
  return {
    inCache: false,
    alternateURI: mapEntry[1],
  };
};

export const addMediaCacheEntry = (
  source: string,
  width: number,
  uri: string,
) => {
  let sourceCache = mediaCache.get(source);
  if (!sourceCache) {
    sourceCache = new Map();
    mediaCache.set(source, sourceCache);
  }
  sourceCache.set(width, uri);
};
