import { Writable } from 'stream';
import dayjs from 'dayjs';
import { UI } from '..';

export interface Interface {
  run(): Promise<void>
  boot(): Promise<void>
}

export class Logger extends Writable {
  private static currentColorIndex = 0;
  private static colors = ['yellow', 'cyan', 'magenta', 'green', 'blue', 'red'];

  private color: typeof Logger.colors[number];

  constructor(
    private type: string,
    color?: typeof Logger.colors[number],
  ) {
    super();
    this.color = color ?? Logger.pickAlternateColor();
  }

  write(chunk: unknown): boolean {
    if (!(chunk instanceof Buffer) && typeof chunk !== 'string') {
      return false;
    }

    const time = dayjs().format('HH:mm:ss:SSS');
    const lines = chunk.toString().split('\n').map(s => s.trim()).filter(s => s !== '');

    for (const line of lines) {
      UI.renderDevOutput.observable.emit({
        timestamp: time,
        color: this.color,
        label: Logger.pad(this.type, 10),
        buffer: line,
      });
    }

    return true;
  }

  private static pad(subject: string, length: number, char = ' ') {
    return subject.padStart(length, char);
  }

  private static pickAlternateColor(): typeof Logger.colors[number] {
    const picked = (Logger.currentColorIndex++) % Logger.colors.length;

    return Logger.colors[picked];
  }
}

export abstract class Abstract implements Interface {
  public abstract run(): Promise<void>;
  public abstract boot(): Promise<void>;
}
