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

describe('webWorker', () => {
  let webWorker: WebWorker;
  let mockCommand: Cli.Command;
  let mockApp: App;
  let mockWeb: Web;
  let mockEnv: Record<string, string>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCommand = {
      controller: {
        signal: new AbortController().signal,
      },
    } as any;

    mockApp = {} as App;

    mockWeb = {
      config: {
        name: 'test-web',
        commands: {
          dev: 'npm start',
        },
      },
    } as Web;

    mockEnv = {
      PORT: '3001',
      NODE_ENV: 'development',
    };

    webWorker = new WebWorker(mockCommand, mockApp, mockWeb, mockEnv);
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

    it('should handle missing PORT environment variable gracefully', async () => {
      const webWorkerWithoutPort = new WebWorker(
        mockCommand,
        mockApp,
        mockWeb,
        { NODE_ENV: 'development' },
      );

      await expect(webWorkerWithoutPort.cleanup()).resolves.toBeUndefined();
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
    it('should execute the web command with correct parameters', async () => {
      vi.mocked(System.exec).mockResolvedValue();

      await webWorker.run();

      expect(System.exec).toHaveBeenCalledWith('npm', ['start'], {
        stdout: expect.any(Object),
        signal: mockCommand.controller.signal,
        stderr: expect.any(Object),
        env: mockEnv,
      });
    });
  });
});
