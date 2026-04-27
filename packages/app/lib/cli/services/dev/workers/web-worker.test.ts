import type { App, Web } from '@/types';
import type { Cli } from '@youcan/cli-kit';
import { System, Worker } from '@youcan/cli-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WebWorker from './web-worker';

vi.mock('@youcan/cli-kit', () => ({
  System: {
    exec: vi.fn(),
    isPortAvailable: vi.fn(),
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
        name: 'Test App',
        app_url: 'http://localhost:3001',
        redirect_urls: [],
        oauth: { client_id: 'id', scopes: [] },
      },
      webs: [],
      extensions: [],
      network_config: {
        app_port: 3001,
        app_url: 'http://localhost:3001',
      },
      remote_config: {
        id: 'test-app',
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
    it('should kill process on the assigned port when port is not available', async () => {
      vi.mocked(System.isPortAvailable).mockResolvedValue(false);
      vi.mocked(System.killPortProcess).mockResolvedValue();

      await webWorker.cleanup();

      expect(System.isPortAvailable).toHaveBeenCalledWith(3001);
      expect(System.killPortProcess).toHaveBeenCalledWith(3001);
    });

    it('should not kill process when port is already available', async () => {
      vi.mocked(System.isPortAvailable).mockResolvedValue(true);

      await webWorker.cleanup();

      expect(System.isPortAvailable).toHaveBeenCalledWith(3001);
      expect(System.killPortProcess).not.toHaveBeenCalled();
    });

    it('should handle missing network_config gracefully', async () => {
      const appWithoutNetwork = { ...mockApp, network_config: undefined };
      const workerWithoutNetwork = new WebWorker(mockCommand, appWithoutNetwork as App, mockWeb);

      await expect(workerWithoutNetwork.cleanup()).resolves.toBeUndefined();
      expect(System.isPortAvailable).not.toHaveBeenCalled();
      expect(System.killPortProcess).not.toHaveBeenCalled();
    });

    it('should handle killPortProcess errors gracefully', async () => {
      vi.mocked(System.isPortAvailable).mockResolvedValue(false);
      vi.mocked(System.killPortProcess).mockRejectedValue(new Error('Process not found'));

      await expect(webWorker.cleanup()).resolves.toBeUndefined();
      expect(System.killPortProcess).toHaveBeenCalledWith(3001);
    });

    it('should log cleanup messages', async () => {
      vi.mocked(System.isPortAvailable).mockResolvedValue(false);
      vi.mocked(System.killPortProcess).mockResolvedValue();

      await webWorker.cleanup();

      const logger = (webWorker as any).logger;
      expect(logger.write).toHaveBeenCalledWith('stopping web server...');
      expect(logger.write).toHaveBeenCalledWith('killed process on port 3001');
    });
  });

  describe('run', () => {
    it('should execute the web command with env computed from app', async () => {
      vi.mocked(System.exec).mockResolvedValue();

      await webWorker.run();

      expect(System.exec).toHaveBeenCalledWith('npm', ['start'], {
        stdout: expect.any(Object),
        signal: mockCommand.controller.signal,
        stderr: expect.any(Object),
        env: expect.objectContaining({
          APP_URL: 'http://localhost:3001',
          PORT: '3001',
          YOUCAN_API_KEY: 'test-key',
        }),
      });
    });
  });
});
