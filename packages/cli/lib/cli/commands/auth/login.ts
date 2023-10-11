import { Cli, Config, Env, Http } from '@youcan/cli-kit';
import type { StoreResponse } from '@/cli/services/auth/login';
import { authorize, exchange, isSessionValid } from '@/cli/services/auth/login';

export default class Login extends Cli.Command {
  public async run(): Promise<void> {
    this.output.log('Attempting to authenticate');

    const existingSession = Config
      .manager({ projectName: 'youcan-cli' })
      .get('store_session');

    if (existingSession && await isSessionValid(existingSession)) {
      this.output.log('You are already logged in.');

      return this.exit(0);
    }

    const accessToken = await exchange(await authorize(this));

    const { stores } = await Http.get<{ stores: StoreResponse[] }>(
      `${Env.apiHostname()}/stores`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const active = stores.filter(s => s.is_active);
    if (!active.length) {
      this.output.error('No active stores found.');
    }

    const { selected } = await this.prompt({
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

    Config
      .manager({ projectName: 'youcan-cli' })
      .set('store_session', {
        slug: store.slug,
        id: store.store_id,
        access_token: storeAccessToken,
      });

    this.output.info(`Logged in as ${store.slug}..`);
  }
}
