import {ConfigProvider} from "../types";
import {computeIfAbsent, unquote} from "../util";

export const individualEnvVars: ConfigProvider = {
  description: "From individual environment variables (following name mangling rules)",
  priority: 7000,
  get: (commonCache, providerCache, key) => computeIfAbsent(providerCache, `process.env:${key}`, () => {
    let modifiedKey = key.replace(/\./gi, '_');
    modifiedKey = modifiedKey.replace(/-/gi, '');
    modifiedKey = modifiedKey.toUpperCase();
    return unquote(process.env[modifiedKey]);
  }),
};