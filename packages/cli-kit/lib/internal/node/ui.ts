import process from 'node:process';
import kleur from 'kleur';

export class Loader {
  timer: NodeJS.Timeout | null;
  constructor(private message: string) {
    this.message = message;
    this.timer = null;
  }

  start() {
    process.stdout.write('\x1B[?25l');
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;

    this.timer = setInterval(() => {
      process.stdout.write(`\r${frames[i = ++i % frames.length]} ${this.message}`);
    }, 100);

    return this;
  }

  private flush() {
    process.stdout.write('\x1B[?25h');
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  stop() {
    this.flush();

    process.stdout.write('\r');
    process.stdout.write(kleur.green(`✔ ${this.message}\n`));

    return this;
  }

  error(message: string | null = null) {
    this.flush();

    process.stdout.write('\r');
    process.stdout.write(kleur.red(`✖ ${message ?? this.message}\n`));

    return this;
  }

  static async exec(message: string, closure: (loader: Loader) => Promise<void>) {
    const loader = new Loader(message).start();

    await closure(loader);
    loader.timer && loader.stop();
  }
}
