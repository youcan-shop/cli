import http from 'http';

const CALLBACK_TIMEOUT = 10000;
// Todo: check port availability
const SERVER_PORT = 3000;

/**
 * Spin up a local server to handle the OAuth redirect. Times out after 10 seconds.
 * @returns A promise that resolves when the code is received.
*/

function callbackServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const { url } = req;
      const code = url?.split('=')[1];
      res.end(`${code}`);
      server.close();
      resolve(code);
    });
    server.listen(SERVER_PORT);
    setTimeout(() => {
      server.close();
      reject(new Error('Timeout'));
    }, CALLBACK_TIMEOUT);
  });
}

export default async function loginCommand() {
  const code = await callbackServer();
  // eslint-disable-next-line no-console
  console.log('Recieved:', code);
}
