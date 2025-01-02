import type { Readable, Writable } from 'stream';
import findProcess from 'find-process';
import tpu from 'tcp-port-used';
import { execa } from 'execa';

import type { ExecaChildProcess, ExecaError } from 'execa';

export interface ExecOptions {
  cwd?: string
  env?: { [key: string]: string | undefined }
  stdin?: Readable | 'inherit'
  stdout?: Writable | 'inherit'
  stderr?: Writable | 'inherit'
  stdio?: 'inherit'
  input?: string
  signal?: AbortSignal
  errorHandler?: (error: unknown | ExecaError) => Promise<void>
}

function buildExec(command: string, args: string[], options?: ExecOptions): ExecaChildProcess<string> {
  const env = options?.env ?? process.env;
  const commandProcess = execa(command, args, {
    env,
    cwd: options?.cwd,
    input: options?.input,
    stdio: options?.stdio,
    stdin: options?.stdin,
    signal: options?.signal,
    stdout: options?.stdout === 'inherit' ? 'inherit' : undefined,
    stderr: options?.stderr === 'inherit' ? 'inherit' : undefined,
    windowsHide: false,
  });

  return commandProcess;
}

export async function exec(command: string, args: string[], options?: ExecOptions): Promise<void> {
  const commandProcess = buildExec(command, args, options);

  if (options?.stderr && options.stderr !== 'inherit') {
    commandProcess.stderr?.pipe(options.stderr, { end: false });
  }

  if (options?.stdout && options.stdout !== 'inherit') {
    commandProcess.stdout?.pipe(options.stdout, { end: false });
  }

  let aborted = false;

  options?.signal?.addEventListener('abort', () => {
    const pid = commandProcess.pid;
    if (pid) {
      aborted = true;
    }
  });

  try {
    await commandProcess;
  }
  catch (err: unknown | ExecaError) {
    if (aborted) {
      return;
    }

    if (options?.errorHandler) {
      await options?.errorHandler(err);

      return;
    }

    throw err;
  }
}

export async function isPortAvailable(port: number): Promise<boolean> {
  return !await tpu.check(port);
}

export async function getNextAvailablePort(port: number): Promise<number> {
  if (await isPortAvailable(port)) {
    return port;
  }

  return await getNextAvailablePort(port + 1);
}

export async function getPortProcessName(port: number): Promise<string> {
  const info = await findProcess('port', port);

  return (info && info.length > 0) ? `(${info[0]?.name})` : '';
}

export async function killPortProcess(port: number): Promise<void> {
  const { killPortProcess: kill } = await import('kill-port-process');

  await kill(port);
}

export async function open(url: string): Promise<void> {
  const _open = await import('open');

  await _open.default(url);
}

export async function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000 * seconds);
  });
}

export type PackageManagerType =
  | 'pnpm'
  | 'npm'
  | 'yarn';

export function inferUserPackageManager(): PackageManagerType {
  const defaultPackageManager = 'npm';
  const packageManagersMap: Record<string, PackageManagerType> = {
    '^npm/.*': 'npm',
    '^pnpm/.*': 'pnpm',
    '^yarn/.*': 'yarn',
  };

  const packageManagerUserAgent = process.env.npm_config_user_agent as string;

  for (const key in packageManagersMap) {
    if (new RegExp(key).test(packageManagerUserAgent)) {
      return packageManagersMap[key];
    }
  }

  return defaultPackageManager;
}
