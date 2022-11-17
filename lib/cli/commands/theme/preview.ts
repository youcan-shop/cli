import { createServer } from 'http';
import { cwd } from 'process';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import puppeteer from 'puppeteer';
import type { CLI, CommandDefinition } from '@/cli/commands/types';
import stdout from '@/utils/system/stdout';
import config from '@/config';
import { getCurrentThemeId } from '@/utils/common';

async function openPreviewPageInPuppeteer(themeId: string) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  await page.goto(`https://seller-area.youcan.shop/admin/themes/${themeId}/preview?template=index`);
  return page;
}

async function listenForThemeChange(themeId: string) {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const previewPage = await openPreviewPageInPuppeteer(themeId);

  io.on('connection', (socket: Socket) => {
    socket.on('theme:update', async () => {
      stdout.log('Theme change detected, reloading...');
      const start = Date.now();
      await previewPage.reload();
      stdout.info(`Reloaded in ${Date.now() - start}ms`);
    });
  });

  httpServer.listen(config.PREVIEW_SERVER_PORT);
}

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'preview',
    group: 'theme',
    description: 'Live preview for your theme',
    options: [],

    action: async () => {
      if (!cli.client.isAuthenticated())
        return stdout.error('You must be logged into a store to use this command.');

      const themeId = await getCurrentThemeId(cwd());

      if (!themeId)
        return stdout.error('No theme detected in the current directory.');

      listenForThemeChange(themeId);

      stdout.info('Preview browser opened, waiting for theme changes...');
    },
  };
}
