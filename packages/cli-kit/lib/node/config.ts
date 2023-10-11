// eslint-disable-next-line @typescript-eslint/ban-ts-comment
/** @ts-expect-error */
import Conf from 'conf';

class Manager<T extends { [key: string]: any }> {
  private readonly store: Conf;

  public constructor(options: { projectName?: string; cwd?: string }) {
    this.store = new Conf(options);
  }

  public get<TKey extends keyof T>(key: TKey): T[TKey] {
    return this.store.get(key);
  }

  public set<TKey extends keyof T>(key: TKey, value?: T[TKey]): void {
    this.store.set(key, value);
  }

  public delete<TKey extends keyof T>(key: TKey): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }
}

export function manager(options: { projectName?: string; cwd?: string }) {
  return new Manager(options);
}
