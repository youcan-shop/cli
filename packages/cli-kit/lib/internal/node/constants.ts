import envpaths from 'env-paths';

const identifier = 'youcan-cli';

export function cachedir() {
  if (process.env.XDG_CACHE_HOME) {
    return process.env.XDG_CACHE_HOME;
  }

  return envpaths(identifier).cache;
}

export const envvars = {
  env: 'YC_CLI_ENV',
};
