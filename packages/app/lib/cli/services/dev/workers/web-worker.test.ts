import type { Cli } from '@youcan/cli-kit';
import type { App, Web } from '@/types';
import process from 'node:process';
import { System } from '@youcan/cli-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WebWorker from './web-worker';

vi.mock('@youcan/cli-kit', () => ({
  System: {
    spawn: vi.fn(),
    killTree: vi.fn(),
    waitUntilPortFree: vi.fn(),
    killPortProcess: vi.fn(),
    getPortOrNextOrRandom: vi.fn().mockResolvedValue(3001),
    sleep: vi.fn().mockResolvedValue(undefined),
  },
  Filesystem: {
    writeJsonFile: vi.fn().mockResolvedValue(undefined),
  },
  Path: {
    join: vi.fn((...args: string[]) => args.join('/')),
  },
  Worker: {
    Logger: class MockLogger {
      constructor(public name: string, public color: string) {}
      write = vi.fn();
    },
    Abstract: class MockAbstract {
      async cleanup() {}
    },
  },
}));

vi.mock('@/cli/services/environment-variables', () => ({
  getAppEnvironmentVariables: vi.fn().mockReturnValue({
    YOUCAN_API_KEY: 'test-key',
    YOUCAN_API_SECRET: 'test-secret',
    YOUCAN_API_SCOPES: 'read',
    YOUCAN_API_URL: 'https://api.youcan.shop',
    YOUCAN_SELLER_AREA_URL: 'https://seller-area.youcan.shop',
  }),
}));

describe('webWorker', () => {
  let webWorker: WebWorker;
  let mockCommand: Cli.Command;
  let mockApp: App;
  let mockWeb: Web;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCommand = {
      controller: {
        signal: new AbortController().signal,
      },
    } as any;

    mockApp = {
      root: '/test/app',
      config: {
        id: 'test-app',
        handle: 'test-app',
        name: 'Test App',
        app_url: 'http://localhost:3001',
        redirect_urls: [],
        oauth: { client_id: 'id', scopes: [] },
      },
      webs: [],
      configFilename: 'youcan.app.json',
      extensions: [],
      network_config: {
        app_port: 3001,
        app_url: 'http://localhost:3001',
      },
      remote_config: {
        id: 'test-app',
        handle: 'test-app',
        name: 'Test App',
        app_url: 'http://localhost:3001',
        owner_id: '1',
        client_id: 'test-key',
        client_secret: 'test-secret',
        redirect_urls: [],
        scopes: ['read'],
      },
    } as App;

    mockWeb = {
      config: {
        name: 'test-web',
        commands: {
          dev: 'npm start',
        },
      },
    } as Web;

    webWorker = new WebWorker(mockCommand, mockApp, mockWeb);
  });

  describe('cleanup', () => {
    it('should kill the process tree and wait for the port', async () => {
      const child = { pid: 42 };
      (webWorker as any).child = child;
      vi.mocked(System.waitUntilPortFree).mockResolvedValue();

      await webWorker.cleanup();

      expect(System.killTree).toHaveBeenCalledWith(child);
      expect(System.waitUntilPortFree).toHaveBeenCalledWith(3001, 3000);
      expect(System.killPortProcess).not.toHaveBeenCalled();
    });

    it('should fall back to killing the port holder when the port stays busy', async () => {
      vi.mocked(System.waitUntilPortFree).mockRejectedValue(new Error('timeout'));
      vi.mocked(System.killPortProcess).mockResolvedValue();

      await webWorker.cleanup();

      expect(System.killPortProcess).toHaveBeenCalledWith(3001);

      const logger = (webWorker as any).logger;
      expect(logger.write).toHaveBeenCalledWith('stopping web server...');
      expect(logger.write).toHaveBeenCalledWith('killed process on port 3001');
    });

    it('should handle missing network_config gracefully', async () => {
      const appWithoutNetwork = { ...mockApp, network_config: undefined };
      const workerWithoutNetwork = new WebWorker(mockCommand, appWithoutNetwork as App, mockWeb);

      await expect(workerWithoutNetwork.cleanup()).resolves.toBeUndefined();
      expect(System.waitUntilPortFree).not.toHaveBeenCalled();
      expect(System.killPortProcess).not.toHaveBeenCalled();
    });

    it('should handle killPortProcess errors gracefully', async () => {
      vi.mocked(System.waitUntilPortFree).mockRejectedValue(new Error('timeout'));
      vi.mocked(System.killPortProcess).mockRejectedValue(new Error('Process not found'));

      await expect(webWorker.cleanup()).resolves.toBeUndefined();
      expect(System.killPortProcess).toHaveBeenCalledWith(3001);
    });
  });

  describe('boot', () => {
    it('keeps real redirect urls and prunes stale tunnel ones', async () => {
      mockApp.config.redirect_urls = [
        'https://myapp.example.com/auth/callback',
        'https://old.trycloudflare.com/auth/callback',
      ];

      await webWorker.boot();

      expect(mockApp.config.redirect_urls).toEqual([
        'http://localhost:3001/auth/callback',
        'https://myapp.example.com/auth/callback',
      ]);
      expect(mockApp.config.app_url).toBe('http://localhost:3001');
    });

    it('defaults to the callback path when no redirect urls exist', async () => {
      mockApp.config.redirect_urls = [];

      await webWorker.boot();

      expect(mockApp.config.redirect_urls).toEqual(['http://localhost:3001/auth/callback']);
    });
  });

  describe('run', () => {
    it('should spawn the web command detached with env computed from app', async () => {
      const child = Object.assign(Promise.resolve(), { pid: 42, killed: false });
      vi.mocked(System.spawn).mockReturnValue(child as any);

      await webWorker.run();

      expect(System.spawn).toHaveBeenCalledWith('npm', ['start'], {
        detached: process.platform !== 'win32',
        stdout: expect.any(Object),
        stderr: expect.any(Object),
        env: expect.objectContaining({
          APP_URL: 'http://localhost:3001',
          PORT: '3001',
          YOUCAN_API_KEY: 'test-key',
        }),
      });
    });

    it('should swallow the spawn error when aborted', async () => {
      const controller = new AbortController();
      (mockCommand as any).controller = controller;

      const child = Object.assign(Promise.reject(new Error('killed')), { pid: 42, killed: true });
      vi.mocked(System.spawn).mockReturnValue(child as any);

      await expect(webWorker.run()).resolves.toBeUndefined();
    });
  });
});
