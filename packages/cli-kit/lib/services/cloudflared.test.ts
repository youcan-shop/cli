import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Filesystem, System } from '..';
import { Cloudflared } from './cloudflared';

vi.mock('..', () => ({
  System: {
    exec: vi.fn(),
  },
  Filesystem: {
    isExecutable: vi.fn(),
  },
  Path: {
    join: vi.fn().mockReturnValue('/mock/path/cloudflared'),
  },
}));

const originalPlatform = process.platform;
const originalArch = process.arch;

describe('cloudflared', () => {
  let cloudflared: Cloudflared;
  let mockAbortController: AbortController;

  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      configurable: true,
    });
    Object.defineProperty(process, 'arch', {
      value: 'arm64',
      configurable: true,
    });

    vi.mocked(Filesystem.isExecutable).mockResolvedValue(true);

    mockAbortController = new AbortController();
    cloudflared = new Cloudflared();
  });

  afterAll(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      configurable: true,
    });
    Object.defineProperty(process, 'arch', {
      value: originalArch,
      configurable: true,
    });
  });

  describe('tunnel', () => {
    it('should pass abort signal to System.exec', async () => {
      vi.mocked(System.exec).mockResolvedValue();

      await cloudflared.tunnel(3000, 'localhost', mockAbortController.signal);

      expect(System.exec).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({
          signal: mockAbortController.signal,
        }),
      );
    });

    it('should use correct cloudflared arguments', async () => {
      vi.mocked(System.exec).mockResolvedValue();

      await cloudflared.tunnel(3001, 'localhost', mockAbortController.signal);

      expect(System.exec).toHaveBeenCalledWith(
        expect.any(String),
        ['tunnel', '--url=localhost:3001', '--no-autoupdate'],
        expect.any(Object),
      );
    });

    it('should work without abort signal', async () => {
      vi.mocked(System.exec).mockResolvedValue();

      await expect(cloudflared.tunnel(3000)).resolves.toBeUndefined();

      expect(System.exec).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({
          signal: undefined,
        }),
      );
    });

    it('should use default host when not provided', async () => {
      vi.mocked(System.exec).mockResolvedValue();

      await cloudflared.tunnel(3000, undefined, mockAbortController.signal);

      expect(System.exec).toHaveBeenCalledWith(
        expect.any(String),
        ['tunnel', '--url=localhost:3000', '--no-autoupdate'],
        expect.any(Object),
      );
    });

    it('should check if cloudflared is executable before running', async () => {
      vi.mocked(System.exec).mockResolvedValue();

      await cloudflared.tunnel(3000, 'localhost', mockAbortController.signal);

      expect(Filesystem.isExecutable).toHaveBeenCalledWith('/mock/path/cloudflared');
    });
  });

  describe('exec retry logic with signal', () => {
    it('should retry with the same signal on failure', async () => {
      let callCount = 0;
      vi.mocked(System.exec).mockImplementation(async (bin, args, options) => {
        callCount++;
        if (callCount < 2) {
          if (options?.errorHandler) {
            await options.errorHandler(new Error('Connection failed'));
          }
        }
      });

      await cloudflared.tunnel(3000, 'localhost', mockAbortController.signal);

      expect(System.exec).toHaveBeenCalledTimes(2);

      expect(System.exec).toHaveBeenNthCalledWith(1, expect.any(String), expect.any(Array), expect.objectContaining({ signal: mockAbortController.signal }),
      );
      expect(System.exec).toHaveBeenNthCalledWith(2, expect.any(String), expect.any(Array), expect.objectContaining({ signal: mockAbortController.signal }),
      );
    });

    it('should handle errors without crashing', async () => {
      vi.mocked(System.exec).mockResolvedValue();

      await expect(cloudflared.tunnel(3000, 'localhost', mockAbortController.signal))
        .resolves
        .toBeUndefined();
    });
  });
});
