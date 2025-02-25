import { Services } from '../';

const cloudflared = new Services.Cloudflared();

console.log('Installing Cloudflared...');

await cloudflared.install();

console.log('Successfully Installed Cloudflared');
