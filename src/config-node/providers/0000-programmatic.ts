import {ConfigProvider} from "../types";

export const programmatic: ConfigProvider = {
  description: "From programmatically provided defaults",
  priority: -100,
  get: (commonCache, providerCache, key) => commonCache.get(key),
};
