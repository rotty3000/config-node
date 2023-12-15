import {dxpConfig, initConfig} from '../src/lxc-config';
import {clearCache} from '../src/config-node';
import {assert} from 'chai';

describe('lxcConfig', function () {
  let com_liferay_lxc_dxp_maindomain_env;
  let com_liferay_lxc_dxp_main_domain_env;
  let liferay_oauth_application_external_reference_codes;

  beforeEach(() => {
    com_liferay_lxc_dxp_maindomain_env = process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN;
    com_liferay_lxc_dxp_main_domain_env = process.env.COM_LIFERAY_LXC_DXP_MAIN_DOMAIN;
    liferay_oauth_application_external_reference_codes = process.env.LIFERAY_OAUTH_APPLICATION_EXTERNAL_REFERENCE_CODES;
  });

  afterEach(() => {
    process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN = com_liferay_lxc_dxp_maindomain_env;
    process.env.COM_LIFERAY_LXC_DXP_MAIN_DOMAIN = com_liferay_lxc_dxp_main_domain_env;
    process.env.LIFERAY_OAUTH_APPLICATION_EXTERNAL_REFERENCE_CODES = liferay_oauth_application_external_reference_codes;
    clearCache();
  });

  it('should return main domain from both mainDomain or main.domain is specified', function () {
    process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN = 'localhost:8080';
    process.env.COM_LIFERAY_LXC_DXP_MAIN_DOMAIN = 'localhost:8080';

    assert.equal(
      dxpConfig['com.liferay.lxc.dxp.mainDomain'](),
      'localhost:8080'
    );

    assert.equal(
      dxpConfig['com.liferay.lxc.dxp.main.domain'](),
      'localhost:8080'
    );
  });

  it('should handle ERCs that just have a single item', function () {
    process.env.LIFERAY_OAUTH_APPLICATION_EXTERNAL_REFERENCE_CODES = 'foo'
    
    assert.isNotNull(initConfig['foo'])
  });

  it('should handle ERCs that have comma (,) delimited id list', function () {
    process.env.LIFERAY_OAUTH_APPLICATION_EXTERNAL_REFERENCE_CODES = 'foo,bar'
    
    assert.isNotNull(initConfig['foo'])
    assert.isNotNull(initConfig['bar'])
  });
});
