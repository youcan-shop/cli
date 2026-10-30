import type { App } from '@/types';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildManifest } from '@/cli/services/deploy/manifest';

describe('buildManifest', () => {
  let root: string;

  const app = (): App => ({
    root,
    webs: [],
    configFilename: 'youcan.app.json',
    extensions: [
      {
        root: path.join(root, 'extensions', 'rating'),
        config: { id: 'ext_1', handle: 'rating', type: 'theme', name: 'rating' },
      },
    ],
    config: {
      id: 'app_1',
      handle: 'test-app',
      name: 'Test App',
      app_url: 'https://app.example.com',
      redirect_urls: [],
      oauth: { client_id: '1', scopes: ['*'] },
    },
  });

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'manifest-test-'));
    await mkdir(path.join(root, 'extensions', 'rating', 'blocks'), { recursive: true });
    await mkdir(path.join(root, 'extensions', 'rating', 'assets'), { recursive: true });

    await writeFile(path.join(root, 'extensions', 'rating', 'blocks', 'star.liquid'), '<div></div>');
    await writeFile(path.join(root, 'extensions', 'rating', 'assets', 'widget.js'), 'js');
    await writeFile(path.join(root, 'extensions', 'rating', 'assets', 'logo.png'), Buffer.from([0x89, 0x50, 0x4E, 0x47]));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('collects every extension file', async () => {
    const { manifest } = await buildManifest(app());

    const names = manifest.extensions[0].files.map(f => `${f.type}/${f.name}.${f.extension}`);

    expect(names).toContain('blocks/star.liquid');
    expect(names).toContain('assets/widget.js');
    expect(names).toContain('assets/logo.png');
  });

  it('rejects nested files with a clear message', async () => {
    await mkdir(path.join(root, 'extensions', 'rating', 'assets', 'img'), { recursive: true });
    await writeFile(path.join(root, 'extensions', 'rating', 'assets', 'img', 'logo.png'), 'png');

    await expect(buildManifest(app())).rejects.toThrow('assets/img/logo.png');
  });

  it('hashes file contents with sha256', async () => {
    const { manifest } = await buildManifest(app());

    const block = manifest.extensions[0].files.find(f => f.name === 'star')!;

    expect(block.hash).toBe(crypto.createHash('sha256').update('<div></div>').digest('hex'));
    expect(block.size).toBe('<div></div>'.length);
  });

  it('hashes binary files without corruption', async () => {
    const { manifest } = await buildManifest(app());

    const logo = manifest.extensions[0].files.find(f => f.name === 'logo')!;

    expect(logo.hash).toBe(
      crypto.createHash('sha256').update(Buffer.from([0x89, 0x50, 0x4E, 0x47])).digest('hex'),
    );
    expect(logo.size).toBe(4);
  });

  it('is deterministic for the same tree', async () => {
    const first = await buildManifest(app());
    const second = await buildManifest(app());

    expect(first.manifest.extensions).toEqual(second.manifest.extensions);
  });

  it('collects blobs with local paths for upload', async () => {
    const { manifest, blobs } = await buildManifest(app());

    expect(blobs).toHaveLength(manifest.extensions[0].files.length);
    expect(blobs.every(b => b.path.startsWith(root))).toBe(true);
  });

  it('carries the app config', async () => {
    const { manifest } = await buildManifest(app());

    expect(manifest.app).toMatchObject({ name: 'Test App', handle: 'test-app', scopes: ['*'] });
    expect(manifest.extensions[0]).toMatchObject({ id: 'ext_1', handle: 'rating', type: 'theme' });
  });

  it('rejects unknown extension types', async () => {
    const unknown = app();
    unknown.extensions[0].config.type = 'checkout_ui';

    await expect(buildManifest(unknown)).rejects.toThrow('checkout_ui');
  });

  it('keeps config out of theme extensions', async () => {
    const { manifest } = await buildManifest(app());

    expect(manifest.extensions[0]).not.toHaveProperty('config');
  });

  describe('web pixel extensions', () => {
    const pixelRoot = () => path.join(root, 'extensions', 'pixel');

    const pixelApp = (): App => ({
      ...app(),
      extensions: [{
        root: pixelRoot(),
        config: {
          id: 'ext_2',
          handle: 'pixel',
          type: 'web_pixel',
          name: 'pixel',
          runtime_context: 'strict',
          customer_privacy: { analytics: true, marketing: true, preferences: false, sale_of_data: 'enabled' },
          settings: { type: 'object', fields: { account_id: { name: 'Account ID', type: 'single_line_text_field' } } },
        },
      }],
    });

    beforeEach(async () => {
      await mkdir(path.join(pixelRoot(), 'src'), { recursive: true });
      await writeFile(path.join(pixelRoot(), 'src', 'helper.js'), 'export const label = name => "pixel " + name;');
      await writeFile(
        path.join(pixelRoot(), 'src', 'index.js'),
        `import { label } from './helper.js';\nregister(({ analytics }) => analytics.subscribe('all_events', e => console.log(label(e.name))));`,
      );
    });

    it('bundles the source into one assets file', async () => {
      const { manifest, blobs } = await buildManifest(pixelApp());
      const [file] = manifest.extensions[0].files;

      expect(manifest.extensions[0].files).toHaveLength(1);
      expect(file).toMatchObject({ type: 'assets', name: 'pixel', extension: 'js' });
      expect(blobs[0].path).toBe(path.join(pixelRoot(), 'dist', 'pixel.js'));
    });

    it('inlines imports into a classic script', async () => {
      await buildManifest(pixelApp());

      const bundle = await readFile(path.join(pixelRoot(), 'dist', 'pixel.js'), 'utf8');

      expect(bundle).not.toMatch(/\bimport\b|\bexport\b/);
      expect(bundle).toContain('pixel ');
    });

    it('carries the pixel config only', async () => {
      const { manifest } = await buildManifest(pixelApp());

      expect(Object.keys(manifest.extensions[0].config ?? {}).sort()).toEqual(['customer_privacy', 'runtime_context', 'settings']);
    });
  });
});
