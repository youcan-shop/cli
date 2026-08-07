import type { App } from '@/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppCommand } from './app-command';

const post = vi.fn();

vi.mock('@youcan/cli-kit', () => ({
  Cli: { Command: class {} },
  Env: { apiHostname: () => 'api.test' },
  Http: { post: (...args: unknown[]) => post(...args) },
  Filesystem: {
    readJsonFile: vi.fn().mockResolvedValue({}),
    writeJsonFile: vi.fn(),
  },
  Path: { join: (...parts: string[]) => parts.join('/') },
}));

class TestCommand extends AppCommand {
  async run(): Promise<void> {}
}

function makeApp(config: Partial<App['config']>): App {
  return {
    root: '/test/app',
    config,
    webs: [],
    extensions: [],
  } as unknown as App;
}

const remote = {
  id: 'app_1',
  handle: 'test-app',
  name: 'Test App',
  app_url: 'https://live.example.com',
  redirect_urls: ['https://live.example.com/auth/callback'],
  scopes: ['*'],
  client_id: '1',
  client_secret: 'secret',
};

describe('syncAppConfig', () => {
  let command: TestCommand;

  beforeEach(() => {
    vi.clearAllMocks();
    post.mockResolvedValue(remote);

    command = new TestCommand();
    (command as any).session = { access_token: 'token' };
  });

  it('omits app_url on update and keeps the local one', async () => {
    (command as any).app = makeApp({
      id: 'app_1',
      name: 'Test App',
      app_url: 'https://tunnel.trycloudflare.com',
      redirect_urls: ['https://tunnel.trycloudflare.com/auth/callback'],
    });

    const app = await command.syncAppConfig();

    const [endpoint, options] = post.mock.calls[0];
    expect(endpoint).toBe('api.test/apps/app_1/update');
    expect(JSON.parse(options.body)).not.toHaveProperty('app_url');

    expect(app.config.app_url).toBe('https://tunnel.trycloudflare.com');
  });

  it('sends app_url on create and adopts the remote config', async () => {
    (command as any).app = makeApp({
      name: 'Test App',
      app_url: 'https://live.example.com',
      redirect_urls: [],
    });

    const app = await command.syncAppConfig();

    const [endpoint, options] = post.mock.calls[0];
    expect(endpoint).toBe('api.test/apps/create');
    expect(JSON.parse(options.body).app_url).toBe('https://live.example.com');

    expect(app.config.app_url).toBe(remote.app_url);
    expect(app.config.id).toBe(remote.id);
  });

  it('still registers redirect urls on update', async () => {
    (command as any).app = makeApp({
      id: 'app_1',
      name: 'Test App',
      app_url: 'https://tunnel.trycloudflare.com',
      redirect_urls: ['https://tunnel.trycloudflare.com/auth/callback'],
    });

    await command.syncAppConfig();

    const [, options] = post.mock.calls[0];
    expect(JSON.parse(options.body).redirect_urls).toEqual(['https://tunnel.trycloudflare.com/auth/callback']);
  });
});
