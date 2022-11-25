import type { IncomingMessage, ServerResponse } from 'http';
import { createServer } from 'http';
import { exit } from 'process';
import prompts from 'prompts';
import type { TokenResponse } from './types';
import type { CLI, CommandDefinition } from '@/cli/commands/types';
import config from '@/config';
import openLink from '@/utils/system/openLink';
import stdout from '@/utils/system/stdout';
import { post } from '@/utils/http';
import writeToFile from '@/utils/system/writeToFile';
import messages from '@/config/messages';
import { getPidByPort, isPortAvailable } from '@/utils/network';
import { kill } from '@/utils/system';
import { LoadingSpinner } from '@/utils/common';

/**
 * Spin up a local server to handle the OAuth redirect. Times out after 10 seconds.
 * @returns A promise that resolves when the code is received.
*/
function captureAuthorization(): Promise<string> {
  return new Promise((resolve, reject) => {
    let timeOut: ReturnType<typeof setTimeout>;

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const { url } = req;
      const code = url?.split('=')[1] || '';

      if (!code)
        reject(new Error('authorization code is required.'));

      res.end('You can close this window now.');
      clearTimeout(timeOut);

      server.close();
      resolve(code);
    });

    server.listen(config.OAUTH_CALLBACK_PORT, () => {
      timeOut = setTimeout(() => {
        reject(new Error('Timeout'));
      }, config.OAUTH_CALLBACK_SERVER_TIMEOUT);
    });
  });
}

/**
 * Exchange code for access token
 * @param authorizationCode string
 */
async function exchangeAuthCode(authorizationCode: string): Promise<string> {
  const formParams: Record<string, any> = {
    grant_type: 'authorization_code',
    client_id: config.OAUTH_CLIENT_ID,
    client_secret: config.OAUTH_CLIENT_SECRET,
    redirect_uri: config.OAUTH_CALLBACK_URL,
    code: authorizationCode,
  };

  const res = await post<TokenResponse>(config.OAUTH_ACCESS_TOKEN_URL, {
    method: 'POST',
    body: new URLSearchParams(formParams),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return res.access_token;
}

export default function command(_cli: CLI): CommandDefinition {
  return {
    name: 'login',
    group: 'auth',
    description: 'Log into a YouCan store',

    action: async () => {
      if (!(await isPortAvailable(config.OAUTH_CALLBACK_PORT))) {
        stdout.warn(`YouCan CLI requires that the port ${config.OAUTH_CALLBACK_PORT} be available`);
        const prompt = await prompts({
          initial: false,
          type: 'confirm',
          name: 'terminate',
          message: 'Terminate the process to free the port?',
        });

        if (!prompt.terminate) {
          stdout.log('Exiting..');
          exit(1);
        }

        const pid = await getPidByPort(config.OAUTH_CALLBACK_PORT);

        if (pid) {
          await LoadingSpinner.exec(
            `Terminating process ${pid}..`,
            async (spinner) => {
              try {
                await kill(pid, 'SIGTERM', 30_000);
              }
              catch (err) {
                spinner.error('Could not terminate process, proceeding..');
              }
            });
        }
      }

      try {
        openLink(config.OAUTH_ACCESS_TOKEN_URL);
      }
      catch (err) {
        stdout.log(messages.LOGIN_OPEN_LINK);
        stdout.info(config.OAUTH_AUTH_CODE_URL);
      }

      await LoadingSpinner.exec('Authenticating..', async () => {
        const authorization = await captureAuthorization();

        writeToFile(
          config.CLI_GLOBAL_CONFIG_PATH,
          JSON.stringify({ access_token: await exchangeAuthCode(authorization) }),
        );
      });

      stdout.info(messages.LOGIN_SUCCESS);
    },
  };
}

