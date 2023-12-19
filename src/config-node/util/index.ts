let verbose: boolean = false;

const protectedKeys = [
  'config.node.config.trees',
  'config.node.profiles.active'
];

function computeIfAbsent(cache: Map<string, any>, key: string, fn: () => any): any {
  let value = cache.get(key);

  if (!value) {
    try {
      value = fn();
    } catch(e) {
      verbose && console.error(e);
    }

    if (value) {
      verbose && console.info(`computed value of '${key}' as '${value}'`);
      cache.set(key, value);
    }
  }

  return value;
}

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

export {protectedKeys, computeIfAbsent, setVerbose, unquote};