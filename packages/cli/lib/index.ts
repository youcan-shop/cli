import fs from 'node:fs';
import process from 'node:process';
import { Cli, System } from '@youcan/cli-kit';

process.on('uncaughtException', (err) => {
  fs.writeSync(process.stderr.fd, `${err.stack}\n`);
  process.exit(1);
});

const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
signals.forEach((signal) => {
  process.once(signal, async () => {
    try {
      await System.killPortProcess(3000);
      setTimeout(() => {
        console.log('Shutting down...');
        process.exit(0);
      }, 100);
    }
    catch (err) {
      process.exit(0);
    }
  });
});

async function execCli(development: boolean): Promise<void> {
  await Cli.exec({
    moduleUrl: import.meta.url,
    development,
  });
}

export default execCli;
