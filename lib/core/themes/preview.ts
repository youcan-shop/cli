import { createServer } from 'http';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import type { Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import stdout from '@/utils/system/stdout';
import config from '@/config';

/**
 * Starts a chromium browser and opens the given url.
 * @param url string - URL to preview
 * @returns Promise<Page> - Puppeteer page
 */
async function openPreviewPage(url: string): Promise<Page> {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    userDataDir: '/tmp/youcan_puppeteer',
  });

  browser.on('disconnected', () => {
    stdout.info('Browser closed');

    return process.exit(0);
  });

  const page = await browser.newPage();

  await page.goto(url);

  return page;
}

/**
 * Connect to the preview server to reload the preview page once an update event is received.
 * @param url string - URL to preview
 */
export default async function previewTheme(url: string) {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const previewPage = await openPreviewPage(url);

  io.on('connection', (socket: Socket) => {
    socket.on('theme:update', async () => {
      await previewPage.reload({ waitUntil: 'domcontentloaded' });
    });
  });

  httpServer.listen(config.PREVIEW_SERVER_PORT);
}

