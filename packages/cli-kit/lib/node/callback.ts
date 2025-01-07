import type { Cli } from '..';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

type Callback = (listener: CallbackListener, error?: Error, state?: string, code?: string) => void;

interface CallbackListenerOptions {
  host: string;
  port: number;
  callback: Callback;
}

class CallbackListener {
  private port: number;
  private host: string;
  private server: Server;

  public constructor(options: CallbackListenerOptions) {
    this.port = options.port;
    this.host = options.host;

    this.server = this.create(options.callback);
  }

  public start(): void {
    this.server.listen({ port: this.port, host: this.host }, () => {});
  }

  public stop(): void {
    this.server.close();
  }

  private create(callback: Callback): Server {
    const server = async (request: IncomingMessage, response: ServerResponse) => {
      const respond = async (contents: string, error?: Error, state?: string, code?: string) => {
        response.write(contents);
        response.end();

        return callback(this, error, state, code);
      };
      const query = new URL(request.url!, `http://${request.headers.host}`).searchParams;

      if (!query.has('code')) {
        return respond('missing code in authorization callback');
      }

      if (!query.has('state')) {
        return respond('missing state in authorization callback');
      }

      return respond(
        'Successfully authenticated, you can now close this window.',
        undefined,
        query.get('code')!,
        query.get('state')!,
      );
    };

    return createServer(server);
  }
}

export async function listen(command: Cli.Command, host: string, port: number, url: string): Promise<{ code: string; state: string }> {
  return await new Promise<{ code: string; state: string }>((resolve, reject) => {
    const timeout = setTimeout(() => {
      command.output.info('Auto-open timed out, click below to open the login page:');
      command.output.url('Log in to YouCan Partners', url);
    }, 10_000);

    const callback: Callback = (listener, error, code, state) => {
      clearTimeout(timeout);

      setTimeout(() => {
        listener.stop();

        if (error) {
          return reject(error);
        }

        return resolve({ code: code as string, state: state as string });
      }, 500);
    };

    const listener = new CallbackListener({ host, port, callback });

    listener.start();
  });
}
