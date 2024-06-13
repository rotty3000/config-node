import fs from 'node:fs';
import path from 'node:path';
import {ConfigProvider} from '../types';
import {computeIfAbsent, readJSONFile, unquote} from '../util';

export const applicationConfig: ConfigProvider = {
  key: '${CWD}/config/application.json',
  description: 'From application property json files in ${CWD}/config',
  priority: 3000,
  get: (key, providerCache, commonCache) => {
    const cwd = computeIfAbsent(commonCache, 'cwd', () => process.cwd());
    const configPath = path.join(cwd, 'config', 'application.json');
    if (fs.existsSync(configPath)) {
      const json = computeIfAbsent(providerCache, configPath, () => readJSONFile(configPath));
      if (json) {
        return unquote(json[key]);
      }
    }
  },
};
