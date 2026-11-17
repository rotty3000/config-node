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

const oauthApplications = new Map<string, LXCOAuthApplication>();

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

export const lxcConfig: LXCConfig = {
  dxpDomains: () => toList(lookupConfig('com.liferay.lxc.dxp.domains')),
  dxpMainDomain: () => {
    let value = toList(lookupConfig('com.liferay.lxc.dxp.main.domain'))[0];

    if (!value) {
      value = toList(lookupConfig('com.liferay.lxc.dxp.mainDomain'))[0];
    }

    return value;
  },
  dxpProtocol: () => lookupConfig('com.liferay.lxc.dxp.server.protocol') as string | undefined,
  oauthApplication: (erc: string) => {
    let oauthApplication = oauthApplications.get(erc);

    if (oauthApplication) {
      return oauthApplication;
    }

    let ercs = lookupConfig('liferay.oauth.application.external.reference.codes');

    if (ercs) {
      ercs = Array.isArray(ercs) ? ercs : [ercs];
    }

    if (ercs && ercs.includes(erc)) {
      let applicationType = OAuthApplicationProfile.USER_AGENT;

      if (lookupConfig(`${erc}.oauth2.headless.server.client.id`)) {
        applicationType = OAuthApplicationProfile.HEADLESS_SERVER;
      }

      oauthApplication = {
        applicationType,
        audience: () => (applicationType === OAuthApplicationProfile.HEADLESS_SERVER ?
          lookupConfig(`${erc}.oauth2.headless.server.audience`) :
          lookupConfig(`${erc}.oauth2.user.agent.audience`)) as string | undefined,
        authorizationUri: () => lookupConfig(`${erc}.oauth2.authorization.uri`) as string | undefined,
        clientId: () => (applicationType === OAuthApplicationProfile.HEADLESS_SERVER ?
          lookupConfig(`${erc}.oauth2.headless.server.client.id`) :
          lookupConfig(`${erc}.oauth2.user.agent.client.id`)) as string | undefined,
        clientSecret: () => lookupConfig(`${erc}.oauth2.headless.server.client.secret`) as string | undefined,
        introspectionUri: () => lookupConfig(`${erc}.oauth2.introspection.uri`) as string | undefined,
        jwksUri: () => lookupConfig(`${erc}.oauth2.jwks.uri`) as string | undefined,
        scopes: () => (applicationType === OAuthApplicationProfile.HEADLESS_SERVER ?
          lookupConfig(`${erc}.oauth2.headless.server.scopes`) :
          lookupConfig(`${erc}.oauth2.user.agent.scopes`)) as string[] | undefined,
        tokenUri: () => lookupConfig(`${erc}.oauth2.token.uri`) as string | undefined,
      };

      oauthApplications.set(erc, oauthApplication);
    }

    return oauthApplication;
  },
};
