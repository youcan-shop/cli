import process from 'node:process';
import { type Cli, Config, Env, Http, String, System } from '..';

const DEVICE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';
const EXCHANGE_GRANT = 'urn:ietf:params:oauth:grant-type:token-exchange';
const ID_TOKEN_TYPE = 'urn:ietf:params:oauth:token-type:id_token';

export interface StoreSession {
  id: string;
  slug: string;
  access_token: string;
  expires_at?: number;
}

interface Identity {
  refresh_token: string;
  id_token: string;
  expires_at: number;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
}

interface DeviceCode {
  device_code: string;
  user_code: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

interface AccountStore {
  id: string;
  slug: string;
  is_dev: boolean;
}

let renewing: Promise<StoreSession | null> | null = null;
let inRenewal = false;

const config = () => Config.manager({ projectName: 'youcan-cli' });
const expiresAt = (seconds: number) => Date.now() + seconds * 1000;
const expiring = (at?: number) => at !== undefined && at - 60_000 < Date.now();
function form(params: Record<string, string>) {
  return {
    body: new URLSearchParams(params),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  };
}

async function poll(device: DeviceCode): Promise<TokenResponse> {
  let interval = device.interval;
  const deadline = expiresAt(device.expires_in);

  while (Date.now() < deadline) {
    await System.sleep(interval);

    try {
      return await Http.post<TokenResponse>(`${Env.idpHostname()}/oauth/token`, form({
        grant_type: DEVICE_GRANT,
        client_id: Env.oauthClientId(),
        device_code: device.device_code,
      }));
    }
    catch (err) {
      const error = String.isJson((err as Error).message) ? JSON.parse((err as Error).message).error : undefined;

      if (error === 'slow_down') {
        interval += 5;
      }
      else if (error !== 'authorization_pending') {
        throw new Error('The login was not completed, run the command again.');
      }
    }
  }

  throw new Error('The login code expired, run the command again.');
}

async function login(command: Cli.Command): Promise<Identity> {
  const device = await Http.post<DeviceCode>(`${Env.idpHostname()}/oauth/device/code`, form({
    client_id: Env.oauthClientId(),
    scope: 'openid profile email',
  }));

  command.output.info(`Your login code is ${device.user_code.replace(/^(.{4})/, '$1-')}`);
  await command.output.anykey('Press any key to open the login page on your browser');
  System.open(device.verification_uri_complete).catch(() => {});
  command.output.url('Log in to YouCan', device.verification_uri_complete);

  return saveIdentity(await poll(device));
}

function saveIdentity(tokens: TokenResponse): Identity {
  const identity = {
    refresh_token: tokens.refresh_token!,
    id_token: tokens.id_token!,
    expires_at: expiresAt(tokens.expires_in),
  };

  config().set('identity', identity);

  return identity;
}

async function idToken(): Promise<string | null> {
  const identity = config().get('identity') as Identity | undefined;

  if (!identity) {
    return null;
  }

  if (!expiring(identity.expires_at)) {
    return identity.id_token;
  }

  try {
    return saveIdentity(await Http.post<TokenResponse>(`${Env.idpHostname()}/oauth/token`, form({
      grant_type: 'refresh_token',
      client_id: Env.oauthClientId(),
      refresh_token: identity.refresh_token,
    }))).id_token;
  }
  catch {
    config().delete('identity');

    return null;
  }
}

async function exchange(subject: string, storeId?: string): Promise<TokenResponse> {
  return Http.post<TokenResponse>(`${Env.apiHostname()}/oauth/token`, form({
    grant_type: EXCHANGE_GRANT,
    client_id: Env.oauthClientId(),
    subject_token: subject,
    subject_token_type: ID_TOKEN_TYPE,
    ...(storeId ? { store_id: storeId } : {}),
  }));
}

async function pickStore(command: Cli.Command, subject: string): Promise<AccountStore> {
  const account = await exchange(subject);
  const { stores } = await Http.get<{ stores: AccountStore[] }>(
    `${Env.apiHostname()}/account/stores`,
    { headers: { Authorization: `Bearer ${account.access_token}` } },
  );
  const devStores = stores.filter(store => store.is_dev);

  if (!devStores.length) {
    throw new Error('The CLI can only be used with dev stores, you create one through YouCan Partners.');
  }

  if (devStores.length === 1) {
    return devStores[0];
  }

  const { store } = await command.prompt({
    type: 'select',
    name: 'store',
    message: 'Which dev store do you want to use?',
    choices: devStores.map(store => ({ title: store.slug, value: store })),
  });

  return store;
}

function saveSession(store: Pick<StoreSession, 'id' | 'slug'>, tokens: TokenResponse): StoreSession {
  const session = {
    id: store.id,
    slug: store.slug,
    access_token: tokens.access_token,
    expires_at: expiresAt(tokens.expires_in),
  };

  config().set('store_session', session);

  return session;
}

async function renew(session: StoreSession): Promise<StoreSession | null> {
  inRenewal = true;

  try {
    const subject = await idToken();

    return subject ? saveSession(session, await exchange(subject, session.id)) : null;
  }
  finally {
    inRenewal = false;
  }
}

function envSession(): StoreSession | null {
  const token = process.env.YC_CLI_ACCESS_TOKEN;

  return token ? { id: '', slug: 'ci', access_token: token } : null;
}

export async function get(): Promise<StoreSession | null> {
  const session = envSession() ?? config().get('store_session') as StoreSession | undefined ?? null;

  if (!session || inRenewal || !expiring(session.expires_at)) {
    return session;
  }

  renewing ??= renew(session).finally(() => {
    renewing = null;
  });

  return renewing;
}

async function isSessionValid(session: StoreSession): Promise<boolean> {
  try {
    const store = await Http.get<{ status: number }>(
      `${Env.apiHostname()}/me`,
      { headers: { Authorization: `Bearer ${session.access_token}` } },
    );

    return store.status === 1;
  }
  catch {
    return false;
  }
}

export async function authenticate(command: Cli.Command): Promise<StoreSession> {
  const existing = await get();

  if (existing && (envSession() || await isSessionValid(existing))) {
    return existing;
  }

  const subject = await idToken() ?? (await login(command)).id_token;
  const store = await pickStore(command, subject);

  return saveSession(store, await exchange(subject, store.id));
}

export async function logout(): Promise<void> {
  const identity = config().get('identity') as Identity | undefined;

  if (identity) {
    await Http.post(`${Env.idpHostname()}/oauth/revoke`, form({
      token: identity.refresh_token,
      client_id: Env.oauthClientId(),
    })).catch(() => {});
  }

  config().delete('identity');
  config().delete('store_session');
}
