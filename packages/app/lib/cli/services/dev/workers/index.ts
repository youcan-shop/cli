import type { Cli, Services, Worker } from '@youcan/cli-kit';
import type DevCommand from '@/cli/commands/app/dev';
import type { App, Web } from '@/types';
import type { AppCommand } from '@/util/app-command';
import AppWorker from './app-worker';
import DevSessionWorker from './dev-session-worker';
import WebWorker from './web-worker';

export async function bootAppWorker(command: DevCommand, app: App) {
  const worker = new AppWorker(command, app);

  await worker.boot();

  return worker;
}

export async function bootDevSessionWorker(command: Cli.Command, app: App): Promise<Worker.Interface> {
  const worker = new DevSessionWorker(command, app);

  await worker.boot();

  return worker;
}

export async function bootWebWorker(command: AppCommand, app: App, web: Web, tunnelService?: Services.Cloudflared) {
  const worker = new WebWorker(command, app, web, tunnelService);

  await worker.boot();

  return worker;
}
