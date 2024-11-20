#!/usr/bin/env node

process.removeAllListeners('warning');

// eslint-disable-next-line import/first
import execCreateAppCli from '../dist/index.js';

execCreateAppCli(false);
