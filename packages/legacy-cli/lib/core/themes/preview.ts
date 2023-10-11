import { createServer } from 'http';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import puppeteer from 'puppeteer';
import stdout from '@/utils/system/stdout';
import config from '@/config';

async function openPreviewPage(url: string, disableHardwareAcceleration: string) {
  const options: Record<string, any> = {
    headless: false,
    defaultViewport: null,
    userDataDir: '/tmp/youcan_puppeteer',
  };

  if (disableHardwareAcceleration) {
    options.args = ['--disable-gpu'];
  }

  const browser = await puppeteer.launch(options);

  browser.on('disconnected', () => {
    stdout.info('Browser closed');

    return process.exit(0);
  });

  const page = await browser.newPage();

  await page.goto(url);

  return page;
}

export default async function previewTheme(url: string, options: Record<string, string>) {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const previewPage = await openPreviewPage(url, options.disableHardwareAcceleration);

  io.on('connection', (socket: Socket) => {
    socket.on('theme:update', async () => {
      await previewPage.reload({ waitUntil: 'domcontentloaded' });
    });
  });

  httpServer.listen(config.PREVIEW_SERVER_PORT);
}
