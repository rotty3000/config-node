import path from 'node:path';
import {computeIfAbsent} from '../util';
import {jsonFileProvider} from './json-file';

export const applicationConfig = jsonFileProvider({
  key: '${CWD}/config/application.json',
  description: 'From application property json files in ${CWD}/config',
  priority: 3000,
  resolvePath: (commonCache) => {
    const cwd = computeIfAbsent(commonCache, 'cwd', () => process.cwd());

    return path.join(cwd, 'config', 'application.json');
  },
});
