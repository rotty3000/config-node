import {dxpConfig, initConfig} from '../src/lxc-config';
import {assert} from 'chai';

describe('lxcConfig', function () {
  it('should return main domain from both mainDomain or main.domain is specified', function () {
    process.env.COM_LIFERAY_LXC_DXP_MAIN_DOMAIN = 'localhost:8080';
    process.env.COM_LIFERAY_LXC_DXP_MAINDOMAIN = 'localhost:8080';
    
    assert.equal(
      dxpConfig['com.liferay.lxc.dxp.main.domain'](),
      'localhost:8080'
    );

    assert.equal(
      dxpConfig['com.liferay.lxc.dxp.mainDomain'](),
      'localhost:8080'
    );
  });

  it('should handle ERCs that just have a single item', function () {
    process.env.LIFERAY_OAUTH_APPLICATION_EXTERNAL_REFERENCE_CODES = 'foo'
    
    assert.isNotNull(initConfig['foo'])
  });

  it('should handle ERCs that have common delimited id list', function () {
    process.env.LIFERAY_OAUTH_APPLICATION_EXTERNAL_REFERENCE_CODES = 'foo,bar'
    
    assert.isNotNull(initConfig['foo'])
    assert.isNotNull(initConfig['bar'])
  });
});
