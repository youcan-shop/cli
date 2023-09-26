import { truthy } from './context/helpers';
import { isDevelopment } from './context/local';

interface ExecOpts {
  moduleUrl: string
  development: boolean
}

function setupEnvVars(options: Pick<ExecOpts, 'development'>) {
  if (process.argv.includes('--verbose')) {
    process.env.DEBUG = process.env.DEBUG ?? '*';
  }

  if (options.development) {
    process.env.YC_CLI_ENV ??= 'development';
  }
}

function setupColorMode(): void {
  if (
    process.argv.includes('--no-color')
        || truthy(process.env.NO_COLOR)
        || truthy(process.env.YC_FLAG_NO_COLOR)
        || process.env.TERM === 'dumb'
  ) {
    process.env.FORCE_COLOR = '0';
  }
}

export async function exec(options: ExecOpts): Promise<void> {
  setupEnvVars(options);
  setupColorMode();

  const { run, settings, flush, Errors } = await import('@oclif/core');

  if (isDevelopment()) {
    settings.debug = true;
  }

  run(undefined, options.moduleUrl)
    .then(() => flush())
    .catch(err => Errors.handle(err));
}

export async function execCreate(cmdlet: string, options: ExecOpts): Promise<void> {
  setupEnvVars(options);

  const initIndex = process.argv
    .findIndex(arg => arg.includes('init'));

  if (initIndex === -1) {
    const initIndex = process.argv
      .findIndex(arg => arg.match(new RegExp(`bin(\\/|\\\\)+(create-${cmdlet}|dev|exec)`))) + 1;

    process.argv.splice(initIndex, 0, 'init');
  }

  await exec(options);
}
