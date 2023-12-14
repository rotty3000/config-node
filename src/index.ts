import {dxpConfig, initConfig} from './lxc-config';
import {lookupConfig} from './lookupConfig';

const domains = dxpConfig['com.liferay.lxc.dxp.domains']();
console.log('domains', domains);

const mainDomain = dxpConfig['com.liferay.lxc.dxp.mainDomain']();
console.log('mainDomain', mainDomain);

const serverProtocol = dxpConfig['com.liferay.lxc.dxp.server.protocol']();
console.log('serverProtocol', serverProtocol);

const application1 = initConfig.get('lxc-config-json-1');

if (application1) {
  const authorizationUri = application1['oauth2.authorization.uri']();
  console.log('authorizationUri', authorizationUri);
  const headlessServerClientId = application1['oauth2.headless.server.client.id']();
  console.log('headlessServerClientId', headlessServerClientId);
  const headlessServerSecret = application1['oauth2.headless.server.client.secret']();
  console.log('headlessServerSecret', headlessServerSecret);
  const headlessServerAudience = application1['oauth2.headless.server.audience']();
  console.log('headlessServerAudience', headlessServerAudience);
  const headlessServerScopes = application1['oauth2.headless.server.scopes']();
  console.log('headlessServerScopes', headlessServerScopes);
  const introspectionUri = application1['oauth2.introspection.uri']();
  console.log('introspectionUri', introspectionUri);
  const jwksIri = application1['oauth2.jwks.uri']();
  console.log('jwksIri', jwksIri);
  const tokenUri = application1['oauth2.token.uri']();
  console.log('tokenUri', tokenUri);
  const userAgentAudience = application1['oauth2.user.agent.audience']();
  console.log('userAgentAudience', userAgentAudience);
  const userAgentClientId = application1['oauth2.user.agent.client.id']();
  console.log('userAgentClientId', userAgentClientId);
  const userAgentScopes = application1['oauth2.user.agent.scopes']();
  console.log('userAgentScopes', userAgentScopes);
}

const application2 = initConfig.get('lxc-config-json-2');

if (application2) {
  const authorizationUri = application2['oauth2.authorization.uri']();
  console.log('authorizationUri', authorizationUri);
  const headlessServerClientId = application2['oauth2.headless.server.client.id']();
  console.log('headlessServerClientId', headlessServerClientId);
  const headlessServerSecret = application2['oauth2.headless.server.client.secret']();
  console.log('headlessServerSecret', headlessServerSecret);
  const headlessServerAudience = application2['oauth2.headless.server.audience']();
  console.log('headlessServerAudience', headlessServerAudience);
  const headlessServerScopes = application2['oauth2.headless.server.scopes']();
  console.log('headlessServerScopes', headlessServerScopes);
  const introspectionUri = application2['oauth2.introspection.uri']();
  console.log('introspectionUri', introspectionUri);
  const jwksIri = application2['oauth2.jwks.uri']();
  console.log('jwksIri', jwksIri);
  const tokenUri = application2['oauth2.token.uri']();
  console.log('tokenUri', tokenUri);
  const userAgentAudience = application2['oauth2.user.agent.audience']();
  console.log('userAgentAudience', userAgentAudience);
  const userAgentClientId = application2['oauth2.user.agent.client.id']();
  console.log('userAgentClientId', userAgentClientId);
  const userAgentScopes = application2['oauth2.user.agent.scopes']();
  console.log('userAgentScopes', userAgentScopes);
}

const customConfig = lookupConfig('custom.configuration');
console.log('customConfig', customConfig);