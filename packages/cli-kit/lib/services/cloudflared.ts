import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from 'node:fs';

import {pipeline} from 'node:stream/promises'

import {createWriteStream} from 'node:fs'
import { basename } from "node:path";
import { Readable } from "node:stream";
import { Filesystem } from "..";

type PlatformArchitectureType = 'arm' | 'arm64' | 'x64' | 'ia32';
type PlatformType = 'linux' | 'darwin' | 'win32';

type TargetNamesType = Partial<Record<PlatformArchitectureType, string>>;

const LINUX_TARGET_NAMES: TargetNamesType = {
    arm64: 'cloudflared-linux-arm64',
    arm: 'cloudflared-linux-arm',
    x64: 'cloudflared-linux-amd64',
    ia32: 'cloudflared-linux-386',
  }
  
  const MACOS_TARGET_NAMES: TargetNamesType = {
    arm64: 'cloudflared-darwin-arm64.tgz',
    x64: 'cloudflared-darwin-amd64.tgz',
  }
  
  const WINDOWS_TARGET_NAMES: TargetNamesType = {
    x64: 'cloudflared-windows-amd64.exe',
    ia32: 'cloudflared-windows-386.exe',
    arm64: 'cloudflared-windows-amd64.exe',
  }
  
  const TARGET_NAMES: Record<PlatformType, TargetNamesType> = {
    linux: LINUX_TARGET_NAMES,
    darwin: MACOS_TARGET_NAMES,
    win32: WINDOWS_TARGET_NAMES,
  }

function composeDownloadUrl(platform: PlatformType, arch: PlatformArchitectureType): string {
    const releaseDownloadUrl = 'https://github.com/cloudflare/cloudflared/releases/download';
    const supportedVersion = '2024.11.1';
    const filename = TARGET_NAMES[platform][arch];

    return `${releaseDownloadUrl}/${supportedVersion}/${filename}`;
}

function composeDestinationPath(platform: PlatformType): string {
    const parentDir = fileURLToPath(new URL('..', import.meta.url));

    return path.join(parentDir, 'bin', platform === 'win32' ? 'cloudflared.exe' : 'cloudflared');
}

function isPlatformSupported(platform: NodeJS.Platform): platform is PlatformType {
    return platform in TARGET_NAMES;
}

function isArchSupported(arch: NodeJS.Architecture, platform: PlatformType): arch is PlatformArchitectureType {
    return arch in TARGET_NAMES[platform];
}

async function downloadFromRelease(url: string, downloadPath: string) { // <-- todo: rename this.
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) throw new Error(`Failed to download cloudflared: ${response.statusText}`);
    const { body } = response;
    const fileWriteStream = createWriteStream(downloadPath, { mode: 0o777 });
    await pipeline(Readable.fromWeb(body!), fileWriteStream);
}

async function installForMacOs(url: string, destination: string): Promise<void> {    
    const parentDir = dirname(destination);
    const tmpDir = path.resolve(parentDir, 'tmp');
    const executableName = basename(destination);
    const downloadedFile = path.resolve(tmpDir, `${executableName}.tgz`);
    const decompressedFile = path.resolve(tmpDir, `${executableName}.gz`);

    Filesystem.mkdir(parentDir);
    Filesystem.mkdir(tmpDir);

    await downloadFromRelease(url, downloadedFile);

    Filesystem.decompress(downloadedFile, decompressedFile);
    Filesystem.extractTar(decompressedFile, tmpDir);

    Filesystem.move(path.resolve(tmpDir, executableName), executableName, { overwrite: true });
    Filesystem.rm(tmpDir);
}

async function installForLinux(url: string, destination: string): Promise<void> {
    const parentDir = dirname(destination);
    Filesystem.mkdir(parentDir);
    await downloadFromRelease(url, destination);
}

async function installForWindows(url: string, destination: string): Promise<void> { 
    const parentDir = dirname(destination);
    Filesystem.mkdir(parentDir);
    await downloadFromRelease(url, destination);
}

export async function install(platform = process.platform, arch = process.arch) {
    if (!isPlatformSupported(platform))
        throw new Error(`Unsupported platform: ${platform}`);

    if (!isArchSupported(arch, platform))
        throw new Error(`Unsupported architecture: ${arch}`);

    const downloadUrl = composeDownloadUrl(platform, arch);
    const destinationPath = composeDestinationPath(platform);

    if (await Filesystem.isExecutable(destinationPath)) {
        return ;
    }

    switch (platform) {
        case 'darwin':
            installForMacOs(downloadUrl, destinationPath);
            break;
        case 'linux':
            installForLinux(downloadUrl, destinationPath);
            break;
        case 'win32':
            installForWindows(downloadUrl, destinationPath);
    }
}
