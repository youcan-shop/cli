import type { Cli } from '@youcan/cli-kit';
import ThemeExtensionWorker from './theme-extension-worker';
import type { App, Extension, ExtensionWorkerConstructor } from '@/types';

const EXTENSION_WORKERS: Record<string, ExtensionWorkerConstructor> = {
  theme: ThemeExtensionWorker,
};

export async function bootExtensionWorker(command: Cli.Command, app: App, extension: Extension) {
  const Ctor = EXTENSION_WORKERS[extension.config.type as keyof typeof EXTENSION_WORKERS];
  const worker = new Ctor(command, app, extension);

  await worker.boot();

  return worker;
}
