import fs from 'node:fs';
import process from 'node:process';
import { Cli } from '@youcan/cli-kit';

process.on('uncaughtException', (err) => {
  fs.writeSync(process.stderr.fd, `${err.stack}\n`);
  process.exit(1);
});

const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
signals.forEach((signal) => {
  process.on(signal, () => {
    process.exit(1);
  });
});

async function execCli(development: boolean): Promise<void> {
  await Cli.exec({
    moduleUrl: import.meta.url,
    development,
  });
}

export default execCli;
