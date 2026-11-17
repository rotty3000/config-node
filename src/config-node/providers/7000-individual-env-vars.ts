import {ConfigProvider} from '../types';
import {commaSeparated, computeIfAbsent, unquote} from '../util';

export const individualEnvVars: ConfigProvider = {
  key: 'environment-variables',
  description: 'From individual environment variables (following name mangling rules)',
  priority: 7000,
  get: (key, providerCache) => computeIfAbsent(providerCache, `process.env:${key}`, () => {
    let modifiedKey = key.replace(/\./gi, '_');
    modifiedKey = modifiedKey.replace(/-/gi, '');
    modifiedKey = modifiedKey.toUpperCase();
    return commaSeparated(unquote(process.env[modifiedKey]));
  }),
};