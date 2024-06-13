import fs from 'node:fs';
import path from 'node:path';
import {ConfigProvider} from "../types";
import {computeIfAbsent, getProjectRoot, readJSONFile, unquote} from "../util";

export const applicationPackaged: ConfigProvider = {
  description: "From application property json files packaged with the app",
  priority: 1000,
  get: (key, providerCache, commonCache) => {
    const mainPath = computeIfAbsent(commonCache, 'require.main.path', () => {
      const mainPath = getProjectRoot();
      if (mainPath) {
        return mainPath;
      }
      return require.main?.path;
    });
    if (mainPath) {
      const configPath = path.join(mainPath, 'application.json');
      if (fs.existsSync(configPath)) {
        const json = computeIfAbsent(providerCache, configPath, () => readJSONFile(configPath));
        if (json) {
          return unquote(json[key]);
        }
      }
    }
  },
};
