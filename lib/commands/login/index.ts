import openLink from '../../utils/openLink';

const authorizationUrl = 'https://seller-area.youcan.shop/admin/oauth/authorize?client_id=1&redirect_uri=http://localhost:1337/callback&response_type=code&scope=*';

export default function loginCommand() {
  openLink(authorizationUrl);
}
