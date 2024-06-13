import {ConfigProvider} from '../types';
import {computeIfAbsent, unquote} from '../util';

export const cli: ConfigProvider = {
  key: 'command-line-arguments',
  description: 'From command line arguments (--key=value)',
  priority: 1000,
  get: (key, providerCache) => computeIfAbsent(providerCache, `process.args.${key}`, () => {
    const prefix = `--${key}=`
    for (var arg of process.argv) {
      if (arg.startsWith(prefix)) {
        const value = arg.substring(prefix.length);
        return unquote(value);
      }
    }
    return undefined;
  }),
};
