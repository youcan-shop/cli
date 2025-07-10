import type { Worker } from '@youcan/cli-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dev from './dev';

vi.mock('@/util/app-loader', () => ({
  load: vi.fn().mockResolvedValue({
    root: '/test/app',
    config: { id: 'test-app' },
    webs: [],
    extensions: [],
  }),
}));

vi.mock('@youcan/cli-kit', () => ({
  Session: {
    authenticate: vi.fn().mockResolvedValue({}),
  },
  Tasks: {
    run: vi.fn().mockResolvedValue({ workers: [] }),
  },
  UI: {
    renderDevOutput: vi.fn(),
  },
  System: {
    getPortOrNextOrRandom: vi.fn().mockResolvedValue(3000),
  },
  Services: {
    Cloudflared: vi.fn(),
  },
  Filesystem: {
    writeJsonFile: vi.fn(),
  },
  Path: {
    join: vi.fn(),
  },
  Cli: {
    Command: class MockCommand {
      controller = { abort: vi.fn(), signal: new AbortController().signal };
      output = { wait: vi.fn() };
    },
  },
  Env: {},
  Http: {},
  Worker: {
    Interface: class MockInterface {
      async run() {}
      async boot() {}
      async cleanup() {}
    },
    Abstract: class MockAbstract {
      async run() {}
      async boot() {}
      async cleanup() {}
    },
  },
}));

vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
const mockOnce = vi.spyOn(process, 'once').mockImplementation(() => process);

describe('dev Command', () => {
  let devCommand: Dev;
  let mockWorkers: Worker.Interface[];

  beforeEach(() => {
    vi.clearAllMocks();

    mockWorkers = [
      {
        run: vi.fn(),
        boot: vi.fn(),
        cleanup: vi.fn().mockResolvedValue(undefined),
      },
      {
        run: vi.fn(),
        boot: vi.fn(),
        cleanup: vi.fn().mockResolvedValue(undefined),
      },
    ];

    devCommand = new Dev([], {});
    (devCommand as any).workers = mockWorkers;
  });

  describe('setupExitHandlers', () => {
    it('should register signal handlers for graceful shutdown', () => {
      (devCommand as any).setupExitHandlers();

      expect(mockOnce).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(mockOnce).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      expect(mockOnce).toHaveBeenCalledWith('SIGQUIT', expect.any(Function));
      expect(mockOnce).toHaveBeenCalledWith('exit', expect.any(Function));
    });
  });

  describe('cleanup functionality', () => {
    it('should cleanup all workers when cleanupAndExit is called', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      (devCommand as any).setupExitHandlers();

      const sigintCall = mockOnce.mock.calls.find(call => call[0] === 'SIGINT');
      const cleanupAndExit = sigintCall?.[1];

      if (cleanupAndExit) {
        await cleanupAndExit();
      }

      expect(consoleSpy).toHaveBeenCalledWith('Shutting down...');
      expect(mockWorkers[0].cleanup).toHaveBeenCalled();
      expect(mockWorkers[1].cleanup).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle worker cleanup errors gracefully', async () => {
      const failingWorker = {
        run: vi.fn(),
        boot: vi.fn(),
        cleanup: vi.fn().mockRejectedValue(new Error('Cleanup failed')),
      };
      (devCommand as any).workers = [failingWorker];

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      (devCommand as any).setupExitHandlers();
      const sigintCall = mockOnce.mock.calls.find(call => call[0] === 'SIGINT');
      const cleanupAndExit = sigintCall?.[1];

      if (cleanupAndExit) {
        await expect(cleanupAndExit()).resolves.toBeUndefined();
      }

      expect(failingWorker.cleanup).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('reloadWorkers', () => {
    it('should cleanup existing workers before reload', async () => {
      const mockController = {
        abort: vi.fn(),
        signal: new AbortController().signal,
      };
      (devCommand as any).controller = mockController;
      (devCommand as any).app = {
        network_config: { app_port: 3000 },
      };

      (devCommand as any).syncAppConfig = vi.fn().mockResolvedValue(undefined);
      (devCommand as any).prepareDevProcesses = vi.fn().mockResolvedValue([]);
      (devCommand as any).runWorkers = vi.fn().mockResolvedValue(undefined);

      await (devCommand as any).reloadWorkers();

      expect(mockWorkers[0].cleanup).toHaveBeenCalled();
      expect(mockWorkers[1].cleanup).toHaveBeenCalled();
    });
  });

  describe('runWorkers', () => {
    it('should store workers in instance variable', async () => {
      const newWorkers = [
        {
          run: vi.fn().mockResolvedValue(undefined),
          boot: vi.fn(),
          cleanup: vi.fn(),
        },
      ];

      await (devCommand as any).runWorkers(newWorkers);

      expect((devCommand as any).workers).toBe(newWorkers);
      expect(newWorkers[0].run).toHaveBeenCalled();
    });
  });

  describe('hotkey handlers', () => {
    it('should cleanup workers when q key is pressed', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const hotKeys = (devCommand as any).hotKeys;
      const quitHandler = hotKeys.find((key: any) => key.keyboardKey === 'q')?.handler;

      if (quitHandler) {
        await quitHandler();
      }

      expect(consoleSpy).toHaveBeenCalledWith('Shutting down...');
      expect(mockWorkers[0].cleanup).toHaveBeenCalled();
      expect(mockWorkers[1].cleanup).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
