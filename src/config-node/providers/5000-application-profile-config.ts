import path from 'node:path';
import {computeIfAbsent, protectedKeys} from '../util';
import {activeProfile} from './active-profile';
import {jsonFileProvider} from './json-file';

export const applicationProfileConfig = jsonFileProvider({
  key: '${CWD}/config/application-<profile>.json',
  description: 'From application profile property json files in ${CWD}/config',
  priority: 5000,
  isEnabled: (key) => !protectedKeys.includes(key),
  resolvePath: (commonCache) => {
    const profile = activeProfile();

    if (!profile) {
      return undefined;
    }

    const cwd = computeIfAbsent(commonCache, 'cwd', () => process.cwd());

    return path.join(cwd, 'config', `application-${profile}.json`);
  },
});
