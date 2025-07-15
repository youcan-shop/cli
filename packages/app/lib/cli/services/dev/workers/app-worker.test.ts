import type DevCommand from '@/cli/commands/app/dev';
import type { App } from '@/types';
import { Filesystem, Path, Worker } from '@youcan/cli-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppWorker from './app-worker';

vi.mock('@youcan/cli-kit', () => ({
  Filesystem: {
    watch: vi.fn(),
  },
  Path: {
    resolve: vi.fn(),
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

describe('appWorker', () => {
  let appWorker: AppWorker;
  let mockCommand: DevCommand;
  let mockApp: App;
  let mockWatcher: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockWatcher = {
      close: vi.fn(),
      once: vi.fn(),
    };

    vi.mocked(Filesystem.watch).mockReturnValue(mockWatcher);
    vi.mocked(Path.resolve).mockReturnValue('/path/to/app.config.json');

    mockCommand = {
      output: {
        wait: vi.fn().mockResolvedValue(undefined),
      },
      controller: {
        abort: vi.fn(),
      },
      reloadWorkers: vi.fn(),
    } as any;

    mockApp = {
      root: '/path/to/app',
    } as App;

    appWorker = new AppWorker(mockCommand, mockApp);
  });

  describe('cleanup', () => {
    it('should close the file watcher if it exists', async () => {
      await appWorker.run();
      expect(Filesystem.watch).toHaveBeenCalled();

      await appWorker.cleanup();

      expect(mockWatcher.close).toHaveBeenCalled();
    });

    it('should handle cleanup when no watcher exists', async () => {
      await expect(appWorker.cleanup()).resolves.toBeUndefined();
    });

    it('should log cleanup message', async () => {
      await appWorker.run();

      await appWorker.cleanup();

      const logger = (appWorker as any).logger;
      expect(logger.write).toHaveBeenCalledWith('stopping config watcher...');
    });

    it('should set watcher to undefined after cleanup', async () => {
      await appWorker.run();
      expect((appWorker as any).watcher).toBe(mockWatcher);

      await appWorker.cleanup();

      expect((appWorker as any).watcher).toBeUndefined();
    });
  });

  describe('run', () => {
    it('should create a file watcher for the app config', async () => {
      await appWorker.run();

      expect(Path.resolve).toHaveBeenCalledWith('/path/to/app', 'youcan.app.json');
      expect(Filesystem.watch).toHaveBeenCalledWith('/path/to/app.config.json', {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 50,
        },
      });
    });

    it('should set up change handler that reloads workers', async () => {
      await appWorker.run();

      expect(mockWatcher.once).toHaveBeenCalledWith('change', expect.any(Function));

      const changeHandler = mockWatcher.once.mock.calls[0][1];
      await changeHandler();

      expect(mockWatcher.close).toHaveBeenCalled();
      expect(mockCommand.controller.abort).toHaveBeenCalled();
      expect(mockCommand.reloadWorkers).toHaveBeenCalled();
    });

    it('should wait 500ms before starting to watch', async () => {
      await appWorker.run();

      expect(mockCommand.output.wait).toHaveBeenCalledWith(500);
    });
  });
});
