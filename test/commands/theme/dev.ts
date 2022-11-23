import { execa } from 'execa';
import { expect, it } from 'vitest';
import { io } from 'socket.io-client';
import config from '@/config';

export default () => {
  it('Should start Dev server', async () => {
    await execa('node', ['./dist/index.js', 'dev', '--preview']);

    const socket = io(`ws://localhost:${config.PREVIEW_SERVER_PORT}`);
    socket.on('connect', () => {
      expect(socket.connected).toBe(true);
    });
  });
};

