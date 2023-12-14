import path from 'node:path';
import fs from 'fs';
import os from 'os';

export interface ConfigProvider {
  readonly priority: number,
  readonly description: string,
  readonly get: (cache: Map<string, any>, k: string) => any,
  readonly cacheInvalid: () => boolean,
}

class ConfigProviderHolder {
  readonly priority: number;
  readonly provider: ConfigProvider;
  readonly cache: Map<string, any>;

  constructor(provider: ConfigProvider) {
    this.provider = provider;
    this.priority = this.provider.priority
    this.cache = new Map<string, any>;
  }
}

const configProviders: ConfigProviderHolder[] = [];
const commonCache = new Map<string, any>();

export function addProvider(provider: ConfigProvider) {
  configProviders.push(new ConfigProviderHolder(provider));
  configProviders.sort(compareProviders);
}

addProvider({
  description: "From ~/.config-node-devtools.json",
  priority: 1000,
  get: (cache, key) => computeIfAbsent(cache, key, () => {
    const homedir = computeIfAbsent(commonCache, 'homedir', () => os.homedir());
    const json = computeIfAbsent(commonCache, `${homedir}/.config-node-devtools.json`, () => JSON.parse(fs.readFileSync(path.join(homedir, '.config-node-devtools.json'), 'utf8')));
    if (json) {
      return unquote(json[key]);
    }
  }),
  cacheInvalid() {
    return false;
  },
});
addProvider({
  description: "From command line arguments (following name mangling rules)",
  priority: 900,
  get: (cache, key) => computeIfAbsent(cache, `process.args.${key}`, () => {
    let modifiedKey = key.replace(/\./gi, '_');
    modifiedKey = modifiedKey.replace(/-/gi, '');
    modifiedKey = modifiedKey.toUpperCase();
    const prefix = `--${modifiedKey}=`
    for (var arg of process.argv) {
      if (arg.startsWith(prefix)) {
        const value = arg.substring(prefix.length);
        return unquote(value);
      }
    }
    return undefined;
  }),
  cacheInvalid() {
    return false;
  },
});
addProvider({
  description: "Properties from APPLICATION_JSON (inline JSON embedded in an environment variable)",
  priority: 800,
  get: (cache, key) => computeIfAbsent(cache, key, () => {
    const json = computeIfAbsent(cache, `process.env.APPLICATION_JSON`, () => JSON.parse(process.env.APPLICATION_JSON));
    if (json) {
      return unquote(json[key]);
    }
  }),
  cacheInvalid() {
    return false;
  },
});
addProvider({
  description: "From environment variables (following name mangling rules)",
  priority: 700,
  get: (cache, key) => computeIfAbsent(cache, `process.env:${key}`, () => {
    let modifiedKey = key.replace(/\./gi, '_');
    modifiedKey = modifiedKey.replace(/-/gi, '');
    modifiedKey = modifiedKey.toUpperCase();
    return unquote(process.env[modifiedKey]);
  }),
  cacheInvalid() {
    return false;
  },
});
addProvider({
  description: "From application property json files in ${CWD}/config",
  priority: 690,
  get: (cache, key) => {
    const cwd = computeIfAbsent(commonCache, 'cwd', () => process.cwd());
    const configPath = path.join(cwd, 'config', 'application.json');
    const json = computeIfAbsent(cache, configPath, () => JSON.parse(fs.readFileSync(configPath, 'utf8')));
    if (json) {
      return unquote(json[key]);
    }
  },
  cacheInvalid() {
    return false;
  },
});
addProvider({
  description: "From application property json files in ${CWD}",
  priority: 690,
  get: (cache, key) => {
    const cwd = computeIfAbsent(commonCache, 'cwd', () => process.cwd());
    const configPath = path.join(cwd, 'application.json');
    const json = computeIfAbsent(cache, configPath, () => JSON.parse(fs.readFileSync(configPath, 'utf8')));
    if (json) {
      return unquote(json[key]);
    }
  },
  cacheInvalid() {
    return false;
  },
});

function compareProviders(a: ConfigProviderHolder, b: ConfigProviderHolder) {
  if ( a.priority < b.priority ){
    return 1;
  }
  if ( a.priority > b.priority ){
    return -1;
  }
  return 0;
}

function computeIfAbsent(cache: Map<string, any>, key: string, fn: () => any): any {
  let value = cache.get(key);

  if (!value) {
    try { 
      value = fn();
    } catch(e) {
      //console.error(e);
    }

    if (value) {
      console.info(`computed value of '${key}' as '${value}'`);
      cache.set(key, value);
    }
  }
  
  return value;
}

function unquote(s: string) {
  if (s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1);
  }
  else if (s.startsWith('\'') && s.endsWith('\'')) {
    return s.slice(1, -1);
  }
  return s;
}

export function lookupConfig(key: string): string | string[] | undefined {
  let value: any;

  for (var holder of configProviders) {
    if (holder.provider.cacheInvalid()) {
      holder.cache.clear();
    }

    value = holder.provider.get(holder.cache, key);
    if (typeof value === 'string') {
      return value;
    }
    else if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'string') {
        return value as string[];
      }
      else {
        return [] as string[];
      }
    }
    else if (value) {
      return JSON.stringify(value);
    }
  }

  // const cwd = computeIfAbsent("cwd", () => process.cwd());
  // const mp = computeIfAbsent("mp", () => require.main?.path);
}
  