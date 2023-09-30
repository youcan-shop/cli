import { Config } from '../config';

interface Schema {
  session: string
}

export const { getSession } = new (class {
  config = new Config({ projectName: 'youcan-cli' });

  getSession = () => {
    return this.config.get('session');
  };

  setSession = (session: string) => {
    return this.config.set('session', session);
  };

  delSession = () => {
    return this.config.delete('session');
  };
})();
