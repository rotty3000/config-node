import path from 'path';
import fs from 'fs';

let verbose: boolean = false;

const protectedKeys = [
  'config.node.config.trees',
  'config.node.profiles.active',
  'config.node.config.verbose'
];

const sensitiveKeyPattern = /(secret|password|passwd|token|credential|api[-_.]?key|private[-_.]?key)/i;

function findProjectRoot(currentPath = process.cwd()) {
  const hasPackageJson = fs.existsSync(path.join(currentPath, 'package.json'));

  if (hasPackageJson) {
    return currentPath;
  }

  // a path is its own parent only at the filesystem root, which keeps this terminating on Windows too
  if (path.dirname(currentPath) === currentPath) {
    return null;
  }

  return findProjectRoot(path.dirname(currentPath));
}
/**
 * A utility function to get the root folder of the parent project, use this function to get the application.json file
 * when it's packaged in the client extension files.
 * */
function getProjectRoot() {
  const currentWorkingDirectory = process.cwd();
  const projectRoot = findProjectRoot(currentWorkingDirectory);

  return projectRoot;
}

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
    } catch (e) {
      verbose && console.error('[config-node]', e);
    }

    if (value) {
      cache.set(key, value);
    }
  }

  return value;
}

/**
 * A lookup key is turned into a file system path by the config-tree and profile providers, so it has to be
 * treated as a path segment rather than as free text: anything that could escape the directory it is joined
 * to (`..`, separators, a leading dot) is rejected.
 */
function isSafePathSegment(value: string): boolean {
  return typeof value === 'string' &&
    value.length > 0 &&
    !value.includes('/') &&
    !value.includes('\\') &&
    !value.includes('\0') &&
    !value.includes('..') &&
    !value.startsWith('.');
}

/**
 * Resolve `name` against `root`, refusing anything that is unsafe as a path segment or that resolves (after
 * following symlinks) to a location outside of `root`. Volume mounted ConfigMaps/Secrets are built out of
 * symlinks into a `..data` directory inside the tree, so containment is checked on the resolved path rather
 * than by refusing links outright.
 */
function resolveContainedFile(root: string, name: string): string | undefined {
  if (!root || !isSafePathSegment(name)) {
    return undefined;
  }

  const candidate = path.join(root, name);

  if (!fs.existsSync(candidate)) {
    return undefined;
  }

  try {
    const realRoot = fs.realpathSync(root);
    const realCandidate = fs.realpathSync(candidate);

    if (realCandidate !== realRoot && !realCandidate.startsWith(realRoot + path.sep)) {
      return undefined;
    }

    return realCandidate;
  }
  catch (e) {
    // the candidate exists but could not be resolved (a mocked fs, or a race with a deleted entry): the key
    // itself has already been validated as a single path segment, and the read that follows will fail on its
    // own if the path is really gone
    return candidate;
  }
}

/**
 * Strip the trailing newline that volume mounted ConfigMap/Secret files always carry.
 */
function trimFileValue(value: string): string {
  return value.replace(/[\r\n]+$/, '');
}

/**
 * The value of a sensitive key must never reach a log line, not even in verbose mode.
 */
function redactValue(key: string, value: any): any {
  return sensitiveKeyPattern.test(key) ? '[redacted]' : value;
}

/**
 * Read a key from a parsed JSON object without falling through to the prototype chain, so that keys like
 * `__proto__` or `constructor` resolve to nothing instead of returning an object that no file ever declared.
 */
function readKey(json: Record<string, any>, key: string): any {
  return json && Object.prototype.hasOwnProperty.call(json, key) ? json[key] : undefined;
}

function readJSONFile(filePath: string): Record<string, any> | undefined {
  if (fs.existsSync(filePath)) {
    const contents = fs.readFileSync(filePath, 'utf8');
    try {
      return JSON.parse(contents);
    }
    catch (error) {
      // never log the contents: a truncated or hand-edited config file is exactly where secrets live
      console.error('[config-node]', 'could not parse', filePath, ':', (error as Error).message);
    }
  }
  return undefined;
}

/**
 * A utility function to enable verbose output from this library, convenient for debugging.
 *
 * @param b - verbose if true, false otherwise
 */
function setVerbose(b: boolean) {
  verbose = b;
}

function unquote(it: any) {
  if (typeof it === "boolean" || typeof it === "number") {
    // a JSON file is allowed to express false/0; providers use a falsy return for "no value", so a legitimate
    // scalar has to travel as a string
    return String(it);
  }

  if (typeof it === "string") {
    if (it.startsWith('"') && it.endsWith('"')) {
      return it.slice(1, -1);
    }
    else if (it.startsWith('\'') && it.endsWith('\'')) {
      return it.slice(1, -1);
    }
  }
  return it;
}

/**
 * A comma delimited list is how the flat text sources express a list (an environment variable, or a file in a
 * volume mounted ConfigMap); JSON sources can express an array for real, so they are not split this way.
 */
function commaSeparated(it: any) {
  if (typeof it === 'string' && it.includes(',')) {
    return it.split(',');
  }
  return it;
}

export {
  commaSeparated, computeIfAbsent, findProjectRoot, getProjectRoot, isSafePathSegment, protectedKeys,
  readJSONFile, readKey, redactValue, resolveContainedFile, setVerbose, trimFileValue, unquote, verbose
};
