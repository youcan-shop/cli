import type { IncomingMessage, ServerResponse } from 'http';
import { createServer } from 'http';
import type { TokenResponse } from './types';
import type { CLI, CommandDefinition } from '@/cli/commands/types';
import config from '@/config';
import openLink from '@/utils/system/openLink';
import stdout from '@/utils/system/stdout';
import { post } from '@/utils/http';
import writeToFile from '@/utils/system/writeToFile';

/**
 * Spin up a local server to handle the OAuth redirect. Times out after 10 seconds.
 * @returns A promise that resolves when the code is received.
*/
function listenForAuthCodeCallback(): Promise<string> {
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
  const formParams = {
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
      if (!openLink(config.OAUTH_AUTH_CODE_URL)) {
        stdout.log('Open this link in your browser to continue authentication:');
        stdout.info(config.OAUTH_AUTH_CODE_URL);
      }

      const authCode = await listenForAuthCodeCallback();

      // TODO: don't overwrite entire config file
      writeToFile(
        config.CLI_GLOBAL_CONFIG_PATH,
        JSON.stringify({ access_token: await exchangeAuthCode(authCode) }),
      );

      stdout.info('You have been successfully logged in.');
    },
  };
}

