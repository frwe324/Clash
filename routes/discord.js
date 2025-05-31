const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { User } = require('../models/user');
const discordConfig = require('../config/discord');

// Exchange code for token and get user info
router.post('/callback', async (req, res) => {
  try {
    const { code } = req.body;

    // Exchange code for token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: discordConfig.clientId,
        client_secret: discordConfig.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: discordConfig.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const tokenData = await tokenResponse.json();

    // Get user info from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get Discord user info');
    }

    const discordUser = await userResponse.json();

    // Find or create user
    let user = await User.findOne({ discordId: discordUser.id });
    
    if (!user) {
      user = await User.create({
        discordId: discordUser.id,
        username: discordUser.username,
        email: discordUser.email,
        avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      });
    }

    // Create session
    req.session.userId = user._id;
    req.session.isLoggedIn = true;

    res.json({ success: true });
  } catch (error) {
    console.error('Discord auth error:', error);
    res.status(500).json({ 
      error: 'Discord authentication failed',
      details: error.message 
    });
  }
});

// Verify Discord token
router.post('/verify', verifyDiscordToken, (req, res) => {
  res.json({ valid: true });
});

module.exports = router; 