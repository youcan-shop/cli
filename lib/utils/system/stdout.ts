import kleur from 'kleur';

const stdout = console;

/**
 * Print to standard output with meaningful colors
 */

function log(arg: string) { return stdout.log(kleur.gray(arg)); }

function info(arg: string) { return log(kleur.blue(arg)); }

function warn(arg: string) { return log(kleur.yellow(arg)); }

function error(arg: string) { return log(kleur.bgRed().white(arg)); }

function success(arg: string) { return log(kleur.green(arg)); }

function clear() { return stdout.clear(); }

function table(arg: any) { return stdout.table(arg); }

export default { log, info, warn, error, clear, success, table };
