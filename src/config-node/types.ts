export interface ConfigProvider {
  readonly priority: number,
  readonly description: string,
  readonly get: (commonCache: Map<string, any>, providerCache: Map<string, any>, k: string) => any,
}
