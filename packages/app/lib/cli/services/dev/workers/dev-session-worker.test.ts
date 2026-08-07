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
