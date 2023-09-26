import { createServer } from 'net';
import { platform } from 'process';
import { execaCommand } from 'execa';
import stdout from './system/stdout';
import { getcols, stripln } from './helpers';

export async function isPortAvailable(port: string | number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once('error', (err: NodeJS.ErrnoException) => {
      server.close();

      if (err.code === 'EADDRINUSE') {
        resolve(false);
      }

      reject(err);
    });

    server.once('listening', () => {
      server.close();

      resolve(true);
    });

    server.listen(port);
  });
}

const PID_GETTER_CLASS_MAP = {
  async darwin(port: number | string): Promise<number | null> {
    const { stdout: out, stderr: err } = await execaCommand('netstat -anv -p TCP && netstat -anv -p UDP');

    const warning = err.toString().trim();
    warning && stdout.warn(warning);

    const line = stripln(out, 2);
    const col = getcols(line, [0, 3, 8], 10)
      .filter(col => !!col[0].match(/^(udp|tcp)/))
      .find((col) => {
        const matches = col[1].match(/\.(\d+)$/);

        return matches && matches[1] === String(port);
      });

    if (col && col[2].length) {
      return (parseInt(col[2], 10));
    }

    return null;
  },
  async linux(port: number | string): Promise<number | null> {
    const { stdout: out, stderr: err } = await execaCommand('netstat -tunlp');

    const warning = err.toString().trim();
    warning && stdout.warn(warning);

    const data = stripln(out.toString(), 2);
    const cols = getcols(data, [3, 6], 7).find((col) => {
      const matches = col[0].match(/:(\d+)$/);

      return matches && matches[1] === String(port);
    });

    if (cols && cols[1]) {
      const pid = cols[1].split('/', 1)[0];

      if (pid.length) {
        return parseInt(pid, 10);
      }
    }

    return null;
  },
  async win32(port: number | string): Promise<number | null> {
    const { stdout: out, stderr: err } = await execaCommand('netstat -ano');

    const warning = err.toString().trim();
    warning && stdout.warn(warning);

    const data = stripln(out.toString(), 4);
    const cols = getcols(data, [1, 4], 5).find((col) => {
      const matches = col[0].match(/:(\d+)$/);

      return matches && matches[1] === String(port);
    });

    if (cols && cols[1].length && parseInt(cols[1], 10) > 0) {
      return parseInt(cols[1], 10);
    }

    return null;
  },
};

export async function getPidByPort(port: number | string) {
  if (!(platform in PID_GETTER_CLASS_MAP)) {
    throw new Error('Unsupported platform, process will have to be killed manually.');
  }

  const getter = PID_GETTER_CLASS_MAP[platform as keyof typeof PID_GETTER_CLASS_MAP];

  return await getter(port);
}
