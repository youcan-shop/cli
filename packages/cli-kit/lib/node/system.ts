import type { Readable, Writable } from 'stream';
import type { ExecaChildProcess } from 'execa';
import { execa } from 'execa';

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
