import { Writable } from 'stream';
import { stderr, stdout } from 'process';
import dayjs from 'dayjs';
import type { Color } from '..';

export interface Interface {
  run(): Promise<void>
  boot(): Promise<void>
}

export class Logger extends Writable {
  constructor(
    private channel: 'stdout' | 'stderr',
    private type: string,
    private color: Color.Color,
  ) {
    super();
  }

  write(chunk: unknown): boolean {
    if (!(chunk instanceof Buffer) && typeof chunk !== 'string') {
      return false;
    }

    const channel = this.channel === 'stdout' ? stdout : stderr;

    const time = dayjs().format('HH:mm:ss:SSS');
    const lines = chunk.toString().split('\n').map(s => s.trim()).filter(s => s !== '');

    for (let i = 0; i < lines.length; i++) {
      i === 0
        ? channel.write(this.color(`${time} | ${this.pad(this.type, 10)} | ${lines[i]}\n`))
        : channel.write(this.color(`                          | ${lines[i]}\n`));
    }

    return true;
  }

  private pad(subject: string, length: number, char = ' ') {
    return subject.padEnd(length, char);
  }
}

export abstract class Abstract implements Interface {
  public abstract boot(): Promise<void>;
  public abstract run(): Promise<void>;
}
