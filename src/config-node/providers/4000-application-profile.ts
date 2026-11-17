import path from 'node:path';
import {lookupConfig} from '../../config-node';
import {ConfigProvider} from '../types';
import {computeIfAbsent, isSafePathSegment, protectedKeys, readJSONFile, readKey, unquote} from '../util';

export const applicationProfile: ConfigProvider = {
  key: '${CWD}/application-<profile>.json',
  description: 'From application profile property json files in ${CWD}',
  priority: 4000,
  get: (key, providerCache, commonCache) => {
    if (protectedKeys.includes(key)) {
      return;
    }
    let profile = lookupConfig('config.node.profiles.active');
    if (!profile) {
      return;
    }
    profile = Array.isArray(profile) ? profile[profile.length - 1] : profile;
    // the profile name is pasted into a file name, so it must not be able to walk out of the directory
    if (!isSafePathSegment(profile as string)) {
      return;
    }
    const cwd = computeIfAbsent(commonCache, 'cwd', () => process.cwd());
    const configPath = path.join(cwd, `application-${profile}.json`);
    const json = computeIfAbsent(providerCache, configPath, () => readJSONFile(configPath));
    if (json) {
      return unquote(readKey(json, key));
    }
  },
};
