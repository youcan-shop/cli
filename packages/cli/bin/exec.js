#!/usr/bin/env node

process.removeAllListeners('warning');

// eslint-disable-next-line import/first
import execCli from '../dist/index.js';

execCli(false);
