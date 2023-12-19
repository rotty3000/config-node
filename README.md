# @rotty3000/config-node
A library for obtaining external configuration for your application.

## Usage

```typescript
import {lookupConfig, defaultConfig} from '@rotty3000/config-node';

// It's best not to store the value and to always look it up because providers may invalidate their caches in order to give updated values
let value = lookupConfig('a.configuration.key');

// Setting a default value to be used when no provider can locate a configured value

// do this before any access for the key has been performed
defaultConfig('config.node.config.trees', ['/configtree']);
```

## Sources of Configuration

The following configuration sources are used in order of precedence.

1. A JSON file `~/.config-node-devtools.json` in the user home directory which contains configuration keys (following example above `{"a.configuration.key": {"some.value": "foo"}`)
1. Command line arguments formatted as `--key=value`.
1. From command line argument `--application.json=<json>` where the inline JSON is structured as in 1.
1. Properties from the `APPLICATION_JSON` environment variable whose value is inline JSON
1. From individual environment variables (following name mangling rules):
   * Replace dots (.) with underscores (_).
   * Remove any dashes (-).
   * Convert to uppercase.

   _e.g._

   The key `a.configuration.key` becomes an environment variable called `A_CONFIGURATION_KEY`

   The key `a-configuration-key` becomes an environment variable called `ACONFIGURATIONKEY`
1. From config tree structured directories (a.k.a. Volume mounted ConfigMaps/Secrets) specified (as an array) in the configuration property `config.node.config.trees`.

    Setting the configuration property `config.node.config.trees` (using any of the sources described in this list, for instance as an environment variable `CONFIG_NODE_CONFIG_TREES=/config-map,/secrets`) indicates the directories where keys will be looked up (where _key_ matches the file name and file contents become the _value_).

   _e.g._

   Given a Kubernetes ConfigMap or Secret mounted at `/config-map` with a data file located at `/config-map/a.config.map.key`, looking up the property `a.config.map.key` will return the contents of the file as the value.
1. From application profile property json files in `${CWD}/config/application-{profile}.json` where _profile_ is set using the property `config.node.profiles.active` (using any of the sources described in this list, for instance as an environment variable `CONFIG_NODE_PROFILES_ACTIVE=test`).
1. From application profile property json files in `${CWD}/application-{profile}.json` where _profile_ is set using the property `config.node.profiles.active` (using any of the sources described in this list, for instance as an environment variable `CONFIG_NODE_PROFILES_ACTIVE=test`).
1. From application property json files in `${CWD}/config/application.json`.
1. From application property json files in `${CWD}/application.json`.
1. From application property json files packaged with the node.js app (i.e. adjacent to the main script).
1. From programer provided defaults. As demonstrated in the sample code above a developer can pre-set values to act as the defaults when no other source provides a value.

   e.g.
   ```typescript
   defaultConfig('my.custom.config', 'some value');
   ```

## Custom Providers

Custom providers can be added as middle ware to without affecting other parts of the code.

```typescript
import {addProvider, computeIfAbsent, ConfigProvider} from '@rotty3000/config-node';

const customProvider: ConfigProvider = {
  description: "From a database, vault or whatever",
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