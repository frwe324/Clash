const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const discordConfig = require('../config/discord');

// Generate Discord OAuth2 URL
router.get('/discord/url', (req, res) => {
  try {
    // Generate state parameter for security
    const state = crypto.randomBytes(16).toString('hex');
    req.session.discordState = state;

    // Construct Discord OAuth URL
    const url = new URL('https://discord.com/api/oauth2/authorize');
    url.searchParams.append('client_id', discordConfig.clientId);
    url.searchParams.append('redirect_uri', discordConfig.redirectUri);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', discordConfig.scopes.join(' '));
    url.searchParams.append('state', state);

    res.json({ url: url.toString() });
  } catch (error) {
    console.error('Error generating Discord URL:', error);
    res.status(500).json({ error: 'Failed to generate Discord login URL' });
  }
});

// Handle Discord callback
router.get('/discord/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    // Verify state parameter
    if (!state || state !== req.session.discordState) {
      throw new Error('Invalid state parameter');
    }

    // Clear state from session
    delete req.session.discordState;

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

    // Get user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userData = await userResponse.json();

    // Check if user exists in database
    let user = await User.findOne({ discordId: userData.id });

    if (!user) {
      // Create new user
      user = await User.create({
        discordId: userData.id,
        username: userData.username,
        email: userData.email,
        avatar: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`,
      });
    }

    // Create session
    req.session.userId = user._id;
    req.session.isLoggedIn = true;

    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Discord auth error:', error);
    res.redirect('/login?error=discord_auth_failed');
  }
});

module.exports = router; 