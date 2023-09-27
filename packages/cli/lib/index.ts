import fs from 'fs';
import { exec } from '@youcan/cli-kit/dist/node/cli';

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
  await exec({
    moduleUrl: import.meta.url,
    development,
  });
}

export default execCli;
