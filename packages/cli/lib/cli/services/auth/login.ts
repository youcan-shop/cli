import { Callback, type Cli, Crypto, Env, Http, System } from '@youcan/cli-kit';

const LS_PORT = 3000;
const LS_HOST = 'localhost';

export interface StoreSession {
  id: string
  slug: string
  access_token: string
}

export interface StoreResponse {
  slug: string
  store_id: string
  is_active: boolean
  is_email_verified: boolean
}

export async function isSessionValid(session: StoreSession): Promise<boolean> {
  try {
    const store = await Http.get<{ is_active: boolean }>(
        `${Env.apiHostname()}/me`,
        { headers: { Authorization: `Bearer ${session.access_token}` } },
    );

    return store.is_active;
  }
  catch (err) {
    return false;
  }
}

export async function exchange(code: string) {
  const params = {
    code,
    client_id: Env.oauthClientId(),
    grant_type: 'authorization_code',
    client_secret: Env.oauthClientSecret(),
    redirect_uri: `http://${LS_HOST}:${LS_PORT}/`,
  };

  const result = await Http.post<{ access_token: string }>(
    `${Env.apiHostname()}/oauth/token`,
    {
      body: new URLSearchParams(Object.entries(params)),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  );

  return result.access_token;
}

export async function authorize(command: Cli.Command, state: string = Crypto.randomHex(30)) {
  const AUTHORIZATION_URL = Env.sellerAreaHostname();

  if (!await System.isPortAvailable(LS_PORT)) {
    command.output.warn(`Port ${LS_PORT} is unavailable, but it is required for authentication.`);

    const { confirmed } = await command.prompt({
      type: 'confirm',
      name: 'confirmed',
      initial: true,
      message: `Would you like to terminate ${await System.getPortProcessName(LS_PORT)}?`,
    });

    !confirmed && command.output.error('Exiting..');

    await System.killPortProcess(LS_PORT);
  }

  const params = {
    state,
    response_type: 'code',
    scope: '*',
    client_id: Env.oauthClientId(),
    redirect_url: `http://${LS_HOST}:${LS_PORT}/`,
  };

  await command.output.anykey('Press any key to open the login page on your browser..');

  const url = `http://${AUTHORIZATION_URL}/admin/oauth/authorize?${new URLSearchParams(params).toString()}`;

  System.open(url);

  const result = await Callback.listen(command, LS_HOST, LS_PORT, url);

  if (result.state !== state) {
    throw new Error('Authorization state mismatch..');
  }

  return result.code;
}
