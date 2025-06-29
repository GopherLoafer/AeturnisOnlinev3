const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const db = require('../database');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth
  message: 'Too many authentication attempts, please try again later.'
});

// Login page
router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/game/dashboard');
  }
  res.render('auth/login', { 
    title: 'Login - Aeturnis Online',
    error: null,
    success: null
  });
});

// Login POST
router.post('/login', authLimiter, async (req, res) => {
  const { username, password, remember } = req.body;

  try {
    // Find user
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.render('auth/login', {
        title: 'Login - Aeturnis Online',
        error: 'Invalid username or password',
        success: null
      });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.render('auth/login', {
        title: 'Login - Aeturnis Online',
        error: 'Invalid username or password',
        success: null
      });
    }

    // Update last login
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Set session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.isAdmin = user.is_admin;

    // Handle remember me
    if (remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    res.redirect('/game/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', {
      title: 'Login - Aeturnis Online',
      error: 'An error occurred during login',
      success: null
    });
  }
});

// Register page
router.get('/register', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/game/dashboard');
  }
  res.render('auth/register', { 
    title: 'Register - Aeturnis Online',
    error: null,
    success: null
  });
});

// Register POST
router.post('/register', authLimiter, async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Basic validation
  if (!username || !email || !password || !confirmPassword) {
    return res.render('auth/register', {
      title: 'Register - Aeturnis Online',
      error: 'All fields are required',
      success: null
    });
  }

  if (password !== confirmPassword) {
    return res.render('auth/register', {
      title: 'Register - Aeturnis Online',
      error: 'Passwords do not match',
      success: null
    });
  }

  if (password.length < 6) {
    return res.render('auth/register', {
      title: 'Register - Aeturnis Online',
      error: 'Password must be at least 6 characters long',
      success: null
    });
  }

  if (username.length < 3 || username.length > 20) {
    return res.render('auth/register', {
      title: 'Register - Aeturnis Online',
      error: 'Username must be between 3 and 20 characters',
      success: null
    });
  }

  try {
    // Check if username or email already exists
    const existingUser = await db.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    
    if (existingUser.rows.length > 0) {
      return res.render('auth/register', {
        title: 'Register - Aeturnis Online',
        error: 'Username or email already exists',
        success: null
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [username, email, passwordHash]
    );

    const userId = result.rows[0].id;

    // Set session
    req.session.userId = userId;
    req.session.username = username;
    req.session.isAdmin = false;

    res.redirect('/game/character-creation');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('auth/register', {
      title: 'Register - Aeturnis Online',
      error: 'An error occurred during registration',
      success: null
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

module.exports = router;