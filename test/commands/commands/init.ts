import { execa } from 'execa';
import { expect, it } from 'vitest';
import messages from '@/config/messages';

export default () => {
  it('Should pull the starter theme in the current working directory', async () => {
    const { stdout } = await execa('node', ['./dist/index.js', 'init'], {
      input: '\r\r\r\r\r',
    });
    expect(stdout).toContain(messages.INIT_SUCCESS);
  });
};
