import fs from 'node:fs';
import {lookupConfig} from '../../config-node';
import {ConfigProvider} from '../types';
import {computeIfAbsent, protectedKeys, resolveContainedFile, trimFileValue, unquote} from '../util';

export const configTrees: ConfigProvider = {
  key: 'config-trees',
  description: 'From config tree directories (a.k.a. Volume mounted ConfigMaps/Secrets)',
  priority: 6000,
  get: (key, providerCache) => {
    if (protectedKeys.includes(key)) {
      return;
    }
    let configtrees = lookupConfig('config.node.config.trees');
    if (!configtrees) {
      return;
    }
    configtrees = Array.isArray(configtrees) ? configtrees : [configtrees];
    return computeIfAbsent(providerCache, `configtree:${key}`, () => {
      for (var configtree of configtrees as string[]) {
        // the key becomes a file name below the tree, so it is resolved and containment is checked on the
        // real (symlink free) path: neither a `..` key nor a link can read outside the configured tree
        const configtreeEntry = resolveContainedFile(configtree, key);

        if (configtreeEntry) {
          return unquote(trimFileValue(fs.readFileSync(configtreeEntry, 'utf8')));
        }
      }
    });
  },
};
