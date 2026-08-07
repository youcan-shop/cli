import type { App } from '@/types';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildManifest } from '@/cli/services/deploy/manifest';

describe('buildManifest', () => {
  let root: string;

  const app = (): App => ({
    root,
    webs: [],
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
});
