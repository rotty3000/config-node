import {ConfigProvider} from './types';
import {configNodeDevtools} from './providers/11000-config-node-devtools';
import {cli} from './providers/10000-cli';
import {cliApplicationJson} from './providers/9000-cli-application-json';
import {envApplicationJson} from './providers/8000-env-application-json';
import {individualEnvVars} from './providers/7000-individual-env-vars';
import {configTrees} from './providers/6000-config-trees';
import {applicationProfileConfig} from './providers/5000-application-profile-config';
import {applicationProfile} from './providers/4000-application-profile';
import {applicationConfig} from './providers/3000-application-config';
import {application} from './providers/2000-application';
import {applicationPackaged} from './providers/1000-application-packaged';
import {programmatic} from './providers/0000-programmatic';
import {computeIfAbsent, redactValue, setVerbose, verbose} from './util';

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

interface KeyProviderPair {
  readonly key: string;
  readonly provider: ConfigProvider;
}

const configProviderHolders: ConfigProviderHolder[] = [];
const commonCache = new Map<string, any>();
const stack: KeyProviderPair[] = [];
const regex = /\$\{[^\$]+?\}/;

/**
 * A value that keeps reproducing its own placeholder (or a pair of values that reference each other) would
 * otherwise spin forever; stop after this many substitutions and leave the remainder literal.
 */
const MAX_INTERPOLATION_STEPS = 100;

/**
 * Register one or more configuration providers.
 *
 * @param providers: ConfigProvider[] - the providers
 */
function addProvider(...providers: ConfigProvider[]) {
  providers.forEach(provider => configProviderHolders.push(new ConfigProviderHolder(provider)));
  configProviderHolders.sort(_compareProviders);
}

/**
 * A utility function to flush all the caches. (This is a hammer and should not generally be used. It's mostly useful un testing new provider implementations.)
 */
function clearCache() {
  configProviderHolders.forEach(configProvider => configProvider.cache.clear());
  commonCache.clear();
}

/**
 * A utility function to set a default configuration value programmatically.
 *
 * @param key - the key under which to store the value
 * @param value - the configuration value to store
 */
function defaultConfig(key: string, value: any): void {
  // a boolean or a number is a legitimate configuration value; providers answer with a falsy value when they
  // have nothing, so hand the core a string the way a JSON file would
  if (typeof value === 'boolean' || typeof value === 'number') {
    value = String(value);
  }

  commonCache.set(key, value);

  // a lookup made before this call (including the one this library performs when it is imported) may have
  // cached the absence of a value for the key; drop that entry so the default is not shadowed by a stale miss
  const programmaticHolder = configProviderHolders.find(holder => holder.provider === programmatic);

  programmaticHolder?.cache.delete(key);
}

/**
 * This function attempts to find a value for the given key which is looked up from the set of registered providers. This function is the workhorse of this API and is the main entrypoint for developers.
 * @param key - the key to be looked up
 * @returns a value which can be a string, a string[] or undefined
 */
function lookupConfig(key: string): string | string[] | undefined {
  let value: any;

  for (var holder of configProviderHolders) {
    const pair: KeyProviderPair = {key, provider: holder.provider};

    if (stack.find(p => p.key === pair.key && p.provider === pair.provider)) {
      continue;
    }

    stack.push(pair);

    try {
      let valueFromCache = false;

      if (!holder.cache.has(key)) {
        value = _normalizeValue(holder.provider.get(key, holder.cache, commonCache));

        holder.cache.set(key, value);
      }
      else {
        value = holder.cache.get(key);
        valueFromCache = true
      }

      if (value) {
        verbose && console.debug(
          '[config-node]', `Provider [${_providerLabel(holder.provider)}] returned${valueFromCache ? ' (from cache)' : ''}: `,
          key, '=', redactValue(key, value));

        return value;
      }
    }
    finally {
      stack.pop();
    }
  }

  verbose && console.debug('[config-node]', `No Providers returned a value for:`, key);
}

/**
 * Normalize whatever a provider returned into the `string | string[]` shape this API promises, interpolating
 * any `${key}` placeholders on the way through.
 */
function _normalizeValue(value: any): any {
  // a provider answers with a falsy value (undefined, or the `key === 'x' && 'value'` idiom) when it has
  // nothing to contribute
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    // an empty list is not an answer, let the lower precedence providers have a turn
    if (value.length === 0) {
      return undefined;
    }

    // the whole list has to be strings for it to be a string[]: deciding on the first entry made the result
    // depend on element order (`["one", 2]` came back as an array holding a number)
    if (value.every((entry: any) => typeof entry === 'string')) {
      return (value as string[]).map(v => _interpolatePlaceholders(v));
    }

    // a list of objects or numbers is data the caller asked for; returning [] here would lose it
    return _interpolatePlaceholders(_stringify(value));
  }

  if (typeof value === 'string') {
    return _interpolatePlaceholders(value);
  }

  return _interpolatePlaceholders(_stringify(value));
}

function _providerLabel(provider: ConfigProvider): string {
  return provider.description ? `${provider.key}: ${provider.description}` : provider.key;
}

function _stringify(value: any): any {
  try {
    return JSON.stringify(value);
  }
  catch (e) {
    verbose && console.error('[config-node]', 'Could not serialize the value:', (e as Error).message);
  }
}

function _compareProviders(a: ConfigProviderHolder, b: ConfigProviderHolder) {
  if (a.priority < b.priority) {
    return 1;
  }
  if (a.priority > b.priority) {
    return -1;
  }
  return 0;
}

function _interpolatePlaceholders(v: any): any {
  if (typeof v !== 'string') {
    return v;
  }

  let match = regex.exec(v);
  let steps = 0;

  while (match) {
    if (++steps > MAX_INTERPOLATION_STEPS) {
      verbose && console.warn('[config-node]', 'Stopped interpolating after', MAX_INTERPOLATION_STEPS, 'steps:', v);

      break;
    }

    const key = match[0].slice(2, -1);
    const lookedUpValue = lookupConfig(key) as string;

    if (!lookedUpValue) {
      break;
    }

    // a function replacement keeps `$&`, `$'` and `` $` `` in the resolved value literal instead of letting
    // String.replace interpret them as replacement patterns
    const next = v.replace(match[0], () => lookedUpValue);

    // the value reproduced the placeholder exactly: making progress is impossible, leave it as written
    if (next === v) {
      break;
    }

    v = next;
    match = regex.exec(v);
  }

  return v;
}

addProvider(
  configNodeDevtools,
  cli,
  cliApplicationJson,
  envApplicationJson,
  individualEnvVars,
  configTrees,
  applicationProfileConfig,
  applicationProfile,
  applicationConfig,
  application,
  applicationPackaged,
  programmatic
);

setVerbose(lookupConfig('config.node.config.verbose') === 'true');

export {addProvider, clearCache, computeIfAbsent, ConfigProvider, defaultConfig, lookupConfig, setVerbose};
