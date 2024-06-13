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
import {computeIfAbsent, setVerbose, verbose} from './util';

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

class KeyProviderPair {
  readonly key: string;
  readonly provider: ConfigProvider;
}

const configProviderHolders: ConfigProviderHolder[] = [];
const commonCache = new Map<string, any>();
const stack: KeyProviderPair[] = [];
const regex = /\$\{[^\$]+?\}/;

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
  commonCache.set(key, value);
}

/**
 * This function attempts to find a value for the given key which is looked up from the set of registered providers. This function is the workhorse of this API and is the main entrypoint for developers.
 * @param key - the key to be looked up
 * @returns a value which can be a string, a string[] or undefined
 */
function lookupConfig(key: string): string | string[] | undefined {
  let value: any;

  for (var holder of configProviderHolders) {
    const pair = {key, provider: holder.provider};

    if (stack.find(p => p.key === pair.key && p.provider === pair.provider)) {
      continue;
    }

    stack.push(pair);

    try {
      let valueFromCache = false;

      if (!holder.cache.has(key)) {
        value = holder.provider.get(key, holder.cache, commonCache);

        if (value) {
          if (Array.isArray(value)) {
            if (value.length > 0 && typeof value[0] === 'string') {
              value = value as string[];
            }
            else {
              value = [] as string[];
            }

            value = (value as string[]).map(v => _interpolatePlaceholders(v));
          }
          else if (typeof value !== 'string') {
            value = JSON.stringify(value);

            value = _interpolatePlaceholders(value);
          }
          else {
            value = _interpolatePlaceholders(value);
          }

          holder.cache.set(key, value);
        }

        // map undefined value so we don't process it over and over again

        holder.cache.set(key, value);
      }
      else {
        value = holder.cache.get(key);
        valueFromCache = true
      }

      if (value) {
        verbose && console.debug(
          '[config-node]', `Provider [${holder.provider.key}] returned${valueFromCache ? ' (from cache)' : ''}: `,
          key, '=', value);

        return value;
      }
    }
    finally {
      stack.pop();
    }
  }

  verbose && console.debug('[config-node]', `No Providers returned a value for:`, key);
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

function _interpolatePlaceholders(v: string): any {
  let match = regex.exec(v);

  while (match) {
    // verbose && console.debug('[config-node]', 'Interpolating:', v, 'matched:', match);

    const key = match[0].slice(2, -1);
    const lookedUpValue = lookupConfig(key) as string;

    if (lookedUpValue) {
      v = v.replace(match[0], lookedUpValue)
      match = regex.exec(v);
    }
    else {
      match = undefined;
    }
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

export {addProvider, clearCache, computeIfAbsent, ConfigProvider, defaultConfig, lookupConfig, setVerbose};
