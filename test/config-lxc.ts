import {clearCache} from '../src/config-node';
import {lxcConfig} from '../src/config-lxc';
import {assert, expect} from 'chai';

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
    if (!com_liferay_lxc_dxp_maindomain_env) {
      delete process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN;
    }
    else {
      process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN = com_liferay_lxc_dxp_maindomain_env;
    }
    if (!com_liferay_lxc_dxp_main_domain_env) {
      delete process.env.COM_LIFERAY_LXC_DXP_MAIN_DOMAIN;
    }
    else {
      process.env.COM_LIFERAY_LXC_DXP_MAIN_DOMAIN = com_liferay_lxc_dxp_main_domain_env;
    }
    if (!liferay_oauth_application_external_reference_codes) {
      delete process.env.LIFERAY_OAUTH_APPLICATION_EXTERNAL_REFERENCE_CODES;
    }
    else {
      process.env.LIFERAY_OAUTH_APPLICATION_EXTERNAL_REFERENCE_CODES = liferay_oauth_application_external_reference_codes;
    }
    clearCache();
  });

  it('should return main domain from both mainDomain or main.domain is specified (mainDomain)', function () {
    process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN = 'localhost:8080';

    assert.equal(
      lxcConfig.dxpMainDomain(),
      'localhost:8080'
    );
  });

  it('should return main domain from both mainDomain or main.domain is specified (main.domain)', function () {
    process.env.COM_LIFERAY_LXC_DXP_MAIN_DOMAIN = 'localhost:8080';

    assert.equal(
      lxcConfig.dxpMainDomain(),
      'localhost:8080'
    );
  });

  it('should handle ERCs that just have a single item', function () {
    process.env.LIFERAY_OAUTH_APPLICATION_EXTERNAL_REFERENCE_CODES = 'foo';

    assert.isDefined(lxcConfig.oauthApplication('foo'));
    assert.isUndefined(lxcConfig.oauthApplication('bar'));
  });

  it('should handle ERCs that have comma (,) delimited id list', function () {
    process.env.LIFERAY_OAUTH_APPLICATION_EXTERNAL_REFERENCE_CODES = 'foo,bar';

    assert.isDefined(lxcConfig.oauthApplication('foo'))
    assert.isDefined(lxcConfig.oauthApplication('bar'))
    assert.isUndefined(lxcConfig.oauthApplication('baz'))
  });

  it('should return array from "dxpDomains()" when there is one expected value', function () {
    process.env.COM_LIFERAY_LXC_DXP_DOMAINS = 'foo';

    let domains = lxcConfig.dxpDomains();
    expect(domains).to.include.members(['foo']);
  });

  it('should return array from "dxpDomains()" when there are two expected values', function () {
    process.env.COM_LIFERAY_LXC_DXP_DOMAINS = 'foo\nbar';

    let domains = lxcConfig.dxpDomains();
    expect(domains).to.include.members(['foo', 'bar']);
  });
});
