const express = require('express');
const db = require('../database');

const router = express.Router();

// Admin dashboard
router.get('/', async (req, res) => {
  try {
    // Get basic stats
    const userCount = await db.query('SELECT COUNT(*) FROM users');
    const characterCount = await db.query('SELECT COUNT(*) FROM characters');
    const activeSessionsCount = await db.query('SELECT COUNT(DISTINCT character_id) FROM game_sessions WHERE last_activity > NOW() - INTERVAL \'1 hour\'');
    const recentMessages = await db.query(`
      SELECT cm.message, cm.created_at, c.name as character_name
      FROM chat_messages cm
      JOIN characters c ON cm.character_id = c.id
      ORDER BY cm.created_at DESC
      LIMIT 10
    `);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard - Aeturnis Online',
      stats: {
        users: userCount.rows[0].count,
        characters: characterCount.rows[0].count,
        activeSessions: activeSessionsCount.rows[0].count
      },
      recentMessages: recentMessages.rows,
      user: req.user
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Unable to load admin dashboard'
    });
  }
});

// User management
router.get('/users', async (req, res) => {
  try {
    const users = await db.query(`
      SELECT u.*, COUNT(c.id) as character_count
      FROM users u
      LEFT JOIN characters c ON u.id = c.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.render('admin/users', {
      title: 'User Management - Admin',
      users: users.rows,
      user: req.user
    });
  } catch (error) {
    console.error('Admin users page error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Unable to load user management'
    });
  }
});

// Character management
router.get('/characters', async (req, res) => {
  try {
    const characters = await db.query(`
      SELECT c.*, u.username, r.name as race_name
      FROM characters c
      JOIN users u ON c.user_id = u.id
      JOIN races r ON c.race_id = r.id
      ORDER BY c.created_at DESC
    `);

    res.render('admin/characters', {
      title: 'Character Management - Admin',
      characters: characters.rows,
      user: req.user
    });
  } catch (error) {
    console.error('Admin characters page error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Unable to load character management'
    });
  }
});

// Chat monitoring
router.get('/chat', async (req, res) => {
  try {
    const messages = await db.query(`
      SELECT cm.*, c.name as character_name, u.username
      FROM chat_messages cm
      JOIN characters c ON cm.character_id = c.id
      JOIN users u ON c.user_id = u.id
      ORDER BY cm.created_at DESC
      LIMIT 100
    `);

    res.render('admin/chat', {
      title: 'Chat Monitoring - Admin',
      messages: messages.rows,
      user: req.user
    });
  } catch (error) {
    console.error('Admin chat page error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Unable to load chat monitoring'
    });
  }
});

// Server message broadcast
router.post('/broadcast', async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  try {
    // Log admin action
    await db.query(
      'INSERT INTO admin_actions (admin_user_id, action_type, description) VALUES ($1, $2, $3)',
      [req.user.id, 'broadcast', `Broadcast message: ${message}`]
    );

    // In a real implementation, this would send to all connected clients
    // For now, we'll just log it
    console.log(`Admin broadcast from ${req.user.username}: ${message}`);

    res.json({ success: true, message: 'Broadcast sent successfully' });
  } catch (error) {
    console.error('Admin broadcast error:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// Ban user
router.post('/ban-user/:userId', async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  try {
    // Update user status (in a real implementation, you'd add a banned flag)
    await db.query('UPDATE users SET is_admin = false WHERE id = $1', [userId]);

    // Log admin action
    await db.query(
      'INSERT INTO admin_actions (admin_user_id, action_type, target_user_id, description) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'ban_user', userId, reason || 'No reason provided']
    );

    res.json({ success: true, message: 'User banned successfully' });
  } catch (error) {
    console.error('Admin ban user error:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// Admin actions log
router.get('/actions', async (req, res) => {
  try {
    const actions = await db.query(`
      SELECT aa.*, u.username as admin_username, tu.username as target_username, c.name as target_character_name
      FROM admin_actions aa
      JOIN users u ON aa.admin_user_id = u.id
      LEFT JOIN users tu ON aa.target_user_id = tu.id
      LEFT JOIN characters c ON aa.target_character_id = c.id
      ORDER BY aa.created_at DESC
      LIMIT 100
    `);

    res.render('admin/actions', {
      title: 'Admin Actions Log - Admin',
      actions: actions.rows,
      user: req.user
    });
  } catch (error) {
    console.error('Admin actions page error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Unable to load admin actions'
    });
  }
});

// API Endpoints for Admin Templates

// API: Get users data
router.get('/api/users', async (req, res) => {
  try {
    const users = await db.query(`
      SELECT u.*, COUNT(c.id) as character_count
      FROM users u
      LEFT JOIN characters c ON u.id = c.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(users.rows);
  } catch (error) {
    console.error('API users error:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// API: Get characters data
router.get('/api/characters', async (req, res) => {
  try {
    const characters = await db.query(`
      SELECT c.*, u.username, r.name as race_name
      FROM characters c
      JOIN users u ON c.user_id = u.id
      JOIN races r ON c.race_id = r.id
      ORDER BY c.created_at DESC
      LIMIT 500
    `);
    res.json(characters.rows);
  } catch (error) {
    console.error('API characters error:', error);
    res.status(500).json({ error: 'Failed to load characters' });
  }
});

// API: Get chat messages data
router.get('/api/chat-messages', async (req, res) => {
  try {
    const messages = await db.query(`
      SELECT cm.*, c.name as character_name, u.username
      FROM chat_messages cm
      JOIN characters c ON cm.character_id = c.id
      JOIN users u ON c.user_id = u.id
      ORDER BY cm.created_at DESC
      LIMIT 200
    `);
    res.json(messages.rows);
  } catch (error) {
    console.error('API chat messages error:', error);
    res.status(500).json({ error: 'Failed to load chat messages' });
  }
});

module.exports = router;