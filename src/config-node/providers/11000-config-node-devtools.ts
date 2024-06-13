import fs from 'fs';
import os from 'os';
import path from 'node:path';
import {ConfigProvider} from '../types';
import {computeIfAbsent, readJSONFile, unquote} from '../util';

export const configNodeDevtools: ConfigProvider = {
  key: '~/.config-node-devtools.json',
  description: 'From ~/.config-node-devtools.json',
  priority: 11000,
  get: (key, providerCache, commonCache) => computeIfAbsent(providerCache, key, () => {
    const homedir = computeIfAbsent(commonCache, 'homedir', () => os.homedir());
    const filePath = path.join(homedir, '.config-node-devtools.json');
    if (fs.existsSync(filePath)) {
      const json = computeIfAbsent(providerCache, filePath, () => readJSONFile(filePath));
      if (json) {
        return unquote(json[key]);
      }
    }
  }),
};
