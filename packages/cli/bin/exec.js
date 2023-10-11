#!/usr/bin/env node

process.removeAllListeners('warning');
process.env.YC_CLI_HOST_ENV = 'prod';

// eslint-disable-next-line import/first
import execCli from '../dist/index.js';

execCli(false);
