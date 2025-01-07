#!/usr/bin/env node
import process from 'node:process';

process.removeAllListeners('warning');

// eslint-disable-next-line import/first
import execCli from '../dist/index.js';

execCli(false);
