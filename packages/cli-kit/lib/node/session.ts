import { Callback, type Cli, Config, Crypto, Env, Http, System } from '..';

const LS_PORT = 3000;
const LS_HOST = 'localhost';

interface StoreResponse {
  slug: string
  store_id: string
  is_active: boolean
  is_email_verified: boolean
}

async function isSessionValid(session: StoreSession): Promise<boolean> {
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

async function exchange(code: string) {
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

async function authorize(command: Cli.Command, state: string = Crypto.randomHex(30)) {
  const AUTHORIZATION_URL = Env.sellerAreaHostname();

  if (!await System.isPortAvailable(LS_PORT)) {
    command.output.warn(`Port ${LS_PORT} is unavailable, but it is required for authentication.`);

    const { confirmed } = await command.prompt({
      type: 'confirm',
      name: 'confirmed',
      initial: true,
      message: `Would you like to terminate ${await System.getPortProcessName(LS_PORT)}?`,
    });

    if (!confirmed) {
      throw new Error('Exiting..');
    }

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

export interface StoreSession {
  id: string
  slug: string
  access_token: string
}

export async function authenticate(command: Cli.Command): Promise<StoreSession> {
  const existingSession = Config
    .manager({ projectName: 'youcan-cli' })
    .get('store_session');

  if (existingSession && await isSessionValid(existingSession)) {
    return existingSession;
  }

  const accessToken = await exchange(await authorize(command));

  const { stores } = await Http.get<{ stores: StoreResponse[] }>(
      `${Env.apiHostname()}/stores`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const active = stores.filter(s => s.is_active);
  if (!active.length) {
    throw new Error('No active stores found');
  }

  const { selected } = await command.prompt({
    type: 'select',
    name: 'selected',
    message: 'Select a store to log into',
    choices: active.map(s => ({ title: s.slug, value: s.store_id })),
  });

  const store = stores.find(s => s.store_id === selected)!;

  const { token: storeAccessToken } = await Http.post<{ token: string }>(
      `${Env.apiHostname()}/switch-store/${store.store_id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const session = {
    slug: store.slug,
    id: store.store_id,
    access_token: storeAccessToken,
  };

  Config
    .manager({ projectName: 'youcan-cli' })
    .set('store_session', session);

  return session;
}
