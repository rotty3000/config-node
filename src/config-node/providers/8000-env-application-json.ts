import {ConfigProvider} from "../types";
import {computeIfAbsent, unquote} from "../util";

export const envApplicationJson: ConfigProvider = {
  description: "Properties from APPLICATION_JSON (inline JSON embedded in an environment variable)",
  priority: 8000,
  get: (key, providerCache) => computeIfAbsent(providerCache, key, () => {
    const value = process.env.APPLICATION_JSON;
    if (value && value.length > 1) {
      const json = computeIfAbsent(providerCache, `process.env.APPLICATION_JSON`, () => JSON.parse(value));
      if (json) {
        return unquote(json[key]);
      }
    }
  }),
};
