import {dxpConfig, initConfig} from './lxc-config';
import {lookupConfig} from './config-node';

const dxpMainDomain = dxpConfig['com.liferay.lxc.dxp.main.domain']();
console.log('dxpMainDomain', dxpMainDomain);

const application1 = initConfig.get('lxc-config-json-1');

if (application1) {
  const outhUserAgentScopes = application1['oauth2.user.agent.scopes']();
  console.log('outhUserAgentScopes ', outhUserAgentScopes);
  const outhHeadlessServerClientId = application1['oauth2.headless.server.client.id']();
  console.log('outhHeadlessServerClientId ', outhHeadlessServerClientId);
}

const customConfig = lookupConfig('custom.configuration');
console.log('customConfig', customConfig);