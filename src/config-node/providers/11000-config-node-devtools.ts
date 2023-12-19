import fs from 'fs';
import os from 'os';
import path from 'node:path';
import {ConfigProvider} from '../types';
import {computeIfAbsent, unquote} from '../util';

export const configNodeDevtools: ConfigProvider = {
  description: "From ~/.config-node-devtools.json",
  priority: 11000,
  get: (commonCache, providerCache, key) => computeIfAbsent(providerCache, key, () => {
    const homedir = computeIfAbsent(commonCache, 'homedir', () => os.homedir());
    const filePath = path.join(homedir, '.config-node-devtools.json');
    if (fs.existsSync(filePath)) {
      const json = computeIfAbsent(providerCache, filePath, () => JSON.parse(fs.readFileSync(filePath, 'utf8')));
      if (json) {
        return unquote(json[key]);
      }
    }
  }),
};
