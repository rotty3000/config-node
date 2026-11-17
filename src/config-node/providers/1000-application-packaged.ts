import fs from 'node:fs';
import path from 'node:path';
import {ConfigProvider} from '../types';
import {computeIfAbsent, getProjectRoot, readJSONFile, readKey, unquote} from '../util';

export const applicationPackaged: ConfigProvider = {
  key: 'application.json',
  description: 'From application property json files packaged with the app',
  priority: 500,
  get: (key, providerCache, commonCache) => {
    let mainPath;

    if (commonCache.has('require.main.path')) {
      mainPath = commonCache.get('require.main.path');
    }
    else {
      mainPath = getProjectRoot() ?? require.main?.path;
      // remember the miss as well: walking up to the filesystem root on every cold key is expensive
      commonCache.set('require.main.path', mainPath);
    }
    if (mainPath) {
      const configPath = path.join(mainPath, 'application.json');
      if (fs.existsSync(configPath)) {
        const json = computeIfAbsent(providerCache, configPath, () => readJSONFile(configPath));
        if (json) {
          return unquote(readKey(json, key));
        }
      }
    }
  },
};
