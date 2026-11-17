import {lookupConfig} from '../config-node';

export enum OAuthApplicationProfile {
  HEADLESS_SERVER,
  USER_AGENT
}

export interface LXCOAuthApplication {
  readonly applicationType: OAuthApplicationProfile;
  readonly audience: () => string | undefined;
  readonly authorizationUri: () => string | undefined;
  readonly clientId: () => string | undefined;
  readonly clientSecret: () => string | undefined;
  readonly introspectionUri: () => string | undefined;
  readonly jwksUri: () => string | undefined;
  readonly scopes: () => string[] | undefined;
  readonly tokenUri: () => string | undefined;
}

export interface LXCConfig {
  readonly dxpDomains: () => string[];
  readonly dxpMainDomain: () => string | undefined;
  readonly dxpProtocol: () => string | undefined;
  readonly oauthApplication: (erc: string) => LXCOAuthApplication | undefined;
}

/**
 * Values reach this API in three shapes depending on where they came from: a comma delimited env var arrives
 * already split into a string[] by `unquote`, a multi-line value (the volume mounted ConfigMap/Secret form)
 * arrives as a single string, and an unset key arrives as undefined. Normalize all three to a list of trimmed,
 * non-empty entries so callers never have to care which shape they got.
 */
function toList(value: string | string[] | undefined): string[] {
  let values: string[];

  if (Array.isArray(value)) {
    values = value;
  }
  else if (value) {
    values = `${value}`.split(/[,\r\n]+/);
  }
  else {
    values = [];
  }

  return values.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}

/**
 * The single valued lxc settings (protocol, audience, URIs, …) arrive through the same sources as the list
 * valued ones, so a comma delimited value must not leak an array into a scalar accessor.
 */
function first(value: string | string[] | undefined): string | undefined {
  return toList(value)[0];
}

export const lxcConfig: LXCConfig = {
  dxpDomains: () => toList(lookupConfig('com.liferay.lxc.dxp.domains')),
  dxpMainDomain: () => {
    let value = first(lookupConfig('com.liferay.lxc.dxp.main.domain'));

    if (!value) {
      value = first(lookupConfig('com.liferay.lxc.dxp.mainDomain'));
    }

    return value;
  },
  dxpProtocol: () => first(lookupConfig('com.liferay.lxc.dxp.server.protocol')),
  oauthApplication: (erc: string) => {
    const ercs = toList(lookupConfig('liferay.oauth.application.external.reference.codes'));

    if (!ercs.includes(erc)) {
      return undefined;
    }

    let applicationType = OAuthApplicationProfile.USER_AGENT;

    if (lookupConfig(`${erc}.oauth2.headless.server.client.id`)) {
      applicationType = OAuthApplicationProfile.HEADLESS_SERVER;
    }

    const family = applicationType === OAuthApplicationProfile.HEADLESS_SERVER ? 'headless.server' : 'user.agent';

    // deliberately not memoized: the values live in the provider caches that clearCache() owns, and a module
    // level map would keep serving the old application type after a flush
    return {
      applicationType,
      audience: () => first(lookupConfig(`${erc}.oauth2.${family}.audience`)),
      authorizationUri: () => first(lookupConfig(`${erc}.oauth2.authorization.uri`)),
      clientId: () => first(lookupConfig(`${erc}.oauth2.${family}.client.id`)),
      clientSecret: () => first(lookupConfig(`${erc}.oauth2.${family}.client.secret`)),
      introspectionUri: () => first(lookupConfig(`${erc}.oauth2.introspection.uri`)),
      jwksUri: () => first(lookupConfig(`${erc}.oauth2.jwks.uri`)),
      scopes: () => {
        const scopes = toList(lookupConfig(`${erc}.oauth2.${family}.scopes`));

        return scopes.length > 0 ? scopes : undefined;
      },
      tokenUri: () => first(lookupConfig(`${erc}.oauth2.token.uri`)),
    };
  },
};
