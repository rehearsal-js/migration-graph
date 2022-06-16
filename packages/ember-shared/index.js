'use strict';

/**
 * Consumers of this lib can turn off memoization during testing by setting an environment
 * variable that has a _TESTING suffix.
 */
const isTesting = () =>
  !!Object.keys(process.env).filter((key) => key.includes('_TESTING')).length;

/**
 * Memoizes a function.
 *
 * If we're in a test environment, then always re-compute the
 * function; otherwise, return the memoized value if it exists
 *
 * @name memoize
 * @param {Function} fn The function to memoize
 * @param {Function} [cacheKeyFn] An optional function to compute
 * the cache key; defaults to `JSON.stringify`
 * @returns {Function} The memoized function
 */
function memoize(fn, cacheKeyFn = (args) => JSON.stringify(args)) {
  const cache = new Map();

  const memoized = (...args) => {
    // don't memoize when testing
    if (isTesting()) {
      return fn(...args);
    }

    const cacheKey = cacheKeyFn(args);

    if (!cache.has(cacheKey)) {
      cache.set(cacheKey, fn(...args));
    }

    return cache.get(cacheKey);
  };

  /**
   * Updates the cache for a given key/value pair
   *
   * @name _setCacheKeyValue
   * @param {*} key The key to use
   * @param {*} value The value to set for the given key
   */
  memoized._setCacheKeyValue = (key, value) => {
    cache.set(key, value);
  };

  /**
   * Gets the cache
   *
   * @name _getCache
   * @returns {Map} The cache
   */
  memoized._getCache = () => cache;

  return memoized;
}

module.exports = { memoize };
