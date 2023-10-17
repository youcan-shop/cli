import type { Cli } from '@youcan/cli-kit';
import ThemeExtensionWorker from './theme-extension-worker';
import type { App, Extension } from '@/types';

const EXTENSION_WORKERS = {
  theme: ThemeExtensionWorker,
};

export async function bootExtensionWorker(command: Cli.Command, app: App, extension: Extension) {
  const worker = EXTENSION_WORKERS[extension.config.type as keyof typeof EXTENSION_WORKERS];

  return await worker.boot(command, app, extension);
}
