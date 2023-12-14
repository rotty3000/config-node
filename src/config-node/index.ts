import path from 'node:path';
import fs from 'fs';
import os from 'os';

export interface ConfigProvider {
  readonly priority: number,
  readonly description: string,
  readonly get: (cache: Map<string, any>, k: string) => any,
  readonly cacheInvalid: () => boolean,
}

let verbose: boolean = false;

export function setVerbose(b : boolean) {
  verbose = b;
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
const protectedKeys = [
  'config.node.config.trees', 
  'config.node.profiles.active'
];

export function addProvider(provider: ConfigProvider) {
  configProviders.push(new ConfigProviderHolder(provider));
  configProviders.sort(compareProviders);
}

addProvider({
  description: "From ~/.config-node-devtools.json",
  priority: 1000,
  get: (cache, key) => computeIfAbsent(cache, key, () => {
    const homedir = computeIfAbsent(commonCache, 'homedir', () => os.homedir());
    const filePath = path.join(homedir, '.config-node-devtools.json');
    if (fs.existsSync(filePath)) {
      const json = computeIfAbsent(cache, filePath, () => JSON.parse(fs.readFileSync(filePath, 'utf8')));
      if (json) {
        return unquote(json[key]);
      }
    }
  }),
  cacheInvalid() {
    return false;
  },
});
addProvider({
  description: "From command line arguments (--key=value)",
  priority: 900,
  get: (cache, key) => computeIfAbsent(cache, `process.args.${key}`, () => {
    const prefix = `--${key}=`
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
  description: "From command line argument (--application.json=<json>)",
  priority: 890,
  get: (cache, key) => computeIfAbsent(cache, `process.args.${key}`, () => {
    const prefix = `--application.json=`
    for (var arg of process.argv) {
      if (arg.startsWith(prefix)) {
        const value = JSON.parse(arg.substring(prefix.length));
        return unquote(value[key]);
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
    if (process.env.APPLICATION_JSON) {
      const json = computeIfAbsent(cache, `process.env.APPLICATION_JSON`, () => JSON.parse(process.env.APPLICATION_JSON));
      if (json) {
        return unquote(json[key]);
      }
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
  description: "From config tree directories (a.k.a. Volume mounted ConfigMaps/Secrets)",
  priority: 700,
  get: (cache, key) => {
    if (protectedKeys.includes(key)) {
      return;
    }
    const configtrees = lookupConfig('config.node.config.trees') as string[];
    if (!configtrees || configtrees.length == 0) {
      return;
    }
    return computeIfAbsent(cache, `configtree:${key}`, () => {
      for (var configtree of configtrees) {
        const configtreeEntry = path.join(configtree, key);
        if (fs.existsSync(configtreeEntry)) {
          return fs.readFileSync(configtreeEntry, 'utf8');
        }
      }
    });
  },
  cacheInvalid() {
    return false;
  },
});
addProvider({
  description: "From application profile property json files in ${CWD}/config",
  priority: 690,
  get: (cache, key) => {
    if (protectedKeys.includes(key)) {
      return;
    }
    const profile = lookupConfig('config.node.profiles.active') as string[];
    if (!profile || profile.length == 0) {
      return;
    }
    const cwd = computeIfAbsent(commonCache, 'cwd', () => process.cwd());
    const configPath = path.join(cwd, 'config', `application-${profile[profile.length - 1]}.json`);
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
  description: "From application profile property json files in ${CWD}",
  priority: 680,
  get: (cache, key) => {
    if (key === 'config.node.profiles.active') {
      return;
    }
    const profile = lookupConfig('config.node.profiles.active') as string[];
    if (!profile || profile.length == 0) {
      return;
    }
    const cwd = computeIfAbsent(commonCache, 'cwd', () => process.cwd());
    const configPath = path.join(cwd, `application-${profile[profile.length - 1]}.json`);
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
  description: "From application property json files in ${CWD}/config",
  priority: 670,
  get: (cache, key) => {
    const cwd = computeIfAbsent(commonCache, 'cwd', () => process.cwd());
    const configPath = path.join(cwd, 'config', 'application.json');
    if (fs.existsSync(configPath)) {
      const json = computeIfAbsent(cache, configPath, () => JSON.parse(fs.readFileSync(configPath, 'utf8')));
      if (json) {
        return unquote(json[key]);
      }
    }
  },
  cacheInvalid() {
    return false;
  },
});
addProvider({
  description: "From application property json files in ${CWD}",
  priority: 660,
  get: (cache, key) => {
    const cwd = computeIfAbsent(commonCache, 'cwd', () => process.cwd());
    const configPath = path.join(cwd, 'application.json');
    if (fs.existsSync(configPath)) {
      const json = computeIfAbsent(cache, configPath, () => JSON.parse(fs.readFileSync(configPath, 'utf8')));
      if (json) {
        return unquote(json[key]);
      }
    }
  },
  cacheInvalid() {
    return false;
  },
});
addProvider({
  description: "From application property json files packaged with the app",
  priority: 650,
  get: (cache, key) => {
    const mainPath = computeIfAbsent(commonCache, 'require.main.path', () => require.main?.path);
    const configPath = path.join(mainPath, 'application.json');
    if (fs.existsSync(configPath)) {
      const json = computeIfAbsent(cache, configPath, () => JSON.parse(fs.readFileSync(configPath, 'utf8')));
      if (json) {
        return unquote(json[key]);
      }
    }
  },
  cacheInvalid() {
    return false;
  },
});
addProvider({
  description: "Programer provided defaults",
  priority: -100,
  get: (cache, key) => commonCache.get(key),
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
      verbose && console.error(e);
    }

    if (value) {
      verbose && console.info(`computed value of '${key}' as '${value}'`);
      cache.set(key, value);
    }
  }
  
  return value;
}

function unquote(it: any) {
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

export function defaultConfig(key: string, value: any): void {
  commonCache.set(key, value);
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
}
