import { Callback, type Cli, Config, Crypto, Env, Http, System } from '..';

const LS_PORT = 3000;
const LS_HOST = 'localhost';

function generatePkcePair(length: number): [string, string] {
  const verifier = Crypto.randomHex(length);

  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = Crypto.sha256(data);

  return [verifier, Crypto.base64URLEncode(hash)];
}

async function isSessionValid(session: StoreSession): Promise<boolean> {
  try {
    const store = await Http.get<{ status: number }>(
      `${Env.apiHostname()}/me`,
      { headers: { Authorization: `Bearer ${session.access_token}` } },
    );

    return store.status === 1;
  }
  catch (err) {
    return false;
  }
}

async function exchange(code: string, verifier: string) {
  const params = {
    code,
    client_id: Env.oauthClientId(),
    grant_type: 'authorization_code',
    redirect_uri: `http://${LS_HOST}:${LS_PORT}/`,
    code_verifier: verifier,
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

  const [verifier, challenge] = await generatePkcePair(64);

  const params = {
    state,
    response_type: 'code',
    scope: '*',
    client_id: Env.oauthClientId(),
    redirect_uri: `http://${LS_HOST}:${LS_PORT}/`,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  };

  await command.output.anykey('Press any key to open the login page on your browser..');

  const url = `http://${AUTHORIZATION_URL}/admin/oauth/authorize?${new URLSearchParams(params).toString()}`;

  System.open(url);

  const result = await Callback.listen(command, LS_HOST, LS_PORT, url);

  if (result.state !== state) {
    throw new Error('Authorization state mismatch..');
  }

  return { code: result.code, verifier };
}

export interface StoreSession {
  id: string
  slug: string
  access_token: string
}

export async function get(): Promise<StoreSession | null> {
  return Config.manager({ projectName: 'youcan-cli' })
    .get('store_session') ?? null;
}

export async function authenticate(command: Cli.Command): Promise<StoreSession> {
  const existingSession = Config
    .manager({ projectName: 'youcan-cli' })
    .get('store_session');

  if (existingSession && await isSessionValid(existingSession)) {
    return existingSession;
  }

  const { code, verifier } = await authorize(command);

  const accessToken = await exchange(code, verifier);

  const store = await Http.get<{ id: string; slug: string }>(
    `${Env.apiHostname()}/me`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const session = {
    slug: store.slug,
    id: store.id,
    access_token: accessToken,
  };

  Config
    .manager({ projectName: 'youcan-cli' })
    .set('store_session', session);

  return session;
}
