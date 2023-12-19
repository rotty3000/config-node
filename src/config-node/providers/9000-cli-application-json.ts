import { ConfigProvider } from "../types";
import { computeIfAbsent, unquote } from "../util";

export const cliApplicationJson: ConfigProvider = {
  description: "From command line argument (--application.json=<json>)",
  priority: 9000,
  get: (key, providerCache) => computeIfAbsent(providerCache, `process.args.${key}`, () => {
    const prefix = `--application.json=`
    for (var arg of process.argv) {
      if (arg.startsWith(prefix)) {
        const value = JSON.parse(arg.substring(prefix.length));
        return unquote(value[key]);
      }
    }
    return undefined;
  }),
};
