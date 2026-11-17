import path from 'node:path';
import {computeIfAbsent} from '../util';
import {jsonFileProvider} from './json-file';

export const application = jsonFileProvider({
  key: '${CWD}/application.json',
  description: 'From application property json files in ${CWD}',
  priority: 2000,
  resolvePath: (commonCache) => {
    const cwd = computeIfAbsent(commonCache, 'cwd', () => process.cwd());

    return path.join(cwd, 'application.json');
  },
});
