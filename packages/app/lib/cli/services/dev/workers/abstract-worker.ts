import { Writable } from 'stream';
import { stderr, stdout } from 'process';
import type { Color } from '@youcan/cli-kit';
import dayjs from 'dayjs';
import type { Worker } from './index';

export class WorkerLogger extends Writable {
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

    const time = dayjs().format('HH:mm:SSS');
    const lines = chunk.toString().split('\n').map(s => s.trim()).filter(s => s !== '');

    for (let i = 0; i < lines.length; i++) {
      i === 0
        ? channel.write(this.color(`${time} [ ${this.center(this.type, 10)} ] ${lines[i]}\n`))
        : channel.write(this.color(`                         ${lines[i]}\n`));
    }

    return true;
  }

  private center(subject: string, length: number, char = ' ') {
    return subject.padStart((subject.length + length) / 2, char).padEnd(length, char);
  }
}

export default abstract class AbstractWorker implements Worker {
  public abstract boot(): Promise<void>;
  public abstract run(): Promise<void>;
}
