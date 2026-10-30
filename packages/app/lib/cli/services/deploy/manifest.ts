import type { Buffer } from 'node:buffer';
import type { App, Blob, Extension, Manifest, ManifestExtension, ManifestFile } from '@/types';
import { Crypto, Filesystem, Path, System } from '@youcan/cli-kit';
import { build } from 'rolldown';

const THEME_FILE_TYPES = ['assets', 'blocks', 'locales', 'snippets'];
const WEB_PIXEL_CONFIG = ['runtime_context', 'customer_privacy', 'settings'];

export async function buildManifest(app: App): Promise<{ manifest: Manifest; blobs: Blob[] }> {
  const blobs: Blob[] = [];
  const extensions: ManifestExtension[] = [];

  for (const extension of app.extensions) {
    extensions.push(await extensionManifest(extension, blobs));
  }

  const manifest: Manifest = {
    app: {
      name: app.config.name,
      handle: app.config.handle,
      app_url: app.config.app_url,
      redirect_urls: app.config.redirect_urls,
      scopes: app.config.oauth?.scopes ?? [],
      webhooks: app.config.webhooks ?? [],
    },
    extensions,
  };

  const commit = await currentCommit(app.root);
  if (commit) {
    manifest.source = { commit };
  }

  return { manifest, blobs };
}

type ExtensionContent = Pick<ManifestExtension, 'files' | 'config'>;

async function extensionManifest(extension: Extension, blobs: Blob[]): Promise<ManifestExtension> {
  const content = extension.config.type === 'web_pixel'
    ? await webPixelContent(extension, blobs)
    : await themeContent(extension, blobs);

  return {
    id: extension.config.id as string,
    handle: (extension.config.handle as string | undefined) ?? Path.basename(extension.root),
    type: extension.config.type,
    ...content,
  };
}

async function themeContent(extension: Extension, blobs: Blob[]): Promise<ExtensionContent> {
  const files: ManifestFile[] = [];

  for (const type of THEME_FILE_TYPES) {
    const dir = Path.resolve(extension.root, type);
    if (!await Filesystem.exists(dir)) {
      continue;
    }

    const paths = await Filesystem.glob(Path.join(dir, '**/*'), { nodir: true, dot: false });

    const nested = paths.filter(p => Path.relative(dir, p).includes(Path.sep));
    if (nested.length) {
      throw new Error(
        `Subdirectories are not supported in extension folders, flatten these files:\n`
        + `${nested.map(p => `  - ${Path.relative(extension.root, p)}`).join('\n')}`,
      );
    }

    for (const path of paths.sort()) {
      files.push(await manifestFile(type, path, blobs));
    }
  }

  return { files };
}

async function webPixelContent(extension: Extension, blobs: Blob[]): Promise<ExtensionContent> {
  const output = Path.resolve(extension.root, 'dist', 'pixel.js');

  await build({
    input: Path.resolve(extension.root, 'src', 'index.js'),
    output: { file: output, format: 'iife', minify: true },
    logLevel: 'silent',
  });

  return {
    files: [await manifestFile('assets', output, blobs)],
    config: Object.fromEntries(Object.entries(extension.config).filter(([key]) => WEB_PIXEL_CONFIG.includes(key))),
  };
}

async function manifestFile(type: string, path: string, blobs: Blob[]): Promise<ManifestFile> {
  const content = await Filesystem.readFile(path, {}) as Buffer;
  const hash = Crypto.sha256(content).toString('hex');
  const name = Path.basename(path);
  const extname = Path.extname(name);

  blobs.push({ type, hash, path });

  return {
    type,
    name: name.slice(0, name.length - extname.length),
    extension: extname.slice(1),
    size: content.byteLength,
    hash,
  };
}

async function currentCommit(cwd: string): Promise<string | null> {
  try {
    return (await System.output('git', ['rev-parse', 'HEAD'], { cwd })).trim() || null;
  }
  catch {
    return null;
  }
}
