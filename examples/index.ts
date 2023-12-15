import {lxcConfig, lookupConfig} from '@rotty3000/config-node';

const dxpMainDomain = lxcConfig.dxpMainDomain();
console.log('dxpMainDomain', dxpMainDomain);

const application1 = lxcConfig.oauthApplication('lxc-config-json-1');

if (application1) {
  const oauthUserAgentScopes = application1.scopes();
  console.log('oauthUserAgentScopes ', oauthUserAgentScopes);
  const oauthHeadlessServerClientId = application1.clientId();
  console.log('oauthHeadlessServerClientId ', oauthHeadlessServerClientId);
}

const customConfig = lookupConfig('custom.configuration');
console.log('customConfig', customConfig);