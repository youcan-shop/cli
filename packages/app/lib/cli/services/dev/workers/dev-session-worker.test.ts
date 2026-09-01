import type { App } from '@/types';
import { Http } from '@youcan/cli-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DevSessionWorker from './dev-session-worker';

vi.mock('@youcan/cli-kit', () => ({
  Env: { apiHostname: () => 'api.test' },
  Http: { put: vi.fn(), del: vi.fn() },
  Filesystem: { watch: vi.fn() },
  Worker: {
    Logger: class {
      write = vi.fn();
    },
    Abstract: class {},
  },
}));

vi.mock('@/cli/services/deploy/manifest', () => ({
  buildManifest: vi.fn().mockResolvedValue({ manifest: { app: { name: 'x' }, extensions: [] }, blobs: [] }),
}));

function manifestWith(files: Array<{ name: string; hash: string; size?: number }>) {
  return {
    manifest: {
      app: { name: 'x' },
      extensions: [
        {
          id: 'ext_1',
          handle: 'rating',
          type: 'theme',
          files: files.map(f => ({ type: 'blocks', name: f.name, extension: 'liquid', size: f.size ?? 10, hash: f.hash })),
        },
      ],
    },
    blobs: [],
  };
}

vi.mock('@/cli/services/deploy/upload', () => ({
  uploadMissingBlobs: vi.fn().mockResolvedValue(0),
}));

vi.mock('@/cli/services/extensions', () => ({
  ensureExtensionIds: vi.fn().mockResolvedValue(undefined),
}));

describe('devSessionWorker', () => {
  let worker: DevSessionWorker;

  beforeEach(() => {
    vi.clearAllMocks();

    const command = { controller: new AbortController() } as any;
    const app = { config: { id: 'app_1' }, extensions: [{ root: '/x', config: {} }] } as unknown as App;

    worker = new DevSessionWorker(command, app);
  });

  it('puts the whole manifest to the dev session', async () => {
    await (worker as any).sync();

    expect(Http.put).toHaveBeenCalledWith(
      'api.test/apps/app_1/dev-session',
      { body: JSON.stringify({ manifest: { app: { name: 'x' }, extensions: [] } }) },
    );
  });

  it('reports path keyed validation errors without crashing', async () => {
    vi.mocked(Http.put).mockRejectedValueOnce(
      new Error(JSON.stringify({ errors: { 'extensions/rating/blocks/star.liquid': ['schema must be valid json'] } })),
    );

    await expect((worker as any).sync()).resolves.toBeUndefined();

    const logger = (worker as any).logger;
    expect(logger.write).toHaveBeenCalledWith('[invalid] extensions/rating/blocks/star.liquid: schema must be valid json');
  });

  it('deletes the session on cleanup', async () => {
    vi.mocked(Http.del).mockResolvedValueOnce(undefined as never);

    await worker.cleanup();

    expect(Http.del).toHaveBeenCalledWith('api.test/apps/app_1/dev-session');
  });

  it('logs every file on the first sync and only the diff after', async () => {
    const { buildManifest } = await import('@/cli/services/deploy/manifest');
    const logger = (worker as any).logger;

    vi.mocked(buildManifest).mockResolvedValueOnce(
      manifestWith([{ name: 'star', hash: 'a' }, { name: 'banner', hash: 'b' }]) as any,
    );
    await (worker as any).sync();

    expect(logger.write).toHaveBeenCalledWith(expect.stringContaining('[pushed] rating/blocks/star.liquid'));
    expect(logger.write).toHaveBeenCalledWith(expect.stringContaining('[pushed] rating/blocks/banner.liquid'));

    logger.write.mockClear();

    vi.mocked(buildManifest).mockResolvedValueOnce(
      manifestWith([{ name: 'star', hash: 'a2', size: 20 }, { name: 'footer', hash: 'c' }]) as any,
    );
    await (worker as any).sync();

    expect(logger.write).toHaveBeenCalledWith(expect.stringContaining('[updated] rating/blocks/star.liquid'));
    expect(logger.write).toHaveBeenCalledWith(expect.stringContaining('[added] rating/blocks/footer.liquid'));
    expect(logger.write).toHaveBeenCalledWith(expect.stringContaining('[removed] rating/blocks/banner.liquid'));
  });

  it('logs nothing when nothing changed', async () => {
    const { buildManifest } = await import('@/cli/services/deploy/manifest');
    const logger = (worker as any).logger;

    vi.mocked(buildManifest).mockResolvedValue(manifestWith([{ name: 'star', hash: 'a' }]) as any);

    await (worker as any).sync();
    logger.write.mockClear();

    await (worker as any).sync();

    expect(logger.write).not.toHaveBeenCalled();
  });

  it('resyncs after a change that lands mid sync', async () => {
    let resolveFirst: () => void;
    vi.mocked(Http.put).mockImplementationOnce(() => new Promise((r) => {
      resolveFirst = () => r(undefined as never);
    }));

    const first = (worker as any).sync();
    await Promise.resolve();

    await (worker as any).sync();
    expect((worker as any).dirty).toBe(true);

    resolveFirst!();
    await first;

    expect((worker as any).timer).toBeDefined();
  });
});
