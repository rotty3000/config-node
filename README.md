# @rotty3000/config-node
A library for obtaining external configuration for your application.

This library lets you externalize the configuration of your application so that it can work without any changes in different environments. You use JSON files, environment variables, command line arguments or other well known sources like [Volume Mounted Kubernetes ConfigMaps (or Secrets)](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#add-configmap-data-to-a-volume) to deliver configuration to your application without changing a single line. Property values can be looked up anywhere in your code by using the `lookupConfig` function.

Optionally [custom providers](#custom-providers) can be added to search more exotic sources of configuration like a database, key/value store or secrets vault.

## Usage

```typescript
import {lookupConfig, defaultConfig} from '@rotty3000/config-node';

// Look the value up where you need it rather than storing it: the first lookup is cached, and clearCache()
// (or a provider that refreshes its own cache) is how a value is brought up to date
let value = lookupConfig('a.configuration.key');

// Setting a default value to be used when no provider can locate a configured value. Do this as early as
// possible, ideally before the first lookup of that key.
defaultConfig('config.node.config.trees', ['/configtree']);
```

## Sources of Configuration

The following configuration providers are pre-packaged and searched in order of precedence until a value is found.

1. A JSON file `~/.config-node-devtools.json` in the user home directory which contains configuration keys. It is a development convenience, so it is **not consulted when `NODE_ENV` is `production`**. (See [Structure of JSON configuration](#structure-of-json-configuration).)
1. Command line arguments formatted as `--key=value`.
1. From command line argument `--application.json=<json>` where the inline JSON is structured as in 1. (See [Structure of JSON configuration](#structure-of-json-configuration).)
1. Properties from the `APPLICATION_JSON` environment variable whose value is inline JSON. (See [Structure of JSON configuration](#structure-of-json-configuration).)
1. From individual environment variables (following name mangling rules):
   * Replace dots (.) with underscores (_).
   * Remove any dashes (-).
   * Convert to uppercase.

   _e.g._

   The key `a.configuration.key` becomes an environment variable called `A_CONFIGURATION_KEY`

   The key `a-configuration-key` becomes an environment variable called `ACONFIGURATIONKEY`
1. From config tree structured directories (a.k.a. Volume mounted ConfigMaps/Secrets) specified (as an array) in the configuration property `config.node.config.trees`.

    Setting the configuration property `config.node.config.trees` (using any of the sources described in this list, for instance as an environment variable `CONFIG_NODE_CONFIG_TREES=/config-map,/secrets`) indicates the directories where keys will be looked up (where _key_ matches the file name and file contents become the _value_). A key is a single file name: it may not contain a path separator, and a resolved path or symlink that leaves the configured directory is refused.

   _e.g._

   Given a Kubernetes ConfigMap or Secret mounted at `/config-map` with a data file located at `/config-map/a.config.map.key`, looking up the property `a.config.map.key` will return the contents of the file as the value (without the trailing newline the file carries).
1. From application profile property json files in `${CWD}/config/application-{profile}.json` where _profile_ is set using the property `config.node.profiles.active` (using any of the sources described in this list, for instance as an environment variable `CONFIG_NODE_PROFILES_ACTIVE=test`). (See [Structure of JSON configuration](#structure-of-json-configuration).)
1. From application profile property json files in `${CWD}/application-{profile}.json` where _profile_ is set using the property `config.node.profiles.active` (using any of the sources described in this list, for instance as an environment variable `CONFIG_NODE_PROFILES_ACTIVE=test`). (See [Structure of JSON configuration](#structure-of-json-configuration).)
1. From application property json files in `${CWD}/config/application.json`. (See [Structure of JSON configuration](#structure-of-json-configuration).)
1. From application property json files in `${CWD}/application.json`. (See [Structure of JSON configuration](#structure-of-json-configuration).)
1. From application property json files packaged with the node.js app: the nearest `package.json` at or above the working directory, falling back to the directory of the main script. (See [Structure of JSON configuration](#structure-of-json-configuration).)
1. From programmer provided defaults. As demonstrated in the sample code above a developer can pre-set values to act as the defaults when no other source provides a value.

   e.g.
   ```typescript
   defaultConfig('my.custom.config', 'some value');
   ```

The properties `config.node.config.trees`, `config.node.profiles.active` and `config.node.config.verbose` are protected: the config tree and profile providers will never satisfy them for themselves, so the profiles and trees cannot be redefined by the very sources they configure.

## Value types

`lookupConfig` returns a `string`, a `string[]` or `undefined`.

* A JSON array of strings is returned as a `string[]`; any other array is returned as its JSON text.
* A JSON `false`, `0` or a number arrives as a string (`"false"`, `"0"`, `"5"`), because a provider answers with a falsy value when it has nothing to contribute. An empty array is not an answer and lets the search continue.
* A comma delimited value is split into a `string[]` **only for the flat text sources** — an environment variable and a file in a config tree. A JSON file can express an array for real, so a comma inside a JSON string value (`"Hello, world"`, a JDBC/PostgreSQL URL) stays part of that value.

## Interpolation of placeholders in config values

When a value returned from a lookup contains a placeholder of the form `${key}` the `key` will be looked up and its value, if found, will replace the placeholder. A single value may contain multiple placeholders and it is also possible to have nested placeholders. For example; given the two environment variables `VAR_ONE="env var one value"` and `VAR_TWO="ONE"`, a third property `nested.placeholder=${VAR_${VAR_TWO}}` would result in the value `env var one value`.

A placeholder that cannot be resolved is left in place as written, and a value that references itself (or that would keep re-substituting) stops after a bounded number of steps instead of looping. Treat `${...}` as a way to reference configuration you control: the placeholder names a key that is looked up through every source, so a value that arrives from an untrusted source should not be interpolated.

## Structure of JSON configuration

The configuration JSON structure expects keys to be at the root, as follows:

```json
{
  "key.with.array.value": ["one", "two"],
  "key.with.object.value": {"some.value": "foo"},
  "key.with.number.value": 5,
  "key.with.string.value": "dev"
}
```

## Custom Providers

Custom providers can be added as middleware without affecting other parts of the code.

```typescript
import {addProvider, computeIfAbsent, ConfigProvider} from '@rotty3000/config-node';

const customProvider: ConfigProvider = {
  key: 'my-custom-remote-store',
  description: 'From a database, key value store or secrets vault',
  priority: 100,
  get: (key, providerCache, commonCache) => {
    // If the work is hard, put the value in providerCache for better performance over repeat get operations.
    // The provider is free to hold the providerCache var and clear it when it deems fit to return updated values.
    // commonCache is a cache common to all providers and where values not specific to the provider can be stored in order to improve performance (e.g. `cwd`, `homedir`, etc.)

    return computeIfAbsent(
      providerCache,
      key,
      () => key == 'custom.key' && 'custom value'
    );
  },
};

addProvider(customProvider);
```

A provider signals "I have no value for this key" by returning a falsy value; the search then continues with the next provider. `priority` is compared numerically and the highest priority provider is asked first.

## Debugging and Verbosity

There is an internal property `config.node.config.verbose` which allows external operators to set the verbosity level of the library. When the value is set to `'true'` the library will emit additional information about its processing activities.

Values of sensitive keys (anything whose key contains `secret`, `password`, `token`, `credential` or an API/private key) are logged as `[redacted]`, and a configuration file that fails to parse is reported by path and reason, never by dumping its contents.
