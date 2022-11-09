export interface WatchOptions {
  cwd: string
}

export type WatchEvents = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
