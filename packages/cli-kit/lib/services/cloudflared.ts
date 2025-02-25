import { Buffer } from 'node:buffer';
import { createWriteStream } from 'node:fs';
import process from 'node:process';
import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { Filesystem, Path, System } from '..';

type PlatformArchitectureType = 'arm' | 'arm64' | 'x64' | 'ia32';
type PlatformType = 'linux' | 'darwin' | 'win32';

type TargetNamesType = Partial<Record<PlatformArchitectureType, string>>;

const LINUX_TARGET_NAMES: TargetNamesType = {
  arm64: 'cloudflared-linux-arm64',
  arm: 'cloudflared-linux-arm',
  x64: 'cloudflared-linux-amd64',
  ia32: 'cloudflared-linux-386',
};

const MACOS_TARGET_NAMES: TargetNamesType = {
  arm64: 'cloudflared-darwin-arm64.tgz',
  x64: 'cloudflared-darwin-amd64.tgz',
};

const WINDOWS_TARGET_NAMES: TargetNamesType = {
  x64: 'cloudflared-windows-amd64.exe',
  ia32: 'cloudflared-windows-386.exe',
  arm64: 'cloudflared-windows-amd64.exe',
};

const TARGET_NAMES: Record<PlatformType, TargetNamesType> = {
  linux: LINUX_TARGET_NAMES,
  darwin: MACOS_TARGET_NAMES,
  win32: WINDOWS_TARGET_NAMES,
};

function composeDownloadUrl(platform: PlatformType, arch: PlatformArchitectureType): string {
  const releaseDownloadUrl = 'https://github.com/cloudflare/cloudflared/releases/download';
  const supportedVersion = '2024.11.1';
  const filename = TARGET_NAMES[platform][arch];

  return `${releaseDownloadUrl}/${supportedVersion}/${filename}`;
}

function resolveBinaryPath(platform: PlatformType): string {
  const rootDir = fileURLToPath(new URL('../'.repeat(2), import.meta.url));

  return Path.join(rootDir, 'bin', platform === 'win32' ? 'cloudflared.exe' : 'cloudflared');
}

function isPlatformSupported(platform: NodeJS.Platform): platform is PlatformType {
  return platform in TARGET_NAMES;
}

function isArchSupported(arch: NodeJS.Architecture, platform: PlatformType): arch is PlatformArchitectureType {
  return arch in TARGET_NAMES[platform];
}

async function downloadFromRelease(url: string, downloadPath: string) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`failed to download cloudflared: ${response.statusText}`);
  }

  const { body } = response;
  const fileWriteStream = createWriteStream(downloadPath, { mode: 0o664 });
  await pipeline(Readable.fromWeb(body!), fileWriteStream);
}

async function installForMacOs(url: string, destination: string): Promise<void> {
  await Filesystem.tapIntoTmp(async (tmpDir) => {
    const parentDir = Path.dirname(destination);
    const binaryName = Path.basename(destination);
    const downloadedFile = Path.resolve(tmpDir, `${binaryName}.tgz`);
    const decompressedFile = Path.resolve(tmpDir, `${binaryName}.gz`);

    await Filesystem.mkdir(parentDir);
    await Filesystem.mkdir(tmpDir);

    await downloadFromRelease(url, downloadedFile);

    await Filesystem.decompressGzip(downloadedFile, decompressedFile);
    await Filesystem.extractTar(decompressedFile, tmpDir, 0o755);

    await Filesystem.move(Path.resolve(tmpDir, binaryName), destination, { overwrite: true });
  });
}

async function installForLinux(url: string, destination: string): Promise<void> {
  const parentDir = Path.dirname(destination);
  await Filesystem.mkdir(parentDir);
  await downloadFromRelease(url, destination);
}

async function installForWindows(url: string, destination: string): Promise<void> {
  const parentDir = Path.dirname(destination);
  Filesystem.mkdir(parentDir);
  await downloadFromRelease(url, destination);
}

async function install(platform: PlatformType, downloadUrl: string, destinationPath: string) {
  switch (platform) {
    case 'darwin':
      await installForMacOs(downloadUrl, destinationPath);
      break;
    case 'linux':
      await installForLinux(downloadUrl, destinationPath);
      break;
    case 'win32':
      await installForWindows(downloadUrl, destinationPath);
      break;
  }
}

interface SystemType {
  platform: PlatformType;
  arch: PlatformArchitectureType;
}

class OutputStream extends Writable {
  private tunnelUrl: string | null = null;
  private tunnelError: string | null = null;

  private buffer = '';

  private static ErrorsRegex = [
    /failed to build quick tunnel request/,
    /failed to request quick Tunnel/,
    /failed to read quick-tunnel response/,
    /failed to parse quick Tunnel ID/,
    /Couldn't start tunnel/,
  ];

  write(chunk: unknown, encoding?: unknown, callback?: unknown) {
    if (!(chunk instanceof Buffer) && typeof chunk !== 'string') {
      return false;
    }

    this.buffer += chunk.toString();

    if (this.tunnelUrl === null) {
      this.tunnelUrl = this.extractTunnelUrl();
    }

    if (callback && typeof callback === 'function') {
      callback();
    }

    return true;
  }

  private extractTunnelUrl(): string | null {
    const regex = /https:\/\/(?!api\.trycloudflare\.com)\S+\.trycloudflare\.com/;

    return this.buffer.match(regex)?.[0] || null;
  }

  public extractError(): string | null {
    for (const errorRegex of OutputStream.ErrorsRegex) {
      if (errorRegex.test(this.buffer)) {
        return errorRegex.source;
      }
    }

    return null;
  }

  public getTunnelUrl() {
    return this.tunnelUrl;
  }

  public clearBuffer() {
    this.buffer = '';
  }
}

export class Cloudflared {
  private readonly bin: string;
  private readonly system: SystemType;
  private readonly output = new OutputStream();

  constructor() {
    const platform = process.platform;
    const arch = process.arch;

    if (!isPlatformSupported(platform)) {
      throw new Error(`unsupported platform: ${platform}`);
    }

    if (!isArchSupported(arch, platform)) {
      throw new Error(`unsupported architecture: ${arch}`);
    }

    this.bin = resolveBinaryPath(platform);

    this.system = { platform, arch };
  }

  public async tunnel(port: number, host = 'localhost') {
    const { bin, args } = this.composeTunnelingCommand(port, host);

    this.exec(bin, args);
  }

  public async install() {
    if (await Filesystem.isExecutable(this.bin)) {
      return;
    }

    const downloadUrl = composeDownloadUrl(this.system.platform, this.system.arch);
    await install(this.system.platform, downloadUrl, this.bin);
  }

  private composeTunnelingCommand(port: number, host = 'localhost') {
    return {
      bin: this.bin,
      args: ['tunnel', `--url=${host}:${port}`, '--no-autoupdate'],
    };
  }

  private async exec(bin: string, args: string[], maxRetries = 3) {
    if (this.getUrl()) {
      return;
    }

    if (maxRetries === 0) {
      throw new Error(this.output.extractError() ?? 'cloudflared failed for unknown reason');
    }

    this.output.clearBuffer();
    await System.exec(bin, args, {
      // Weird choice of cloudflared to write to stderr.
      stderr: this.output,
      errorHandler: async () => {
        await this.exec(bin, args, maxRetries - 1);
      },
    });
  }

  public getUrl(): string | null {
    return this.output.getTunnelUrl();
  }

  public getError(): string | null {
    return this.output.extractError();
  }
}
