import {lookupConfig} from '../config-node';

export enum OAuthApplicationProfile {
  HEADLESS_SERVER,
  USER_AGENT
}

export interface LXCOAuthApplication {
  readonly applicationType: OAuthApplicationProfile;
  readonly audience: () => string;
  readonly authorizationUri: () => string;
  readonly clientId: () => string;
  readonly clientSecret: () => string;
  readonly introspectionUri: () => string;
  readonly jwksUri: () => string;
  readonly scopes: () => string[];
  readonly tokenUri: () => string;
}

export interface LXCConfig {
  readonly dxpDomains: () => string[];
  readonly dxpMainDomain: () => string;
  readonly dxpProtocol: () => string;
  readonly oauthApplication: (erc: string) => LXCOAuthApplication;
}

const oauthApplications = new Map<string, LXCOAuthApplication>();

export const lxcConfig: LXCConfig = {
  dxpDomains: () => (lookupConfig('com.liferay.lxc.dxp.domains') as string).split('\n'),
  dxpMainDomain: () => {
    let value = lookupConfig('com.liferay.lxc.dxp.main.domain') as string;
    if (!value) {
      value = lookupConfig('com.liferay.lxc.dxp.mainDomain') as string;
    }
    return value;
  },
  dxpProtocol: () => lookupConfig('com.liferay.lxc.dxp.server.protocol') as string,
  oauthApplication: (erc: string) => {
    let oauthApplication = oauthApplications.get(erc);

    if (oauthApplication) {
      return oauthApplication;
    }

    let ercs = lookupConfig('liferay.oauth.application.external.reference.codes');

    if (ercs) {
      ercs = Array.isArray(ercs) ? ercs : [ercs];
    }

    if (ercs.includes(erc)) {
      let applicationType = OAuthApplicationProfile.USER_AGENT;

      if (lookupConfig(`${erc}.oauth2.headless.server.client.id`)) {
        applicationType = OAuthApplicationProfile.HEADLESS_SERVER;
      }

      oauthApplication = {
        applicationType,
        audience: () => (applicationType === OAuthApplicationProfile.HEADLESS_SERVER ?
          lookupConfig(`${erc}.oauth2.headless.server.audience`) :
          lookupConfig(`${erc}.oauth2.user.agent.audience`)) as string,
        authorizationUri: () => lookupConfig(`${erc}.oauth2.authorization.uri`) as string,
        clientId: () => (applicationType === OAuthApplicationProfile.HEADLESS_SERVER ?
          lookupConfig(`${erc}.oauth2.headless.server.client.id`) :
          lookupConfig(`${erc}.oauth2.user.agent.client.id`)) as string,
        clientSecret: () => lookupConfig(`${erc}.oauth2.headless.server.client.secret`) as string,
        introspectionUri: () => lookupConfig(`${erc}.oauth2.introspection.uri`) as string,
        jwksUri: () => lookupConfig(`${erc}.oauth2.jwks.uri`) as string,
        scopes: () => (applicationType === OAuthApplicationProfile.HEADLESS_SERVER ?
          lookupConfig(`${erc}.oauth2.headless.server.scopes`) :
          lookupConfig(`${erc}.oauth2.user.agent.scopes`)) as string[],
        tokenUri: () => lookupConfig(`${erc}.oauth2.token.uri`) as string,
      };

      oauthApplications.set(erc, oauthApplication);
    }

    return oauthApplication;
  },
};
