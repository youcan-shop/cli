import { Callback, type Cli, Config, Crypto, Env, Http, System } from '@youcan/cli-kit';

const LS_PORT = 3000;
const LS_HOST = 'localhost';

interface StoreSession {
  id: string
  slug: string
  access_token: string
}

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

async function loginService(command: Cli.Command): Promise<void> {
  command.output.log('Attempting to authenticate');

  const existingSession = Config
    .manager({ projectName: 'youcan-cli' })
    .get('store_session');

  if (existingSession && await isSessionValid(existingSession)) {
    command.output.log('You are already logged in.');

    return command.exit(0);
  }

  const accessToken = await exchange(await authorize(command));

  const { stores } = await Http.get<{ stores: StoreResponse[] }>(
    `${Env.apiHostname()}/stores`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const { selected } = await command.prompt({
    type: 'select',
    name: 'selected',
    message: 'Select a store to log into',
    choices: stores.filter(s => s.is_active).map(s => ({ title: s.slug, value: s.store_id })),
  });

  const store = stores.find(s => s.store_id === selected)!;

  const { token: storeAccessToken } = await Http.post<{ token: string }>(
    `${Env.apiHostname()}/switch-store/${store.store_id}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  Config
    .manager({ projectName: 'youcan-cli' })
    .set('store_session', {
      slug: store.slug,
      id: store.store_id,
      access_token: storeAccessToken,
    });

  command.output.info(`Logged in as ${store.slug}..`);
}

export default loginService;
