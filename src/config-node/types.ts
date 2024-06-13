/**
 * A ConfigProvider is an implementation that provides configuration. The source can be anything or anywhere.
 */
export interface ConfigProvider {
  /**
   * The key of the provider. Used to uniquely identify the provider.
   *
   * @type {string}
   */
  readonly key: string,
  /**
   * A description of the provider. Used only when verbose mode is enabled.
   *
   * @type {string}
   */
  readonly description?: string,
  /**
   * The priority with which your provider is registered. Higher priority providers take precedence over those with lower priority.
   *
   * @type {number}
   */
  readonly priority: number,
  /**
   * Get a value from the provider for a given key.
   *
   * @param {string}            k             - the key
   * @param {Map<string, any>} providerCache - a cache specific to the provider where provider specific values can be stored in order to improve performance
   * @param {Map<string, any>} commonCache   - the cache common to all providers where values not specific to the provider can be stored in order to improve performance (e.g. `cwd`, `homedir`)
   */
  readonly get: (k: string, providerCache: Map<string, any>, commonCache: Map<string, any>) => any,
}
