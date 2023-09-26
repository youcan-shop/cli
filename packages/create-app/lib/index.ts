import { Cli } from '@youcan/cli-kit';

async function execCreateAppCli(development: boolean): Promise<void> {
  await Cli.execCreate('app', {
    moduleUrl: import.meta.url,
    development,
  });
}

export default execCreateAppCli;
