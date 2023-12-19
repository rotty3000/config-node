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
import {setVerbose, verbose} from './util';

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

const configProviderHolders: ConfigProviderHolder[] = [];
const commonCache = new Map<string, any>();

function addProvider(...providers: ConfigProvider[]) {
  providers.forEach(provider => configProviderHolders.push(new ConfigProviderHolder(provider)));
  configProviderHolders.sort(_compareProviders);
}

function clearCache() {
  configProviderHolders.forEach(configProvider => configProvider.cache.clear());
  commonCache.clear();
}

function defaultConfig(key: string, value: any): void {
  commonCache.set(key, value);
}

function lookupConfig(key: string): string | string[] | undefined {
  let value: any;

  for (var holder of configProviderHolders) {
    value = holder.provider.get(key, holder.cache, commonCache);

    if (value) {
      if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === 'string') {
          value = value as string[];
        }
        else {
          value = [] as string[];
        }
      }
      else if (typeof value !== 'string') {
        value = JSON.stringify(value);
      }

      verbose && console.debug(`Provider [${holder.provider.description}] returned:`, value);

      return value;
    }
  }
}

function _compareProviders(a: ConfigProviderHolder, b: ConfigProviderHolder) {
  if ( a.priority < b.priority ){
    return 1;
  }
  if ( a.priority > b.priority ){
    return -1;
  }
  return 0;
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

export {addProvider, clearCache, ConfigProvider, defaultConfig, lookupConfig, setVerbose};
