import { createServer } from 'http';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import puppeteer from 'puppeteer';
import stdout from '@/utils/system/stdout';
import config from '@/config';
import messages from '@/config/messages';

async function openPreviewPage(themeId: string) {
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
  await page.goto(`${config.SELLER_AREA_WEB_BASE_URI}/admin/themes/${themeId}/preview?template=index`);
  return page;
}

export default async function previewTheme(themeId: string) {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const previewPage = await openPreviewPage(themeId);

  io.on('connection', (socket: Socket) => {
    socket.on('theme:update', async () => {
      stdout.log(messages.PREVIEW_THEME_UPDATED);
      const start = Date.now();
      await previewPage.reload({ waitUntil: 'domcontentloaded' });
      stdout.info(`${messages.PREVIEW_RELOADED}${Date.now() - start}ms`);
    });
  });

  httpServer.listen(config.PREVIEW_SERVER_PORT);
}

