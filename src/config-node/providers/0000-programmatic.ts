import {ConfigProvider} from '../types';

export const programmatic: ConfigProvider = {
  key: 'programmatic',
  description: 'From programmatically provided defaults',
  priority: -100,
  get: (key, providerCache, commonCache) => commonCache.get(key),
};
