import fs from 'node:fs';
import path from "path";
import {lookupConfig} from "..";
import {ConfigProvider} from "../types";
import {computeIfAbsent, protectedKeys, unquote} from "../util";

export const configTrees: ConfigProvider = {
  description: "From config tree directories (a.k.a. Volume mounted ConfigMaps/Secrets)",
  priority: 6000,
  get: (commonCache, providerCache, key) => {
    if (protectedKeys.includes(key)) {
      return;
    }
    let configtrees = lookupConfig('config.node.config.trees');
    if (!configtrees) {
      return;
    }
    configtrees = Array.isArray(configtrees) ? configtrees : [configtrees];
    return computeIfAbsent(providerCache, `configtree:${key}`, () => {
      for (var configtree of configtrees) {
        const configtreeEntry = path.join(configtree, key);
        if (fs.existsSync(configtreeEntry)) {
          return unquote(fs.readFileSync(configtreeEntry, 'utf8'));
        }
      }
    });
  },
};
