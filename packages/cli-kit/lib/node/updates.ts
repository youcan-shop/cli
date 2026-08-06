import process from 'node:process';
import kleur from 'kleur';
import fetch from 'node-fetch';
import { Config, System } from '..';

const PACKAGE = '@youcan/cli';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT = 2000;

interface UpdateCheck {
  latest: string;
  checked_at: number;
}

export async function notify(current: string): Promise<void> {
  if (process.env.CI || process.env.YC_CLI_SKIP_UPDATE_CHECK || !process.stdout.isTTY) {
    return;
  }

  try {
    const check = await refresh();

    if (check && isNewer(check.latest, current)) {
      banner(current, check.latest);
    }
  }
  catch {
  }
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

async function refresh(): Promise<UpdateCheck | null> {
  const manager = Config.manager({ projectName: 'youcan-cli' });
  const cached = manager.get('update_check') as UpdateCheck | undefined;

  if (cached && Date.now() - cached.checked_at < CHECK_INTERVAL) {
    return cached;
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

function banner(current: string, latest: string): void {
  const commands: Record<System.PackageManagerType, string> = {
    npm: `npm i -g ${PACKAGE}`,
    pnpm: `pnpm add -g ${PACKAGE}`,
    yarn: `yarn global add ${PACKAGE}`,
  };

  const command = commands[System.inferUserPackageManager()];

  const lines: Array<[string, string]> = [
    [`Update available! ${current} \u2192 ${latest}`, `Update available! ${kleur.red(current)} \u2192 ${kleur.green(latest)}`],
    [`Run ${command} to update.`, `Run ${kleur.cyan(command)} to update.`],
  ];

  const width = Math.max(...lines.map(([plain]) => plain.length));
  const border = kleur.yellow;

  process.stderr.write([
    '',
    border(`\u256D${'\u2500'.repeat(width + 4)}\u256E`),
    ...lines.map(([plain, colored]) => `${border('\u2502')}  ${colored}${' '.repeat(width - plain.length)}  ${border('\u2502')}`),
    border(`\u2570${'\u2500'.repeat(width + 4)}\u256F`),
    '',
  ].join('\n'));
}
