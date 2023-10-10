import { type Cli, Config, Crypto, Env, Http, System } from '@youcan/cli-kit';

interface AdminSession {
  access_token: string
  refresh_token: string
}

async function isTokenValid(token: string): Promise<boolean> {
  try {
    await Http.get(`${Env.apiHostname()}/me`, { headers: { Authorization: `Bearer ${token}` } });

    return true;
  }
  catch (err) {
    return false;
  }
}

async function authorize(command: Cli.Command, scopes: string[] = [], state: string = Crypto.randomHex(30)) {
  const PORT = 3000;
  const HOST = '127.0.0.1';
  const CALLBACK_URL = `http://${HOST}/${PORT}`;
  const AUTHORIZATION_URL = Env.sellerAreaHostname();
  const CLIENT_ID = Env.oauthClientId();

  if (!await System.isPortAvailable(PORT)) {
    command.output.warn(`Port ${PORT} is unavailable, but it is required for authentication.`);

    const { confirmed } = await command.prompt({
      type: 'confirm',
      name: 'confirmed',
      initial: true,
      message: `Would you like to terminate ${await System.getPortProcessName(PORT)}?`,
    });

    !confirmed && command.output.error('Exiting..');

    await System.killPortProcess(PORT);
  }

  const challenge = Crypto.base64URLEncode(Crypto.randomBytes(32));
  const verifier = Crypto.base64URLEncode(Crypto.sha256(challenge));

  const params = {
    scopes: scopes.join(' '),
    client_id: Env.oauthClientId(),
    redirect_url: `http://${HOST}/${PORT}`,
    response_type: 'code',
    code_challenge_method: 'S256',
    code_challenge: challenge,
  };

  await command.output.anykey('Press any key to open the login page on your browser..');

  const url = `http://${AUTHORIZATION_URL}/admin/oauth/authorize?${new URLSearchParams(params).toString()}`;
  await System.open(url);
}

async function loginService(command: Cli.Command): Promise<void> {
  command.output.log('Attempting to authenticate');

  const token = Config
    .manager({ projectName: 'youcan-cli' })
    .get('oauth_access_token');

  if (token && await isTokenValid(token)) {
    command.output.log('You are already logged in.');

    return command.exit(0);
  }

  await authorize(command);
}

export default loginService;
