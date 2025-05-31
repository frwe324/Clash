module.exports = {
  clientId: '1378192240324640801',
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  redirectUri: process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com/api/auth/discord/callback'
    : 'http://127.0.0.1:5500/public/dashboard.html',
  scopes: ['identify', 'email'],
}; 