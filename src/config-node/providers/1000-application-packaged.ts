import path from 'node:path';
import {getProjectRoot} from '../util';
import {jsonFileProvider} from './json-file';

export const applicationPackaged = jsonFileProvider({
  key: 'application.json',
  description: 'From application property json files packaged with the app',
  priority: 500,
  resolvePath: (commonCache) => {
    let mainPath;

    if (commonCache.has('require.main.path')) {
      mainPath = commonCache.get('require.main.path');
    }
    else {
      mainPath = getProjectRoot() ?? require.main?.path;
      // remember the miss as well: walking up to the filesystem root on every cold key is expensive
      commonCache.set('require.main.path', mainPath);
    }

    return mainPath ? path.join(mainPath, 'application.json') : undefined;
  },
});
