const fetch = require('node-fetch');

// Verify Discord token middleware
const verifyDiscordToken = async (req, res, next) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token with Discord
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
};

module.exports = {
  verifyDiscordToken
}; 