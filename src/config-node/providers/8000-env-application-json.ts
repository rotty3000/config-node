import {ConfigProvider} from "../types";
import {computeIfAbsent, unquote} from "../util";

export const envApplicationJson: ConfigProvider = {
  description: "Properties from APPLICATION_JSON (inline JSON embedded in an environment variable)",
  priority: 8000,
  get: (commonCache, providerCache, key) => computeIfAbsent(providerCache, key, () => {
    if (process.env.APPLICATION_JSON) {
      const json = computeIfAbsent(providerCache, `process.env.APPLICATION_JSON`, () => JSON.parse(process.env.APPLICATION_JSON));
      if (json) {
        return unquote(json[key]);
      }
    }
  }),
};
