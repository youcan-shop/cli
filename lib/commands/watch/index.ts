import { cwd } from 'node:process';
import chokidar from 'chokidar';
import { log, notice } from '../../utils/system/log';
import type { WatchEvents, WatchOptions } from './types';

async function watch({ cwd }: WatchOptions) {
  chokidar.watch(cwd, {
    ignored: [/node_modules/, /dist/],
    persistent: true,
    ignoreInitial: true,
  }).on('all', (e: WatchEvents, path: string) => {
    const relativePath = path.replace(cwd, '');

    switch (e) {
      case 'change':
        console.log(log(
          notice('info', 'content update'),
          relativePath,
        ));
        break;
      case 'add':
        console.log(log(
          notice('success', 'New file'),
          relativePath,
        ));
        break;
      default: console.log('unknown', relativePath);
    }
  });
}

export default {
  setup(cli: any) {
    cli.command('watch', 'Running watch mode')
      .action(watch({
        cwd: cwd(),
      }));
  },
};
