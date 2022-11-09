import type { IncomingMessage, ServerResponse } from 'http';
import http from 'http';
import fetch from 'node-fetch';
import type { OAuthToken } from './types';
import stdout from '@/utils/system/stdout';
import config from '@/config';
import { homeDir } from '@/utils/common';
import writeToFile from '@/utils/system/writeToFile';
import openLink from '@/utils/system/openLink';

const { authorizationUrl, callbackServerPort, callbackServerTimeout } = config;

/**
 * Spin up a local server to handle the OAuth redirect. Times out after 10 seconds.
 * @returns A promise that resolves when the code is received.
*/
function callbackServer(): Promise<string> {
  return new Promise((resolve, reject) => {
    let timeOut: ReturnType<typeof setTimeout>;
    const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
      const { url } = req;
      const code = url?.split('=')[1] || '';

      if (!code) reject(new Error('authorization code is required.'));
      clearTimeout(timeOut);
      res.end('You can close this window now.');
      server.close();
      resolve(code);
    });
    server.listen(callbackServerPort, () => {
      timeOut = setTimeout(() => {
        reject(new Error('Timeout'));
      }, callbackServerTimeout);
    });
  });
}

/**
 * Exchange code for access token
 * @param authorizationCode string
 */
async function exchangeCodeForToken(authorizationCode: string): Promise<string> {
  const formParams = {
    grant_type: 'authorization_code',
    client_id: config.oauthClientId,
    client_secret: config.oauthClientSecret,
    redirect_uri: config.oauthRedirectUri,
    code: authorizationCode,
  };

  const response = await fetch('https://seller-area.youcan.shop/admin/oauth/token', {
    method: 'POST',
    body: new URLSearchParams(formParams),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const data = await response.json() as OAuthToken;
  return data.access_token;
}

/**
 * Save Token locally in user's home directory in ./youcan file
 * @param token - The token to save.
 */
async function saveTokenLocally(token: string) {
  const filePath = `${homeDir}/.youcan`;
  const content = `token=${token}`;
  await writeToFile(filePath, content);
  stdout.info('You\'re successfully logged in 🎉');
}

/**
 * YouCan CLI - Login Command
 */
async function loginAction() {
  if (!openLink(authorizationUrl))
    stdout.log(`Please open this link in your browser: ${authorizationUrl}`);

  const authorizationCode = await callbackServer();
  const accessToken = await exchangeCodeForToken(authorizationCode);
  await saveTokenLocally(accessToken);
}

export default {
  setup(cli: any) {
    cli.command('auth', '🔓 Login to YouCan')
      .option('-s, --store', 'A store to log into.')
      .action(loginAction);
  },
};
