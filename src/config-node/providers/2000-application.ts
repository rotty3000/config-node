import fs from 'node:fs';
import path from 'node:path';
import {ConfigProvider} from "../types";
import {computeIfAbsent, unquote} from "../util";

export const application: ConfigProvider = {
  description: "From application property json files in ${CWD}",
  priority: 2000,
  get: (key, providerCache, commonCache) => {
    const cwd = computeIfAbsent(commonCache, 'cwd', () => process.cwd());
    const configPath = path.join(cwd, 'application.json');
    if (fs.existsSync(configPath)) {
      const json = computeIfAbsent(providerCache, configPath, () => JSON.parse(fs.readFileSync(configPath, 'utf8')));
      if (json) {
        return unquote(json[key]);
      }
    }
  },
};
