import {clearCache, defaultConfig, lookupConfig} from '../src/config-node';
import {assert} from 'chai';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * The other test files stub the file system, which cannot tell a contained read from an escaping one. These
 * tests use a real directory so that containment, symlink resolution and the trailing newline of a volume
 * mounted file are exercised against the real fs.
 */
describe('config trees on a real directory', function () {
  let root: string;
  let tree: string;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'config-node-'));
    tree = path.join(root, 'tree');
    fs.mkdirSync(tree);
    fs.writeFileSync(path.join(tree, 'tree.real.plain.key'), 'plain value\n');
    fs.writeFileSync(path.join(tree, 'tree.real.csv.key'), 'one,two\n');
    fs.writeFileSync(path.join(tree, 'tree.real.multiline.key'), 'line one\nline two\n');
    fs.writeFileSync(path.join(root, 'tree.real.outside.key'), 'outside the tree\n');
  });

  after(() => {
    fs.rmSync(root, {recursive: true, force: true});
  });

  beforeEach(() => {
    clearCache();
    defaultConfig('config.node.config.trees', [tree]);
  });

  afterEach(() => {
    clearCache();
  });

  it('should read a value and drop the trailing newline', function () {
    assert.equal(lookupConfig('tree.real.plain.key'), 'plain value');
  });

  it('should keep the interior newlines of a multi-line value', function () {
    assert.equal(lookupConfig('tree.real.multiline.key'), 'line one\nline two');
  });

  it('should split a comma delimited tree value like an environment variable', function () {
    assert.deepEqual(lookupConfig('tree.real.csv.key'), ['one', 'two']);
  });

  it('should refuse a key that would escape the tree', function () {
    assert.isUndefined(lookupConfig('../tree.real.outside.key'));
    assert.isUndefined(lookupConfig('/etc/hostname'));
    assert.equal(lookupConfig('tree.real.plain.key'), 'plain value', 'a valid key still resolves');
  });

  it('should refuse a symlink inside the tree that points outside of it', function () {
    const linkPath = path.join(tree, 'tree.real.linked.key');

    try {
      fs.symlinkSync(path.join(root, 'tree.real.outside.key'), linkPath);
    }
    catch (e) {
      // creating symlinks needs a privilege Windows does not grant by default
      this.skip();
    }

    assert.isUndefined(lookupConfig('tree.real.linked.key'));
  });

  it('should follow the symlinks a volume mounted ConfigMap is built from', function () {
    // ConfigMap/Secret volumes are a directory of links into a `..data` directory inside the tree
    const dataDir = path.join(tree, '..data');
    const linkPath = path.join(tree, 'tree.real.mounted.key');

    try {
      fs.mkdirSync(dataDir, {recursive: true});
      fs.writeFileSync(path.join(dataDir, 'tree.real.mounted.key'), 'mounted value\n');
      fs.symlinkSync(path.join('..data', 'tree.real.mounted.key'), linkPath);
    }
    catch (e) {
      this.skip();
    }

    assert.equal(lookupConfig('tree.real.mounted.key'), 'mounted value');
  });
});
