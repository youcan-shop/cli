import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import kleur from 'kleur';
import fetch from 'node-fetch';
import { Config, Path, System } from '..';
import { isDevelopment } from './context/local';

const PACKAGE = '@youcan/cli';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT = 2000;

const INSTALL_ARGS: Record<System.PackageManagerType, string[]> = {
  npm: ['install', '-g'],
  pnpm: ['add', '-g'],
  yarn: ['global', 'add'],
  bun: ['add', '-g'],
};

interface UpdateCheck {
  latest: string;
  checked_at: number;
}

export async function upgrade(current: string): Promise<void> {
  const modulePath = fileURLToPath(import.meta.url);

  if (
    process.env.CI
    || process.env.YC_CLI_ACCESS_TOKEN
    || process.env.YC_CLI_NO_AUTO_UPGRADE
    || process.env.YC_CLI_SKIP_UPDATE_CHECK
    || !process.stdout.isTTY
    || isDevelopment()
    || !isGlobalInstall(modulePath, Path.cwd())
  ) {
    return;
  }

  try {
    const check = await refresh();

    if (!check || !isNewer(check.latest, current)) {
      return;
    }

    const pm = packageManager(modulePath);
    const args = [...INSTALL_ARGS[pm], `${PACKAGE}@latest`];
    const command = kleur.cyan([pm, ...args].join(' '));

    if (major(check.latest) !== major(current)) {
      process.stderr.write(`\nNew major version of YouCan CLI available (${current} -> ${check.latest}). Run ${command} to upgrade.\n`);

      return;
    }

    process.stderr.write(`\nNew version of YouCan CLI available (${current} -> ${check.latest}). Upgrading with ${command}...\n`);

    try {
      await System.exec(pm, args, { stdout: 'inherit', stderr: 'inherit' });
    }
    catch {
      process.stderr.write(`Upgrade failed. Run ${command} to upgrade manually.\n`);
    }
  }
  catch {
  }
}

export function packageManager(modulePath: string): System.PackageManagerType {
  if (process.env.npm_config_user_agent) {
    return System.inferUserPackageManager();
  }

  const segments = modulePath.split(path.sep);

  if (segments.includes('.bun') || path.basename(process.execPath).startsWith('bun')) {
    return 'bun';
  }

  if (segments.includes('.pnpm') || segments.includes('pnpm')) {
    return 'pnpm';
  }

  if (segments.includes('.yarn') || segments.includes('yarn')) {
    return 'yarn';
  }

  return 'npm';
}

export function isGlobalInstall(modulePath: string, cwd: string): boolean {
  return modulePath.split(path.sep).includes('node_modules')
    && !modulePath.startsWith(path.join(cwd, 'node_modules') + path.sep);
}

export function isNewer(latest: string, current: string): boolean {
  const l = latest.split('.').map(Number);
  const c = current.split('.').map(Number);

  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    if ((l[i] ?? 0) !== (c[i] ?? 0)) {
      return (l[i] ?? 0) > (c[i] ?? 0);
    }
  }

  return false;
}

function major(version: string): string {
  return version.split('.')[0];
}

async function refresh(): Promise<UpdateCheck | null> {
  const manager = Config.manager({ projectName: 'youcan-cli' });
  const cached = manager.get('update_check') as UpdateCheck | undefined;

  if (cached && Date.now() - cached.checked_at < CHECK_INTERVAL) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(`https://registry.npmjs.org/${PACKAGE}/latest`, { signal: controller.signal });
    const { version } = await res.json() as { version: string };

    const check = { latest: version, checked_at: Date.now() };
    manager.set('update_check', check);

    return check;
  }
  catch {
    manager.set('update_check', { latest: cached?.latest ?? '0.0.0', checked_at: Date.now() });

    return cached ?? null;
  }
  finally {
    clearTimeout(timer);
  }
}
