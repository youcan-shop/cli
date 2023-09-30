import { getSellerAreaHostname } from './host';

interface AdminSession {
  access_token: string
  refresh_token: string
}

export async function ensureAuthenticated(_env: NodeJS.ProcessEnv) {
  const host = getSellerAreaHostname();
}
