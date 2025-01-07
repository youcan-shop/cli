import type DevCommand from '@/cli/commands/app/dev';
import type { App, Extension, Web } from '@/types';
import type { AppCommand } from '@/util/app-command';
import type { Cli, Services, Worker } from '@youcan/cli-kit';
import AppWorker from './app-worker';
import ThemeExtensionWorker from './theme-extension-worker';
import TunnelWorker from './tunnel-worker';
import WebWorker from './web-worker';

export interface ExtensionWorkerCtor {
  new(command: Cli.Command, app: App, extension: Extension): Worker.Interface;
}

const EXTENSION_WORKERS: Record<string, ExtensionWorkerCtor> = {
  theme: ThemeExtensionWorker,
};

export async function bootAppWorker(command: DevCommand, app: App) {
  const worker = new AppWorker(command, app);

  await worker.boot();

  return worker;
}

export async function bootExtensionWorker(command: Cli.Command, app: App, extension: Extension) {
  const Ctor = EXTENSION_WORKERS[extension.config.type as keyof typeof EXTENSION_WORKERS];
  const worker = new Ctor(command, app, extension);

  await worker.boot();

  return worker;
}

export async function bootWebWorker(command: Cli.Command, app: App, web: Web, env: Record<string, string>) {
  const worker = new WebWorker(command, app, web, env);

  await worker.boot();

  return worker;
}

export async function bootTunnelWorker(command: AppCommand, app: App, tunnel: Services.Cloudflared) {
  const worker = new TunnelWorker(command, app, tunnel);

  await worker.boot();

  return worker;
}
