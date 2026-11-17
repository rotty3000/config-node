import {ConfigProvider} from '../types';
import {computeIfAbsent, readJSONFile, readKey, unquote} from '../util';

export interface JsonFileProviderOptions {
  /** The name this provider is reported under in verbose output. */
  readonly key: string;
  readonly description: string;
  readonly priority: number;
  /** Where the JSON file lives, or undefined when there is nothing to read for this lookup. */
  readonly resolvePath: (commonCache: Map<string, any>) => string | undefined;
  /**
   * Lets a provider decline a lookup outright, before anything is resolved or read (used for the keys a
   * provider must never satisfy for itself, and for the developer only devtools file).
   */
  readonly isEnabled?: (key: string) => boolean;
}

/**
 * The shape shared by every provider that reads one JSON file: resolve the path, parse the file once into the
 * provider cache, and hand back one key from it.
 */
export function jsonFileProvider(options: JsonFileProviderOptions): ConfigProvider {
  return {
    key: options.key,
    description: options.description,
    priority: options.priority,
    get: (key, providerCache, commonCache) => {
      if (options.isEnabled && !options.isEnabled(key)) {
        return undefined;
      }

      const configPath = options.resolvePath(commonCache);

      if (!configPath) {
        return undefined;
      }

      // readJSONFile already tolerates a missing file, so the parsed document (or its absence) is cached per
      // path: the file is read at most once per process
      const json = computeIfAbsent(providerCache, configPath, () => readJSONFile(configPath));

      return json ? unquote(readKey(json, key)) : undefined;
    },
  };
}
