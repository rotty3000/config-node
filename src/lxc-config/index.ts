import {lookupConfig} from '../config-node';

// type definitions
type ConfigValueFunctionType = () => string | string[] | undefined;

export type DXPConfigKey = 'com.liferay.lxc.dxp.domains' | 'com.liferay.lxc.dxp.main.domain' | 'com.liferay.lxc.dxp.mainDomain' |
  'com.liferay.lxc.dxp.server.protocol';
export type InitConfigKey = 'oauth2.authorization.uri' | 'oauth2.headless.server.audience' | 'oauth2.headless.server.client.id' |
  'oauth2.headless.server.client.secret' | 'oauth2.headless.server.scopes' | 'oauth2.introspection.uri' | 'oauth2.jwks.uri' |
  'oauth2.token.uri' | 'oauth2.user.agent.audience' | 'oauth2.user.agent.client.id' | 'oauth2.user.agent.scopes';

export type DXPConfigType = Record<DXPConfigKey, ConfigValueFunctionType>;
export type InitConfigType = Record<InitConfigKey, ConfigValueFunctionType>;

export const dxpConfig: DXPConfigType = {
  'com.liferay.lxc.dxp.domains': () => lookupConfig('com.liferay.lxc.dxp.domains'),
  'com.liferay.lxc.dxp.main.domain': () => lookupConfig('com.liferay.lxc.dxp.main.domain'),
  'com.liferay.lxc.dxp.mainDomain': () => lookupConfig('com.liferay.lxc.dxp.mainDomain'),
  'com.liferay.lxc.dxp.server.protocol': () => lookupConfig('com.liferay.lxc.dxp.server.protocol'),
};

export const initConfig = new Map<string, InitConfigType>();

const ercs = lookupConfig('liferay.oauth.application.external.reference.codes') as string[];

if (ercs) {
  ercs.forEach(
    erc => {
      console.log(`processing ${erc}`);
      initConfig.set(erc, {
        'oauth2.authorization.uri': () => lookupConfig(`${erc}.oauth2.authorization.uri`),
        'oauth2.headless.server.audience': () => lookupConfig(`${erc}.oauth2.headless.server.audience`),
        'oauth2.headless.server.client.id': () => lookupConfig(`${erc}.oauth2.headless.server.client.id`),
        'oauth2.headless.server.client.secret': () => lookupConfig(`${erc}.oauth2.headless.server.client.secret`),
        'oauth2.headless.server.scopes': () => lookupConfig(`${erc}.oauth2.headless.server.scopes`),
        'oauth2.introspection.uri': () => lookupConfig(`${erc}.oauth2.introspection.uri`),
        'oauth2.jwks.uri': () => lookupConfig(`${erc}.oauth2.jwks.uri`),
        'oauth2.token.uri': () => lookupConfig(`${erc}.oauth2.token.uri`),
        'oauth2.user.agent.audience': () => lookupConfig(`${erc}.oauth2.user.agent.audience`),
        'oauth2.user.agent.client.id': () => lookupConfig(`${erc}.oauth2.user.agent.client.id`),
        'oauth2.user.agent.scopes': () => lookupConfig(`${erc}.oauth2.user.agent.scopes`),
      });
    }
  );
}

