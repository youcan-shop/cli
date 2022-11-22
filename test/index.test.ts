import { describe } from 'vitest';
import loginTest from './commands/auth/login';
import logoutTest from './commands/auth/logout';
import initTest from './commands/commands/init';
import helpTest from './commands/help';

describe('YouCan CLI tests', () => {
  describe('--help command', helpTest);
  describe('auth:login command', loginTest);
  describe('theme:init command', initTest);
  describe('auth:logout command', logoutTest);
});
