import kleur from 'kleur';

const stdout = console;

function log(arg: string) { return stdout.log(kleur.gray(arg)); }

function info(arg: string) { return log(kleur.blue(arg)); }

function warn(arg: string) { return log(kleur.yellow(arg)); }

function error(arg: string) { return log(kleur.bgRed().white(arg)); }

export default { log, info, warn, error };
