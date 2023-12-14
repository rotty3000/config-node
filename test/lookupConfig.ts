import {lookupConfig} from '../src/lookupConfig';
import {assert} from 'chai';

describe('lookupConfig', function () {
  let application_json_env;
  let com_liferay_lxc_dxp_maindomain_env;
  let initial_argv;

  beforeEach(() => {
    application_json_env = process.env.APPLICATION_JSON;
    com_liferay_lxc_dxp_maindomain_env = process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN;
    initial_argv = process.argv;
  });

  afterEach(() => {
    process.env.APPLICATION_JSON = application_json_env;
    process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN = com_liferay_lxc_dxp_maindomain_env;
    process.argv = initial_argv;
  });

  it('should return undefined when not present', function () {
    const value = lookupConfig('not_set');
    console.log("undefined test value", value);
    assert.isUndefined(value);
  });

  it('should return value from process.args where key is prefixed with -- and key (mangled) and value are separated by equal (--key=value)', function () {
    process.argv.push('--THIS_IS_A_TEST_KEY=from process.args');

    assert.equal(
      lookupConfig('this.is.a.test.key'),
      'from process.args'
    );
  });

  it('should return value from APPLICATION_JSON env containing inline JSON', function () {
    process.env.APPLICATION_JSON = '{"com.liferay.lxc.dxp.server.protocol": "from APPLICATION_JSON env"}';
    
    assert.equal(
      lookupConfig('com.liferay.lxc.dxp.server.protocol'),
      'from APPLICATION_JSON env')
  });

  it('should return value from COM_LIFERAY_LXC_DXP_MAINDOMAIN env containing the value', function () {
    process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN = 'from COM_LIFERAY_LXC_DXP_MAINDOMAIN env';
    
    assert.equal(
      lookupConfig('com.liferay.lxc.dxp.mainDomain'),
      'from COM_LIFERAY_LXC_DXP_MAINDOMAIN env')
  });
});
