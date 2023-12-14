import {lookupConfig, defaultConfig, addProvider, ConfigProvider} from '../src/config-node';
import {assert} from 'chai';
import sinon from 'sinon';
import fs from 'fs';
import os from 'os';

describe('lookupConfig', function () {
  let application_json_env;
  let com_liferay_lxc_dxp_maindomain_env;
  let initial_argv;

  beforeEach(() => {
    sinon.stub(process, 'cwd').returns('/cwd');
    sinon.stub(os, 'homedir').returns('/homedir');
    sinon.stub(require.main, 'path').value('/mainPath');

    application_json_env = process.env.APPLICATION_JSON;
    com_liferay_lxc_dxp_maindomain_env = process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN;
    initial_argv = process.argv;
  });

  afterEach(() => {
    process.env.APPLICATION_JSON = application_json_env;
    process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN = com_liferay_lxc_dxp_maindomain_env;
    process.argv = initial_argv;
    sinon.restore();
  });

  it('should return undefined when not present', function () {
    const value = lookupConfig('not_set');
    assert.isUndefined(value);
  });

  it('should return value from ~/.config-node-devtools.json', function () {
    sinon.stub(fs, 'existsSync').withArgs("/homedir/.config-node-devtools.json").returns(true);
    sinon.stub(fs, 'readFileSync').withArgs("/homedir/.config-node-devtools.json", 'utf8').returns('{"liferay.oauth.application.external.reference.codes": ["lxc-config-json-1", "lxc-config-json-2"]}');

    assert.deepEqual(
      lookupConfig('liferay.oauth.application.external.reference.codes'),
      ['lxc-config-json-1', 'lxc-config-json-2']
    );
  });

  it('should return value from process.args where format is --key=value', function () {
    process.argv.push('--this.is.a.test.key=from process.args');

    assert.equal(
      lookupConfig('this.is.a.test.key'),
      'from process.args'
    );
  });

  it('should return value from APPLICATION_JSON env containing inline JSON', function () {
    process.env.APPLICATION_JSON = '{"com.liferay.lxc.dxp.server.protocol": "from APPLICATION_JSON env"}';
    
    assert.equal(
      lookupConfig('com.liferay.lxc.dxp.server.protocol'),
      'from APPLICATION_JSON env'
    );
  });

  it('should return value from command line arg --application.json=<json> (inline JSON)', function () {
    process.argv.push('--application.json={"com.liferay.lxc.dxp.server.protocol": "from APPLICATION_JSON env"}');
    
    assert.equal(
      lookupConfig('com.liferay.lxc.dxp.server.protocol'),
      'from APPLICATION_JSON env'
    );
  });

  it('should return value from environment variable (with mangled name) containing the value', function () {
    process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN = 'from COM_LIFERAY_LXC_DXP_MAINDOMAIN env';
    
    assert.equal(
      lookupConfig('com.liferay.lxc.dxp.mainDomain'),
      'from COM_LIFERAY_LXC_DXP_MAINDOMAIN env'
    );
  });

  it('should return value from config trees (a.k.a. volume mounted ConfigMap/Secrets)', function () {
    defaultConfig('config.node.config.trees', ['/configtree']);
    sinon.stub(fs, 'existsSync').withArgs("/configtree/config.map.key").returns(true);
    sinon.stub(fs, 'readFileSync').withArgs("/configtree/config.map.key", 'utf8').returns('config map value\nanother config map value');

    assert.equal(
      lookupConfig('config.map.key'),
      'config map value\nanother config map value'
    );
  });

  it('should return value from config trees (a.k.a. volume mounted ConfigMap/Secrets) (via ENV)', function () {
    process.env.CONFIG_NODE_CONFIG_TREES = '/configtree2';
    sinon.stub(fs, 'existsSync').withArgs("/configtree2/config.map.key.2").returns(true);
    sinon.stub(fs, 'readFileSync').withArgs("/configtree2/config.map.key.2", 'utf8').returns('config map value 2');

    assert.equal(
      lookupConfig('config.map.key.2'),
      'config map value 2'
    );
  });

  it('should return value from application profile json in ${CWD}/config/application-{profile}.json', function () {
    defaultConfig('config.node.profiles.active', ['test']);
    sinon.stub(fs, 'readFileSync').withArgs("/cwd/config/application-test.json", 'utf8').returns('{"application.config.key": "application config value"}');

    assert.deepEqual(
      lookupConfig('application.config.key'),
      'application config value'
    );
  });

  it('should return value from application profile json in ${CWD}/application-{profile}.json', function () {
    defaultConfig('config.node.profiles.active', ['other']);
    sinon.stub(fs, 'readFileSync').withArgs("/cwd/application-other.json", 'utf8').returns('{"application.config.key.other": "application config value other"}');

    assert.deepEqual(
      lookupConfig('application.config.key.other'),
      'application config value other'
    );
  });

  it('should return value from application json in ${CWD}/config/application.json', function () {
    sinon.stub(fs, 'existsSync').withArgs("/cwd/config/application.json").returns(true);
    sinon.stub(fs, 'readFileSync').withArgs("/cwd/config/application.json", 'utf8').returns('{"application.config.key": "application config value"}');

    assert.deepEqual(
      lookupConfig('application.config.key'),
      'application config value'
    );
  });

  it('should return value from application json in ${CWD}/application.json', function () {
    sinon.stub(fs, 'existsSync').withArgs("/cwd/application.json").returns(true);
    sinon.stub(fs, 'readFileSync').withArgs("/cwd/application.json", 'utf8').returns('{"application.key": "application value"}');

    assert.deepEqual(
      lookupConfig('application.key'),
      'application value'
    );
  });

  it('should return value from application json packaged in the app ${main}/application.json', function () {
    sinon.stub(fs, 'existsSync').withArgs("/mainPath/application.json").returns(true);
    sinon.stub(fs, 'readFileSync').withArgs("/mainPath/application.json", 'utf8').returns('{"main.path.key": "main path value"}');

    assert.deepEqual(
      lookupConfig('main.path.key'),
      'main path value'
    );
  });

  it('should return value from programmer provided defaults (defaultConfig(string, string))', function () {
    defaultConfig('a.default.key', ['a default value']);

    assert.deepEqual(
      lookupConfig('a.default.key'),
      ['a default value']
    );
  });

  it('should return value from programmer provided defaults (defaultConfig(string, object))', function () {
    defaultConfig('a.default.key', {'key': 'a default value'});

    assert.deepEqual(
      lookupConfig('a.default.key'),
      '{"key":"a default value"}'
    );
  });

  it('should return value from a custom provider', function () {
    const customProvider: ConfigProvider = {
      description: "From a database, vault or whatever",
      priority: 100,
      get: (cache, key) => {
        if (key == 'custom.key') {
          return 'custom value';
        }
      },
      cacheInvalid() {
        return false;
      },
    };

    addProvider(customProvider);

    assert.deepEqual(
      lookupConfig('custom.key'),
      'custom value'
    );
  });
});
