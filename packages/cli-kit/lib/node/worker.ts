import { Buffer } from 'node:buffer';
import { Writable } from 'node:stream';
import dayjs from 'dayjs';
import { UI } from '..';

export interface Interface {
  run: () => Promise<void>;
  boot: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export class Logger extends Writable {
  constructor(
    private readonly type: string,
    private readonly color: 'yellow' | 'cyan' | 'magenta' | 'green' | 'blue' | 'red' | 'dim',
  ) {
    super();
  }

  write(chunk: unknown): boolean {
    if (!(chunk instanceof Buffer) && typeof chunk !== 'string') {
      return false;
    }

    const time = dayjs().format('HH:mm:ss:SSS');
    const lines = chunk.toString().split('\n').map(s => s.trim()).filter(s => s !== '');

    for (const line of lines) {
      UI.renderDevOutput.outputSubject.emit({
        timestamp: time,
        color: this.color,
        label: this.type,
        buffer: line,
      });
    }

    return true;
  }
}

export abstract class Abstract implements Interface {
  public abstract run(): Promise<void>;
  public abstract boot(): Promise<void>;

  public async cleanup(): Promise<void> {

  }
}
