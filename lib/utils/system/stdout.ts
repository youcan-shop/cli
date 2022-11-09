const stdout = console;

export default {
  info: (arg: string) => stdout.info('\x1B[33m%s\x1B[0m', arg),
  warn: (arg: string) => stdout.warn('\x1B[43m%s\x1B[0m', arg),
  error: (arg: string) => stdout.error('\x1B[31m%s\x1B[0m', arg),
};
