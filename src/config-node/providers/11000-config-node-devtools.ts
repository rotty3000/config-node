import os from 'os';
import path from 'node:path';
import {computeIfAbsent} from '../util';
import {jsonFileProvider} from './json-file';

/**
 * A file in the user's home directory is a developer convenience, not configuration: it outranks every other
 * source by design (that is what makes it useful for overriding a packaged default while debugging), which is
 * also why it is not consulted in production where it would let whoever can write to $HOME take over the
 * application's configuration.
 */
export const configNodeDevtools = jsonFileProvider({
  key: '~/.config-node-devtools.json',
  description: 'From ~/.config-node-devtools.json',
  priority: 11000,
  isEnabled: () => process.env.NODE_ENV !== 'production',
  resolvePath: (commonCache) => {
    const homedir = computeIfAbsent(commonCache, 'homedir', () => os.homedir());

    return path.join(homedir, '.config-node-devtools.json');
  },
});
