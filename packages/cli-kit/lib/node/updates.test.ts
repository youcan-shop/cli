import process from 'node:process';
import { isLocalInstall, isNewer, packageManager } from '@/node/updates';
import { beforeEach, describe, expect, it } from 'vitest';

describe('isNewer', () => {
  it('compares semver numerically', () => {
    expect(isNewer('2.9.0', '2.8.3')).toBe(true);
    expect(isNewer('3.0.0', '2.99.99')).toBe(true);
    expect(isNewer('2.8.3', '2.8.3')).toBe(false);
    expect(isNewer('2.8.2', '2.8.3')).toBe(false);
    expect(isNewer('2.10.0', '2.9.0')).toBe(true);
  });

  it('treats missing segments as zero', () => {
    expect(isNewer('2.9', '2.8.3')).toBe(true);
    expect(isNewer('2.8', '2.8.0')).toBe(false);
  });
});

describe('packageManager', () => {
  beforeEach(() => {
    delete process.env.npm_config_user_agent;
  });

  it('prefers the user agent when launched through a package manager', () => {
    process.env.npm_config_user_agent = 'pnpm/9.15.9 npm/? node/v24';

    expect(packageManager('/usr/local/lib/node_modules/@youcan/cli-kit/dist/node/updates.js')).toBe('pnpm');
  });

  it('detects the installer from the module path', () => {
    expect(packageManager('/Users/x/Library/pnpm/global/5/.pnpm/@youcan+cli-kit@2.9.0/node_modules/@youcan/cli-kit/dist/node/updates.js')).toBe('pnpm');
    expect(packageManager('/Users/x/.config/yarn/global/node_modules/@youcan/cli-kit/dist/node/updates.js')).toBe('yarn');
    expect(packageManager('/usr/local/lib/node_modules/@youcan/cli/node_modules/@youcan/cli-kit/dist/node/updates.js')).toBe('npm');
  });
});

describe('isLocalInstall', () => {
  it('matches modules under the working directory', () => {
    expect(isLocalInstall('/work/shop/node_modules/.pnpm/@youcan+cli-kit@2.9.0/node_modules/@youcan/cli-kit/dist/node/updates.js', '/work/shop')).toBe(true);
    expect(isLocalInstall('/usr/local/lib/node_modules/@youcan/cli-kit/dist/node/updates.js', '/work/shop')).toBe(false);
  });
});
