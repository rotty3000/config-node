import path from 'path';
import fs from 'fs';

let verbose: boolean = false;

const protectedKeys = [
  'config.node.config.trees',
  'config.node.profiles.active'
];

function findProjectRoot(currentPath = process.cwd()) {
  const hasPackageJson = fs.existsSync(path.join(currentPath, 'package.json'));

  if (hasPackageJson) {
    return currentPath;
  }

  if (currentPath === path.resolve('/')) {
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

function readJSONFile(path: string): string {
  if (fs.existsSync(path)) {
    const contents = fs.readFileSync(path, 'utf8');
    try {
      return JSON.parse(contents);
    }
    catch (error) {
      console.error('[config-node]', 'contents', contents, error);
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

export {computeIfAbsent, getProjectRoot, protectedKeys, readJSONFile, setVerbose, verbose, unquote};
