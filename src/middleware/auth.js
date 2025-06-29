const db = require('../database');

const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }

  try {
    // Verify user still exists and is active
    const result = await db.query('SELECT id, username, is_admin FROM users WHERE id = $1', [req.session.userId]);
    
    if (result.rows.length === 0) {
      req.session.destroy();
      return res.redirect('/auth/login');
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).send('Authentication error');
  }
};

const requireAdmin = async (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }

  try {
    const result = await db.query('SELECT id, username, is_admin FROM users WHERE id = $1', [req.session.userId]);
    
    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      return res.status(403).render('error', { 
        title: 'Access Denied',
        message: 'Administrator access required'
      });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).send('Authentication error');
  }
};

const requireCharacter = async (req, res, next) => {
  if (!req.session.characterId) {
    return res.redirect('/game/character-select');
  }

  try {
    const result = await db.query(`
      SELECT c.*, r.name as race_name, r.str_modifier, r.int_modifier, 
             r.vit_modifier, r.dex_modifier, r.wis_modifier
      FROM characters c
      JOIN races r ON c.race_id = r.id
      WHERE c.id = $1 AND c.user_id = $2
    `, [req.session.characterId, req.session.userId]);
    
    if (result.rows.length === 0) {
      req.session.characterId = null;
      return res.redirect('/game/character-select');
    }

    req.character = result.rows[0];
    next();
  } catch (error) {
    console.error('Character middleware error:', error);
    res.status(500).send('Character authentication error');
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireCharacter
};