import {addProvider, clearCache, computeIfAbsent, ConfigProvider, defaultConfig, lookupConfig, setVerbose} from '../src/config-node';
import {assert} from 'chai';
import sinon from 'sinon';
import fs from 'node:fs';
import os from 'os';

describe('lookupConfig', function () {
  let application_json_env: string | undefined;
  let com_liferay_lxc_dxp_maindomain_env: string | undefined;
  let initial_argv: string[];

  beforeEach(() => {
    sinon.stub(process, 'cwd').returns('/cwd');
    sinon.stub(os, 'homedir').returns('/homedir');
    sinon.stub(require.main!, 'path').value('/mainPath');

    application_json_env = process.env.APPLICATION_JSON;
    com_liferay_lxc_dxp_maindomain_env = process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN;
    // copy it: tests push arguments, and restoring the same array by reference keeps those pushes
    initial_argv = [...process.argv];

    // the library looks up config.node.config.verbose when it is imported, which caches the real cwd and
    // homedir; start every test from a clean cache so a test never sees that or a previous test's leftovers
    clearCache();
  });

  afterEach(() => {
    if (!application_json_env) {
      delete process.env.APPLICATION_JSON;
    }
    else {
      process.env.APPLICATION_JSON = application_json_env;
    }
    if (!com_liferay_lxc_dxp_maindomain_env) {
      delete process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN;
    }
    else {
      process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN = com_liferay_lxc_dxp_maindomain_env;
    }
    process.argv = [...initial_argv];
    sinon.restore();
    clearCache();
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
    try {
      process.env.CONFIG_NODE_CONFIG_TREES = '/configtree2';
      sinon.stub(fs, 'existsSync').withArgs("/configtree2/config.map.key.2").returns(true);
      sinon.stub(fs, 'readFileSync').withArgs("/configtree2/config.map.key.2", 'utf8').returns('config map value 2');

      assert.equal(
        lookupConfig('config.map.key.2'),
        'config map value 2'
      );
    }
    finally {
      delete process.env.CONFIG_NODE_CONFIG_TREES;
    }
  });

  it('should return value from application profile json in ${CWD}/config/application-{profile}.json', function () {
    defaultConfig('config.node.profiles.active', ['test']);
    sinon.stub(fs, 'existsSync').withArgs('/cwd/config/application-test.json').returns(true);
    sinon.stub(fs, 'readFileSync').withArgs('/cwd/config/application-test.json', 'utf8').returns('{"application.config.key": "application config value"}');

    assert.deepEqual(
      lookupConfig('application.config.key'),
      'application config value'
    );
  });

  it('should return value from application profile json in ${CWD}/application-{profile}.json', function () {
    defaultConfig('config.node.profiles.active', ['other']);
    sinon.stub(fs, 'existsSync').withArgs('/cwd/application-other.json').returns(true);
    sinon.stub(fs, 'readFileSync').withArgs('/cwd/application-other.json', 'utf8').returns('{"application.config.key.other": "application config value other"}');

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

  it('should return interpolated value when the value contains placeholders in the form `${key}` where key is looked up', function () {
    defaultConfig('a.other.key', 'the value of a.other.key');
    defaultConfig('and.another', 'and the value of and.another');
    defaultConfig('a.default.key', {'key': 'here is: ${a.other.key}, ${and.another}'});

    assert.deepEqual(
      lookupConfig('a.default.key'),
      '{"key":"here is: the value of a.other.key, and the value of and.another"}'
    );
  });

  it('should return interpolated value from environment variables', function () {
    try {
      process.env.VAR_ONE = 'env var one value';
      process.env.VAR_TWO = 'env var two value';
      defaultConfig('config.node.config.trees', ["${VAR_ONE}", "${VAR_TWO}"]);

      assert.deepEqual(
        lookupConfig('config.node.config.trees'),
        ["env var one value", "env var two value"]
      );
    }
    finally {
      delete process.env.VAR_ONE;
      delete process.env.VAR_TWO;
    }
  });

  it('should interpolate placeholders recursively', function () {
    try {
      process.env.VAR_ONE = 'env var one value';
      process.env.VAR_TWO = 'env var two ${VAR_THREE}';
      process.env.VAR_THREE = 'references var three value';
      defaultConfig('config.node.config.trees', ["${VAR_ONE}", "${VAR_TWO}"]);

      assert.deepEqual(
        lookupConfig('config.node.config.trees'),
        ["env var one value", "env var two references var three value"]
      );
    }
    finally {
      delete process.env.VAR_ONE;
      delete process.env.VAR_TWO;
      delete process.env.VAR_THREE;
    }
  });

  it('should interpolate nested placeholders', function () {
    try {
      process.env.VAR_ONE = 'env var one value';
      process.env.VAR_TWO = 'ONE';
      defaultConfig('a.nested.placeholder', '${VAR_${VAR_TWO}}');

      assert.deepEqual(
        lookupConfig('a.nested.placeholder'),
        'env var one value'
      );
    }
    finally {
      delete process.env.VAR_ONE;
      delete process.env.VAR_TWO;
    }
  });

  it('should not fail if missing nested placeholders result in no value', function () {
    defaultConfig('a.missing.nested.placeholder', '${VAR_${VAR_TWO}}');

    assert.deepEqual(
      lookupConfig('a.missing.nested.placeholder'),
      '${VAR_${VAR_TWO}}'
    );
  });

  it('should return value from a custom provider', function () {
    setVerbose(true);

    const customProvider: ConfigProvider = {
      key: 'database',
      description: "From a database, vault or whatever",
      priority: 100,
      get: (key, providerCache) => computeIfAbsent(
        providerCache,
        key,
        () => key == 'custom.key' && 'custom value'
      ),
    };

    addProvider(customProvider);

    assert.deepEqual(
      lookupConfig('custom.key'),
      'custom value'
    );
  });

  it('should prefer a command line argument over a JSON file (CLI is the second highest source)', function () {
    sinon.stub(fs, 'existsSync').withArgs("/cwd/application.json").returns(true);
    sinon.stub(fs, 'readFileSync').withArgs("/cwd/application.json", 'utf8').returns('{"precedence.key": "from-file"}');
    process.argv.push('--precedence.key=from-cli');

    assert.equal(
      lookupConfig('precedence.key'),
      'from-cli'
    );
  });

  it('should prefer APPLICATION_JSON over an individual environment variable', function () {
    process.env.APPLICATION_JSON = '{"env.order.key": "from APPLICATION_JSON"}';
    process.env.ENV_ORDER_KEY = 'from env var';

    try {
      assert.equal(
        lookupConfig('env.order.key'),
        'from APPLICATION_JSON'
      );
    }
    finally {
      delete process.env.ENV_ORDER_KEY;
    }
  });

  it('should stop interpolating and leave the placeholder when a value references itself', function () {
    process.env.SELF_REFERENCING = '${SELF_REFERENCING}';

    try {
      assert.equal(
        lookupConfig('SELF_REFERENCING'),
        '${SELF_REFERENCING}'
      );
    }
    finally {
      delete process.env.SELF_REFERENCING;
    }
  });

  it('should not interpret $ replacement patterns in an interpolated value', function () {
    process.env.REPLACEMENT_PATTERN = '$&';

    try {
      defaultConfig('a.replacement.key', 'before-${REPLACEMENT_PATTERN}-after');

      assert.equal(
        lookupConfig('a.replacement.key'),
        'before-$&-after'
      );
    }
    finally {
      delete process.env.REPLACEMENT_PATTERN;
    }
  });

  it('should keep a JSON array of non strings instead of emptying it', function () {
    sinon.stub(fs, 'existsSync').withArgs("/cwd/application.json").returns(true);
    sinon.stub(fs, 'readFileSync').withArgs("/cwd/application.json", 'utf8').returns('{"numbers": [8080, 8081]}');

    assert.equal(
      lookupConfig('numbers'),
      '[8080,8081]'
    );
  });

  it('should not let an empty array stop the search at a lower precedence source', function () {
    // APPLICATION_JSON outranks an individual environment variable, so the empty list really is what the
    // search sees first
    process.env.APPLICATION_JSON = '{"empty.list": []}';
    process.env.EMPTY_LIST = 'from env var';

    try {
      assert.equal(
        lookupConfig('empty.list'),
        'from env var'
      );
    }
    finally {
      delete process.env.EMPTY_LIST;
    }
  });

  it('should honour a default set after the key has already been looked up', function () {
    assert.isUndefined(lookupConfig('late.default.key'));

    defaultConfig('late.default.key', 'late value');

    assert.equal(
      lookupConfig('late.default.key'),
      'late value'
    );
  });

  it('should not read a config tree entry outside of the configured tree', function () {
    defaultConfig('config.node.config.trees', ['/configtree']);
    sinon.stub(fs, 'existsSync').withArgs("/configtree/../../etc/passwd").returns(true);
    sinon.stub(fs, 'readFileSync').withArgs("/configtree/../../etc/passwd", 'utf8').returns('root:x:0:0');

    assert.isUndefined(
      lookupConfig('../../etc/passwd')
    );
  });

  it('should trim the trailing newline of a config tree value', function () {
    defaultConfig('config.node.config.trees', ['/configtree']);
    sinon.stub(fs, 'existsSync').withArgs("/configtree/trimmed.key").returns(true);
    sinon.stub(fs, 'readFileSync').withArgs("/configtree/trimmed.key", 'utf8').returns('trimmed value\n');

    assert.equal(
      lookupConfig('trimmed.key'),
      'trimmed value'
    );
  });

  it('should not resolve inherited object properties as configuration', function () {
    assert.isUndefined(lookupConfig('__proto__'));
    assert.isUndefined(lookupConfig('constructor'));
  });

  it('should return an explicit false or zero from a JSON file instead of skipping it', function () {
    sinon.stub(fs, 'existsSync').withArgs("/cwd/application.json").returns(true);
    sinon.stub(fs, 'readFileSync').withArgs("/cwd/application.json", 'utf8')
      .returns('{"a.flag": false, "a.retries": 0, "a.name": ""}');
    process.env.ENV_A_FLAG = 'env';
    process.env.ENV_A_RETRIES = 'env';

    try {
      // the file is the higher precedence source, so its falsy values have to win over the env vars below it
      assert.equal(lookupConfig('a.flag'), 'false');
      assert.equal(lookupConfig('a.retries'), '0');
    }
    finally {
      delete process.env.ENV_A_FLAG;
      delete process.env.ENV_A_RETRIES;
    }
  });

  it('should not split a comma containing value from a JSON file into a list', function () {
    sinon.stub(fs, 'existsSync').withArgs("/cwd/application.json").returns(true);
    sinon.stub(fs, 'readFileSync').withArgs("/cwd/application.json", 'utf8')
      .returns('{"greeting": "Hello, world", "db.url": "postgres://u:p@h/db?a=1,b=2"}');

    assert.equal(lookupConfig('greeting'), 'Hello, world');
    assert.equal(lookupConfig('db.url'), 'postgres://u:p@h/db?a=1,b=2');
  });

  it('should still split a comma delimited environment variable into a list', function () {
    process.env.SPLIT_ME = 'a,b';

    try {
      assert.deepEqual(lookupConfig('split.me'), ['a', 'b']);
    }
    finally {
      delete process.env.SPLIT_ME;
    }
  });

  it('should not consult the devtools file in production', function () {
    const nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    sinon.stub(fs, 'existsSync').withArgs("/homedir/.config-node-devtools.json").returns(true);
    sinon.stub(fs, 'readFileSync').withArgs("/homedir/.config-node-devtools.json", 'utf8')
      .returns('{"production.key": "from devtools"}');

    try {
      assert.isUndefined(lookupConfig('production.key'));
    }
    finally {
      if (nodeEnv === undefined) {
        delete process.env.NODE_ENV;
      }
      else {
        process.env.NODE_ENV = nodeEnv;
      }
    }
  });

  it('should not read a profile file outside of the working directory', function () {
    process.env.CONFIG_NODE_PROFILES_ACTIVE = '../../evil';
    sinon.stub(fs, 'existsSync').withArgs("/evil.json").returns(true);
    sinon.stub(fs, 'readFileSync').withArgs("/evil.json", 'utf8').returns('{"escaped.key": "escaped"}');

    try {
      assert.isUndefined(
        lookupConfig('escaped.key')
      );
    }
    finally {
      delete process.env.CONFIG_NODE_PROFILES_ACTIVE;
    }
  });

  it('should prefer each source over every source below it', function () {
    // highest first: the order the README documents
    const order = [
      'devtools', 'cli', 'cli-application-json', 'env-application-json', 'env', 'trees',
      'profile-config', 'profile', 'application-config', 'application', 'packaged'
    ];
    const envName = (key: string) => key.replace(/\./gi, '_').replace(/-/gi, '').toUpperCase();
    const jsonBlobs: Record<string, Record<string, string>> = {
      '/homedir/.config-node-devtools.json': {},
      '/cwd/config/application-test.json': {},
      '/cwd/application-test.json': {},
      '/cwd/config/application.json': {},
      '/cwd/application.json': {},
      '/mainPath/application.json': {}
    };
    const cliApplicationJson: Record<string, string> = {};
    const envApplicationJson: Record<string, string> = {};
    const treeValues: Record<string, string> = {};
    const expected = new Map<string, string>();
    const envKeys: string[] = [];

    process.env.CONFIG_NODE_PROFILES_ACTIVE = 'test';

    for (let i = 0; i < order.length - 1; i++) {
      const key = `probe.${order[i]}`;

      expected.set(key, order[i]);

      for (let j = i; j < order.length; j++) {
        const value = `from-${order[j]}`;

        switch (order[j]) {
          case 'devtools':
            jsonBlobs['/homedir/.config-node-devtools.json'][key] = value;
            break;
          case 'cli':
            process.argv.push(`--${key}=${value}`);
            break;
          case 'cli-application-json':
            cliApplicationJson[key] = value;
            break;
          case 'env-application-json':
            envApplicationJson[key] = value;
            break;
          case 'env':
            process.env[envName(key)] = value;
            envKeys.push(envName(key));
            break;
          case 'trees':
            treeValues[`/tree/${key}`] = value;
            break;
          case 'profile-config':
            jsonBlobs['/cwd/config/application-test.json'][key] = value;
            break;
          case 'profile':
            jsonBlobs['/cwd/application-test.json'][key] = value;
            break;
          case 'application-config':
            jsonBlobs['/cwd/config/application.json'][key] = value;
            break;
          case 'application':
            jsonBlobs['/cwd/application.json'][key] = value;
            break;
          case 'packaged':
            jsonBlobs['/mainPath/application.json'][key] = value;
            break;
        }
      }
    }

    defaultConfig('config.node.config.trees', ['/tree']);
    process.argv.push(`--application.json=${JSON.stringify(cliApplicationJson)}`);
    process.env.APPLICATION_JSON = JSON.stringify(envApplicationJson);

    const existsSync = sinon.stub(fs, 'existsSync');
    const readFileSync = sinon.stub(fs, 'readFileSync');

    Object.entries(jsonBlobs).forEach(([filePath, blob]) => {
      existsSync.withArgs(filePath).returns(true);
      readFileSync.withArgs(filePath, 'utf8').returns(JSON.stringify(blob));
    });

    Object.entries(treeValues).forEach(([treePath, value]) => {
      existsSync.withArgs(treePath).returns(true);
      readFileSync.withArgs(treePath, 'utf8').returns(value);
    });

    try {
      for (const [key, source] of expected) {
        assert.equal(
          lookupConfig(key),
          `from-${source}`,
          `expected ${source} to answer for ${key}`
        );
      }
    }
    finally {
      envKeys.forEach((envKey) => delete process.env[envKey]);
      delete process.env.CONFIG_NODE_PROFILES_ACTIVE;
    }
  });

  it('should not let a profile or a config tree redefine a protected key', function () {
    defaultConfig('config.node.profiles.active', 'test');
    defaultConfig('config.node.config.trees', ['/configtree']);
    sinon.stub(fs, 'existsSync')
      .withArgs("/cwd/application-test.json").returns(true)
      .withArgs("/configtree/config.node.config.trees").returns(true);
    sinon.stub(fs, 'readFileSync')
      .withArgs("/cwd/application-test.json", 'utf8')
      .returns('{"config.node.profiles.active": "hijacked", "config.node.config.verbose": "true"}')
      .withArgs("/configtree/config.node.config.trees", 'utf8')
      .returns('hijacked');

    assert.equal(lookupConfig('config.node.profiles.active'), 'test');
    assert.deepEqual(lookupConfig('config.node.config.trees'), ['/configtree']);
    assert.isUndefined(lookupConfig('config.node.config.verbose'));
  });

  it('should store a boolean or a number default as a string', function () {
    defaultConfig('a.boolean.default', false);
    defaultConfig('a.number.default', 0);

    assert.equal(lookupConfig('a.boolean.default'), 'false');
    assert.equal(lookupConfig('a.number.default'), '0');
  });

  it('should return undefined rather than throwing for a value that cannot be serialized', function () {
    const circular: any = {};
    circular.self = circular;
    defaultConfig('a.circular.value', circular);

    assert.isUndefined(lookupConfig('a.circular.value'));
  });

  it('should stop after a bounded number of substitutions when a value keeps growing', function () {
    process.env.GROWING = '${GROWING}x';
    defaultConfig('growing.key', '${GROWING}');

    try {
      const value = lookupConfig('growing.key');

      assert.isString(value);
      assert.isTrue((value as string).length < 1000, 'interpolation should stop growing');
    }
    finally {
      delete process.env.GROWING;
    }
  });

  it('should leave an alias of a self referencing value literal', function () {
    defaultConfig('self.ref', '${self.ref}');
    defaultConfig('alias.ref', '${self.ref}');

    assert.equal(lookupConfig('alias.ref'), '${self.ref}');
  });

  it('should report an unparseable JSON file by path without dumping its contents', function () {
    sinon.stub(fs, 'existsSync').withArgs("/cwd/application.json").returns(true);
    sinon.stub(fs, 'readFileSync').withArgs("/cwd/application.json", 'utf8')
      .returns('{"dxp.oauth.client.secret": "S3CRET", broken');

    const errors: string[] = [];
    const originalError = console.error;
    console.error = (...args: any[]) => errors.push(args.join(' '));

    try {
      assert.isUndefined(lookupConfig('dxp.oauth.client.secret'));
    }
    finally {
      console.error = originalError;
    }

    assert.isTrue(errors.some((line) => line.includes('/cwd/application.json')), 'the path is reported');
    assert.isFalse(errors.some((line) => line.includes('S3CRET')), 'the contents are not');
  });

  it('should strip one layer of matching quotes from a value', function () {
    sinon.stub(fs, 'existsSync').withArgs("/cwd/application.json").returns(true);
    sinon.stub(fs, 'readFileSync').withArgs("/cwd/application.json", 'utf8')
      .returns('{"a.double.quoted": "\\"quoted\\"", "a.single.quoted": "\'single\'"}');

    assert.equal(lookupConfig('a.double.quoted'), 'quoted');
    assert.equal(lookupConfig('a.single.quoted'), 'single');
  });

  it('should redact a sensitive value in verbose output and log the provider description', function () {
    sinon.stub(fs, 'existsSync').withArgs("/cwd/application.json").returns(true);
    sinon.stub(fs, 'readFileSync').withArgs("/cwd/application.json", 'utf8')
      .returns('{"a.client.secret": "S3CRET-VALUE", "a.plain.value": "plain-value"}');

    const debug: string[] = [];
    const originalDebug = console.debug;
    console.debug = (...args: any[]) => debug.push(args.join(' '));
    setVerbose(true);

    try {
      assert.equal(lookupConfig('a.client.secret'), 'S3CRET-VALUE');
      assert.equal(lookupConfig('a.plain.value'), 'plain-value');
    }
    finally {
      setVerbose(false);
      console.debug = originalDebug;
    }

    const secretLine = debug.find((line) => line.includes('a.client.secret'));
    const plainLine = debug.find((line) => line.includes('a.plain.value'));

    assert.isTrue(secretLine !== undefined && secretLine.includes('[redacted]'), 'the secret is redacted');
    assert.isFalse(debug.some((line) => line.includes('S3CRET-VALUE')), 'the secret never appears');
    assert.isTrue(plainLine !== undefined && plainLine.includes('plain-value'), 'the plain value is logged');
    assert.isTrue(plainLine !== undefined && /Provider \[[^\]]+: /.test(plainLine), 'the description is logged');
  });

  it('should swallow a provider that throws and keep the search going', function () {
    const cache = new Map<string, any>();

    assert.isUndefined(computeIfAbsent(cache, 'a.throwing.key', () => {
      throw new Error('boom');
    }));
    assert.isFalse(cache.has('a.throwing.key'), 'a failed computation is not cached');
  });

  it('should survive a provider that throws inside computeIfAbsent and label a provider without a description', function () {
    addProvider(
      {
        key: 'throwing-provider',
        priority: 350,
        get: (key, providerCache) => computeIfAbsent(providerCache, key, () => {
          throw new Error('boom');
        }),
      },
      {
        key: 'plain-provider',
        priority: 340,
        get: (key) => key === 'a.plain.provider.value' ? 'plain-provider-value' : undefined,
      }
    );

    const errors: string[] = [];
    const debug: string[] = [];
    const originalError = console.error;
    const originalDebug = console.debug;
    console.error = (...args: any[]) => errors.push(args.join(' '));
    console.debug = (...args: any[]) => debug.push(args.join(' '));
    setVerbose(true);

    try {
      defaultConfig('a.after.throwing', 'reached-the-next-provider');

      assert.equal(lookupConfig('a.after.throwing'), 'reached-the-next-provider');
      assert.equal(lookupConfig('a.plain.provider.value'), 'plain-provider-value');
    }
    finally {
      setVerbose(false);
      console.error = originalError;
      console.debug = originalDebug;
    }

    assert.isTrue(errors.some((line) => line.includes('boom')), 'the thrown error is logged in verbose mode');
    assert.isTrue(
      debug.some((line) => line.includes('Provider [plain-provider]')),
      'a provider without a description is labelled by its key'
    );
  });

  it('should ask every provider at the same priority', function () {
    addProvider({
      key: 'tied-priority',
      description: 'A provider that ties with the devtools file',
      priority: 11000,
      get: (key) => key === 'a.tied.value' ? 'from-the-tied-provider' : undefined,
    });

    assert.equal(lookupConfig('a.tied.value'), 'from-the-tied-provider');
  });

  it('should not cache a falsy value computed for a key', function () {
    const cache = new Map<string, any>();
    let calls = 0;
    const absent = () => {
      calls++;
    };

    assert.isUndefined(computeIfAbsent(cache, 'a.key', absent));
    assert.isUndefined(computeIfAbsent(cache, 'a.key', absent));
    assert.equal(calls, 2, 'a falsy answer is recomputed rather than cached');

    const value = computeIfAbsent(cache, 'a.key', () => {
      calls++;
      return 'cached-value';
    });

    assert.equal(value, 'cached-value');
    assert.equal(computeIfAbsent(cache, 'a.key', absent), 'cached-value', 'a truthy answer is cached');
    assert.equal(calls, 3);
  });

});
