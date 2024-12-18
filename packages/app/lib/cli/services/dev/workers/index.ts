import type { Cli, Worker } from '@youcan/cli-kit';
import ThemeExtensionWorker from './theme-extension-worker';
import WebWorker from './web-worker';
import AppWorker from './app-worker';
import type { App, Extension, Web } from '@/types';
import type DevCommand from '@/cli/commands/app/dev';

export interface ExtensionWorkerCtor {
  new(command: Cli.Command, app: App, extension: Extension): Worker.Interface
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
