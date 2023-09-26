import { execCreate } from '@youcan/cli-kit';

async function execCreateAppCli(development: boolean): Promise<void> {
  await execCreate('app', {
    moduleUrl: import.meta.url,
    development,
  });
}

export default execCreateAppCli;
