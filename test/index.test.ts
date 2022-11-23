import { existsSync, rmdirSync } from 'fs';
import { describe, expect, it } from 'vitest';
import loginTest from './commands/auth/login';
import logoutTest from './commands/auth/logout';
import initTest from './commands/theme/init';
import helpTest from './commands/help';
import devTest from './commands/theme/dev';

describe('YouCan CLI tests', () => {
  describe('initialization', () => {
    it('remove the Starter theme', async () => {
      if (existsSync('Starter'))
        rmdirSync('Starter', { recursive: true });
      expect(existsSync('Starter')).toBe(false);
    });
  });
  describe('--help command', helpTest);
  describe('auth:login command', loginTest);
  describe('theme:init command', initTest);
  describe('theme:dev command', devTest);
  describe('auth:logout command', logoutTest);
});
