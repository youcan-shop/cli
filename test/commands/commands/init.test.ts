import fs from 'fs';
import { execa } from 'execa';
import { describe, expect, it } from 'vitest';
import config from '@/config';

describe('init command', () => {
  it('Should pull the starter theme in the current working directory', async () => {
    // run init command by passingd default name and click 3 times on enter
    const { stdout } = await execa('node', ['./dist/index.js', 'init'], {
      input: '\r\r\r\r\r',
    });

    expect(stdout).toContain('You have successfully created a new theme.');
  });
});
