import {clearCache} from '../src/config-node';
import {lxcConfig, OAuthApplicationProfile} from '../src/config-lxc';
import {assert, expect} from 'chai';

describe('lxcConfig', function () {
  let com_liferay_lxc_dxp_domains_env: string | undefined;
  let com_liferay_lxc_dxp_maindomain_env: string | undefined;
  let com_liferay_lxc_dxp_main_domain_env: string | undefined;
  let com_liferay_lxc_dxp_server_protocol_env: string | undefined;
  let liferay_oauth_application_external_reference_codes: string | undefined;

  beforeEach(() => {
    com_liferay_lxc_dxp_domains_env = process.env.COM_LIFERAY_LXC_DXP_DOMAINS;
    com_liferay_lxc_dxp_maindomain_env = process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN;
    com_liferay_lxc_dxp_main_domain_env = process.env.COM_LIFERAY_LXC_DXP_MAIN_DOMAIN;
    com_liferay_lxc_dxp_server_protocol_env = process.env.COM_LIFERAY_LXC_DXP_SERVER_PROTOCOL;
    liferay_oauth_application_external_reference_codes = process.env.LIFERAY_OAUTH_APPLICATION_EXTERNAL_REFERENCE_CODES;
  });

  afterEach(() => {
    if (!com_liferay_lxc_dxp_domains_env) {
      delete process.env.COM_LIFERAY_LXC_DXP_DOMAINS;
    }
    else {
      process.env.COM_LIFERAY_LXC_DXP_DOMAINS = com_liferay_lxc_dxp_domains_env;
    }
    if (!com_liferay_lxc_dxp_server_protocol_env) {
      delete process.env.COM_LIFERAY_LXC_DXP_SERVER_PROTOCOL;
    }
    else {
      process.env.COM_LIFERAY_LXC_DXP_SERVER_PROTOCOL = com_liferay_lxc_dxp_server_protocol_env;
    }
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

  it('should take the first entry of a multi-line main domain', function () {
    process.env.COM_LIFERAY_LXC_DXP_MAIN_DOMAIN = 'localhost:8080\nother.example.com';

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

  it('should return undefined rather than throw when no ERCs are configured', function () {
    delete process.env.LIFERAY_OAUTH_APPLICATION_EXTERNAL_REFERENCE_CODES;

    // An ERC no other test resolves: results are cached per ERC.
    assert.doesNotThrow(() => lxcConfig.oauthApplication('unlisted'));
    assert.isUndefined(lxcConfig.oauthApplication('unlisted'));
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

  it('should return an empty array from "dxpDomains()" rather than throw when unset', function () {
    delete process.env.COM_LIFERAY_LXC_DXP_DOMAINS;

    assert.deepEqual(lxcConfig.dxpDomains(), []);
  });

  it('should handle a comma delimited "dxpDomains()" (as delivered by an env var)', function () {
    process.env.COM_LIFERAY_LXC_DXP_DOMAINS = 'foo,bar';

    assert.deepEqual(lxcConfig.dxpDomains(), ['foo', 'bar']);
  });

  it('should trim "dxpDomains()" entries and drop the empty ones', function () {
    process.env.COM_LIFERAY_LXC_DXP_DOMAINS = ' foo \r\n\n bar \n';

    assert.deepEqual(lxcConfig.dxpDomains(), ['foo', 'bar']);
  });

  it('should return undefined from "dxpMainDomain()" and "dxpProtocol()" when unset', function () {
    delete process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN;
    delete process.env.COM_LIFERAY_LXC_DXP_MAIN_DOMAIN;
    delete process.env.COM_LIFERAY_LXC_DXP_SERVER_PROTOCOL;

    assert.isUndefined(lxcConfig.dxpMainDomain());
    assert.isUndefined(lxcConfig.dxpProtocol());
  });

  it('should reduce a comma delimited "dxpProtocol()" to its first value', function () {
    process.env.COM_LIFERAY_LXC_DXP_SERVER_PROTOCOL = 'https,http';

    assert.equal(lxcConfig.dxpProtocol(), 'https');
  });

  it('should ignore whitespace around ERC list entries', function () {
    process.env.LIFERAY_OAUTH_APPLICATION_EXTERNAL_REFERENCE_CODES = 'erc-one, erc-two';

    assert.isDefined(lxcConfig.oauthApplication('erc-one'));
    assert.isDefined(lxcConfig.oauthApplication('erc-two'));
  });

  it('should read the user agent client secret for a user agent application', function () {
    process.env.LIFERAY_OAUTH_APPLICATION_EXTERNAL_REFERENCE_CODES = 'agentic';
    process.env.AGENTIC_OAUTH2_USER_AGENT_CLIENT_SECRET = 'user-agent-secret';
    process.env.AGENTIC_OAUTH2_HEADLESS_SERVER_CLIENT_SECRET = 'headless-server-secret';

    try {
      const application = lxcConfig.oauthApplication('agentic')!;

      assert.equal(application.applicationType, OAuthApplicationProfile.USER_AGENT);
      assert.equal(application.clientSecret(), 'user-agent-secret');
    }
    finally {
      delete process.env.AGENTIC_OAUTH2_USER_AGENT_CLIENT_SECRET;
      delete process.env.AGENTIC_OAUTH2_HEADLESS_SERVER_CLIENT_SECRET;
    }
  });

  it('should read the headless server settings for a headless server application', function () {
    process.env.LIFERAY_OAUTH_APPLICATION_EXTERNAL_REFERENCE_CODES = 'service';
    process.env.SERVICE_OAUTH2_HEADLESS_SERVER_CLIENT_ID = 'headless-client-id';
    process.env.SERVICE_OAUTH2_HEADLESS_SERVER_CLIENT_SECRET = 'headless-server-secret';
    process.env.SERVICE_OAUTH2_USER_AGENT_CLIENT_SECRET = 'user-agent-secret';

    try {
      const application = lxcConfig.oauthApplication('service')!;

      assert.equal(application.applicationType, OAuthApplicationProfile.HEADLESS_SERVER);
      assert.equal(application.clientId(), 'headless-client-id');
      assert.equal(application.clientSecret(), 'headless-server-secret');
    }
    finally {
      delete process.env.SERVICE_OAUTH2_HEADLESS_SERVER_CLIENT_ID;
      delete process.env.SERVICE_OAUTH2_HEADLESS_SERVER_CLIENT_SECRET;
      delete process.env.SERVICE_OAUTH2_USER_AGENT_CLIENT_SECRET;
    }
  });

  it('should always return application scopes as an array', function () {
    process.env.LIFERAY_OAUTH_APPLICATION_EXTERNAL_REFERENCE_CODES = 'scoped';
    process.env.SCOPED_OAUTH2_USER_AGENT_SCOPES = 'scope.one';

    try {
      assert.deepEqual(lxcConfig.oauthApplication('scoped')!.scopes(), ['scope.one']);
    }
    finally {
      delete process.env.SCOPED_OAUTH2_USER_AGENT_SCOPES;
    }
  });

  it('should not serve a stale application type after a cache flush', function () {
    process.env.LIFERAY_OAUTH_APPLICATION_EXTERNAL_REFERENCE_CODES = 'flushed';

    try {
      assert.equal(lxcConfig.oauthApplication('flushed')!.applicationType, OAuthApplicationProfile.USER_AGENT);

      process.env.FLUSHED_OAUTH2_HEADLESS_SERVER_CLIENT_ID = 'headless-client-id';
      clearCache();

      assert.equal(lxcConfig.oauthApplication('flushed')!.applicationType, OAuthApplicationProfile.HEADLESS_SERVER);
    }
    finally {
      delete process.env.FLUSHED_OAUTH2_HEADLESS_SERVER_CLIENT_ID;
    }
  });
});
