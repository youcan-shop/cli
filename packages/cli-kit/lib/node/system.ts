import type { Readable, Writable } from 'stream';
import type { ExecaChildProcess } from 'execa';
import { execa } from 'execa';
import tpu from 'tcp-port-used';
import findProcess from 'find-process';

export interface ExecOptions {
  cwd?: string
  env?: { [key: string]: string | undefined }
  stdin?: Readable | 'inherit'
  stdout?: Writable | 'inherit'
  stderr?: Writable | 'inherit'
  stdio?: 'inherit'
  input?: string
  signal?: AbortSignal
  errorHandler?: (error: unknown) => Promise<void>
}

function buildExec(command: string, args: string[], options?: ExecOptions): ExecaChildProcess<string> {
  const env = options?.env ?? process.env;
  
  const commandProcess = execa(command, args, {
    env,
    cwd: options?.cwd,
    input: options?.input,
    stdio: options?.stdio,
    stdin: options?.stdin,
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
  catch (err: any) {
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

export type PackageManagerType =
  | 'pnpm'
  | 'npm'
  | 'yarn'

export function inferUserPackageManager(): PackageManagerType { 
    const defaultPm = 'npm';
    const pmsMap: Record<string, PackageManagerType> = {
    '^npm/.*': 'npm',
    '^pnpm/.*': 'pnpm',
    '^yarn/.*': 'yarn',
  };

  let pmUserAgent = process.env['npm_config_user_agent'] as string;

  for (const key in pmsMap) {
    if (new RegExp(key).test(pmUserAgent)) {
        return pmsMap[key];
    }
  }

  return defaultPm;
}
