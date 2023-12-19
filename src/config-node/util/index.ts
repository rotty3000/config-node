let verbose: boolean = false;

const protectedKeys = [
  'config.node.config.trees',
  'config.node.profiles.active'
];

/**
 * A utility function for providers that implements lazy computation of values when the cache does not contain the specified key.
 *
 * @param cache - the cache against which to lookup and store the value
 * @param key - the key to lookup and store the value under
 * @param fn - the function that will compute the value when no key is found in the cache
 * @returns the cached value (having been computed and added to the cache if absent when requested)
 */
function computeIfAbsent(cache: Map<string, any>, key: string, fn: () => any): any {
  let value = cache.get(key);

  if (!value) {
    try {
      value = fn();
    } catch(e) {
      verbose && console.error(e);
    }

    if (value) {
      cache.set(key, value);
    }
  }

  return value;
}

/**
 * A utility function to enable verbose output from this library, convenient for debugging.
 *
 * @param b - verbose if true, false otherwise
 */
function setVerbose(b : boolean) {
  verbose = b;
}

function unquote(it: any) {
  if (typeof it === "string") {
    if (it.startsWith('"') && it.endsWith('"')) {
      return it.slice(1, -1);
    }
    else if (it.startsWith('\'') && it.endsWith('\'')) {
      return it.slice(1, -1);
    }

    if (it.includes(',')) {
      return it.split(',');
    }
  }
  return it;
}

export {protectedKeys, computeIfAbsent, setVerbose, verbose, unquote};