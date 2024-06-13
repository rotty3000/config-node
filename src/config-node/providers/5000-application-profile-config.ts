import fs from 'node:fs';
import path from 'node:path';
import {lookupConfig} from "..";
import {ConfigProvider} from "../types";
import {computeIfAbsent, protectedKeys, readJSONFile, unquote} from "../util";

export const applicationProfileConfig: ConfigProvider = {
  description: "From application profile property json files in ${CWD}/config",
  priority: 5000,
  get: (key, providerCache, commonCache) => {
    if (protectedKeys.includes(key)) {
      return;
    }
    let profile = lookupConfig('config.node.profiles.active');
    if (!profile) {
      return;
    }
    profile = Array.isArray(profile) ? profile[profile.length - 1] : profile;
    const cwd = computeIfAbsent(commonCache, 'cwd', () => process.cwd());
    const configPath = path.join(cwd, 'config', `application-${profile}.json`);
    const json = computeIfAbsent(providerCache, configPath, () => readJSONFile(configPath));
    if (json) {
      return unquote(json[key]);
    }
  },
};
