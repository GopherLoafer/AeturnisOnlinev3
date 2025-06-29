const express = require('express');
const db = require('../database');
const { requireCharacter } = require('../middleware/auth');

const router = express.Router();

// Dashboard - character selection or main game
router.get('/dashboard', async (req, res) => {
  try {
    // Check if user has characters
    const characters = await db.query('SELECT * FROM characters WHERE user_id = $1', [req.session.userId]);
    
    if (characters.rows.length === 0) {
      return res.redirect('/game/character-creation');
    }

    // If no character selected, show character selection
    if (!req.session.characterId) {
      return res.redirect('/game/character-select');
    }

    // Get current character with race info
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

    const character = result.rows[0];

    // Get weapon affinities
    const weaponAffinities = await db.query(
      'SELECT weapon_type, affinity_percentage FROM weapon_affinities WHERE character_id = $1',
      [character.id]
    );

    // Get magic affinities
    const magicAffinities = await db.query(
      'SELECT magic_school, affinity_percentage FROM magic_affinities WHERE character_id = $1',
      [character.id]
    );

    res.render('game/dashboard', {
      title: 'Game - Aeturnis Online',
      character,
      weaponAffinities: weaponAffinities.rows,
      magicAffinities: magicAffinities.rows,
      user: req.user
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Unable to load game dashboard'
    });
  }
});

// Character creation
router.get('/character-creation', async (req, res) => {
  try {
    const races = await db.query(`
      SELECT r.*, 
             COALESCE(array_agg(ra.ability_name) FILTER (WHERE ra.ability_name IS NOT NULL), '{}') as abilities
      FROM races r
      LEFT JOIN race_abilities ra ON r.id = ra.race_id
      GROUP BY r.id, r.name, r.description, r.str_modifier, r.int_modifier, r.vit_modifier, 
               r.dex_modifier, r.wis_modifier, r.starting_zone, r.experience_bonus, 
               r.magic_affinity_bonus, r.weapon_affinity_bonus, r.special_ability, 
               r.equipment_restrictions, r.regeneration_modifier, r.created_at
      ORDER BY r.name
    `);
    
    res.render('game/character-creation', {
      title: 'Create Character - Aeturnis Online',
      races: races.rows,
      error: null
    });
  } catch (error) {
    console.error('Character creation page error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Unable to load character creation'
    });
  }
});

// Character creation POST
router.post('/character-creation', async (req, res) => {
  const { name, raceId } = req.body;

  if (!name || !raceId) {
    const races = await db.query('SELECT * FROM races ORDER BY name');
    return res.render('game/character-creation', {
      title: 'Create Character - Aeturnis Online',
      races: races.rows,
      error: 'Character name and race are required'
    });
  }

  if (name.length < 3 || name.length > 20) {
    const races = await db.query('SELECT * FROM races ORDER BY name');
    return res.render('game/character-creation', {
      title: 'Create Character - Aeturnis Online',
      races: races.rows,
      error: 'Character name must be between 3 and 20 characters'
    });
  }

  try {
    // Check if character name is taken
    const existingChar = await db.query('SELECT id FROM characters WHERE name = $1', [name]);
    if (existingChar.rows.length > 0) {
      const races = await db.query('SELECT * FROM races ORDER BY name');
      return res.render('game/character-creation', {
        title: 'Create Character - Aeturnis Online',
        races: races.rows,
        error: 'Character name already exists'
      });
    }

    // Get race info
    const race = await db.query('SELECT * FROM races WHERE id = $1', [raceId]);
    if (race.rows.length === 0) {
      const races = await db.query('SELECT * FROM races ORDER BY name');
      return res.render('game/character-creation', {
        title: 'Create Character - Aeturnis Online',
        races: races.rows,
        error: 'Invalid race selection'
      });
    }

    const raceData = race.rows[0];

    // Calculate starting stats with race modifiers
    const baseStats = {
      str: 10 + raceData.str_modifier,
      int: 10 + raceData.int_modifier,
      vit: 10 + raceData.vit_modifier,
      dex: 10 + raceData.dex_modifier,
      wis: 10 + raceData.wis_modifier
    };

    const healthMax = 50 + (baseStats.vit * 10);
    const manaMax = 30 + (baseStats.int * 5);

    // Create character
    const result = await db.query(`
      INSERT INTO characters (
        user_id, race_id, name, str_base, int_base, vit_base, dex_base, wis_base,
        health_max, health_current, mana_max, mana_current, location_zone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10, $10, $11)
      RETURNING id
    `, [
      req.session.userId, raceId, name, 
      baseStats.str, baseStats.int, baseStats.vit, baseStats.dex, baseStats.wis,
      healthMax, manaMax, raceData.starting_zone
    ]);

    const characterId = result.rows[0].id;

    // Initialize weapon affinities
    const weaponTypes = ['Sword', 'Axe', 'Mace', 'Dagger', 'Staff', 'Bow', 'Unarmed'];
    for (const weaponType of weaponTypes) {
      await db.query(
        'INSERT INTO weapon_affinities (character_id, weapon_type) VALUES ($1, $2)',
        [characterId, weaponType]
      );
    }

    // Initialize magic affinities
    const magicSchools = ['Fire', 'Ice', 'Lightning', 'Earth', 'Holy', 'Dark', 'Arcane', 'Nature'];
    for (const magicSchool of magicSchools) {
      await db.query(
        'INSERT INTO magic_affinities (character_id, magic_school) VALUES ($1, $2)',
        [characterId, magicSchool]
      );
    }

    // Set as active character
    req.session.characterId = characterId;

    res.redirect('/game/dashboard');
  } catch (error) {
    console.error('Character creation error:', error);
    const races = await db.query('SELECT * FROM races ORDER BY name');
    res.render('game/character-creation', {
      title: 'Create Character - Aeturnis Online',
      races: races.rows,
      error: 'An error occurred while creating your character'
    });
  }
});

// Character selection
router.get('/character-select', async (req, res) => {
  try {
    const characters = await db.query(`
      SELECT c.*, r.name as race_name
      FROM characters c
      JOIN races r ON c.race_id = r.id
      WHERE c.user_id = $1
      ORDER BY c.last_active DESC
    `, [req.session.userId]);

    res.render('game/character-select', {
      title: 'Select Character - Aeturnis Online',
      characters: characters.rows
    });
  } catch (error) {
    console.error('Character select error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Unable to load characters'
    });
  }
});

// Character selection POST
router.post('/character-select', async (req, res) => {
  const { characterId } = req.body;

  try {
    // Verify character belongs to user
    const result = await db.query('SELECT id FROM characters WHERE id = $1 AND user_id = $2', [characterId, req.session.userId]);
    
    if (result.rows.length === 0) {
      return res.redirect('/game/character-select');
    }

    // Update last active
    await db.query('UPDATE characters SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [characterId]);

    req.session.characterId = parseInt(characterId);
    res.redirect('/game/dashboard');
  } catch (error) {
    console.error('Character select POST error:', error);
    res.redirect('/game/character-select');
  }
});

module.exports = router;