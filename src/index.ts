import {dxpConfig, initConfig} from './lxc-config';
import {lookupConfig} from './config-node';

const mainDomain = dxpConfig['com.liferay.lxc.dxp.mainDomain']();
console.log('mainDomain', mainDomain);

const application1 = initConfig.get('lxc-config-json-1');

if (application1) {
  const headlessServerClientId = application1['oauth2.headless.server.client.id']();
  console.log('headlessServerClientId', headlessServerClientId);
}

const customConfig = lookupConfig('custom.configuration');
console.log('customConfig', customConfig);