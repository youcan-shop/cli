import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createReadStream, existsSync, mkdir, mkdirSync } from 'node:fs';

import {finished} from 'node:stream/promises'
import {pipeline} from 'node:stream/promises'
import * as tar from 'tar'
import FsExtra from 'fs-extra';

import { createGunzip, createUnzip, unzip } from 'node:zlib'

import {createWriteStream} from 'node:fs'
import { basename } from "node:path";
import { Readable } from "node:stream";

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
    const tmpPath = path.resolve(parentDir, 'tmp');
    const executableName = basename(destination);
    const downloadFile = path.resolve(tmpPath, `${executableName}.tgz`);
    const unzipedFile = path.resolve(tmpPath, `${executableName}.gz`);

    // create base dirs
    if (!existsSync(parentDir)) mkdirSync(parentDir, { mode: 0o777, recursive: true });
    if (!existsSync(tmpPath)) mkdirSync(tmpPath, { mode: 0o777, recursive: true });

    await downloadFromRelease(url, downloadFile);

    const unzip = createGunzip();

    await pipeline(
        createReadStream(downloadFile) ,
         unzip,
        createWriteStream(unzipedFile, { mode: 0o777 }),
    );

    await tar.extract({ cwd: tmpPath, file: unzipedFile });
    await FsExtra.move(path.resolve(tmpPath, 'cloudflared'), destination, { overwrite: true });
    await FsExtra.rm(tmpPath, { recursive: true });
}

async function installForLinux(url: string, destination: string): Promise<void> { 
    const parentDir = dirname(destination);
    await downloadFromRelease(url, destination);
}

function installTryCloudflare(platform = process.platform, arch = process.arch) { // double check the name here --->
    if (!isPlatformSupported(platform))
        throw new Error(`Unsupported platform: ${platform}`);

    if (!isArchSupported(arch, platform))
        throw new Error(`Unsupported architecture: ${arch}`);

    const downloadUrl = composeDownloadUrl(platform, arch);
    const destinationPath = composeDestinationPath(platform);

    switch (platform) {
        case 'darwin':
            installForMacOs(downloadUrl, destinationPath);
            break;
        case 'linux':
            installForLinux();
            break;
        case 'win32':
        default:
    }
}

installTryCloudflare()
