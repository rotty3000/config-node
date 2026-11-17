import path from 'node:path';
import {computeIfAbsent, protectedKeys} from '../util';
import {activeProfile} from './active-profile';
import {jsonFileProvider} from './json-file';

export const applicationProfile = jsonFileProvider({
  key: '${CWD}/application-<profile>.json',
  description: 'From application profile property json files in ${CWD}',
  priority: 4000,
  isEnabled: (key) => !protectedKeys.includes(key),
  resolvePath: (commonCache) => {
    const profile = activeProfile();

    if (!profile) {
      return undefined;
    }

    const cwd = computeIfAbsent(commonCache, 'cwd', () => process.cwd());

    return path.join(cwd, `application-${profile}.json`);
  },
});
