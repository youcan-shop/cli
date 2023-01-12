import os from 'os';
import type { PathLike } from 'fs';
import fs from 'fs';
import path from 'path';
import kleur from 'kleur';
export const homeDir = os.homedir();

/**
 * Get youcan token from $HOME/.youcan file
 * @returns string - youcan token
 */
export async function getUserToken(): Promise<string> {
  const filePath = `${homeDir}/.youcan.json`;

  if (!fs.existsSync(filePath))
    throw new Error('You are not logged in. Please login first.');

  const data = await fs.promises.readFile(filePath, 'utf8');
  return JSON.parse(data).token;
}

export async function getCurrentThemeId(dir: PathLike): Promise<string | null> {
  const filepath = path.resolve(dir.toString(), '.youcan');

  if (!fs.existsSync(filepath))
    return null;

  return await fs.promises.readFile(filepath, 'utf-8')
    .then(b => JSON.parse(b).theme_id);
}

export class LoadingSpinner {
  timer: NodeJS.Timer | null;
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

  static async exec(message: string, closure: (spinner: LoadingSpinner) => Promise<void>) {
    const spinner = new LoadingSpinner(message).start();

    await closure(spinner);
    spinner.timer && spinner.stop();
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
