const express = require('express');
const db = require('../database');
const { requireCharacter } = require('../middleware/auth');
const LevelService = require('../levelService');
const characterCreationService = require('../services/characterCreationService');

const router = express.Router();
const levelService = new LevelService();

// Dashboard - character selection or main game
router.get('/dashboard', async (req, res) => {
  try {
    // Check if user has characters
    const characters = await db.query('SELECT * FROM characters WHERE user_id = $1', [req.session.userId]);
    
    if (characters.rows.length === 0) {
      return res.redirect('/game/character-creation-wizard');
    }

    // If no character selected, show character selection
    if (!req.session.characterId) {
      return res.redirect('/game/character-select');
    }

    // Get current character with race info and progression data
    const result = await db.query(`
      SELECT c.*, r.name as race_name, r.str_modifier, r.int_modifier, 
             r.vit_modifier, r.dex_modifier, r.wis_modifier,
             r.experience_bonus, r.special_ability
      FROM characters c
      JOIN races r ON c.race_id = r.id
      WHERE c.id = $1 AND c.user_id = $2
    `, [req.session.characterId, req.session.userId]);

    if (result.rows.length === 0) {
      req.session.characterId = null;
      return res.redirect('/game/character-select');
    }

    const character = result.rows[0];

    // Calculate total stats (base stats + equipment/bonuses)
    character.str_total = character.str_base || 10;
    character.int_total = character.int_base || 10;
    character.vit_total = character.vit_base || 10;
    character.dex_total = character.dex_base || 10;
    character.wis_total = character.wis_base || 10;

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

    // Get progression information
    const progressionInfo = await levelService.getProgressionInfo(character.id);

    res.render('game/dashboard', {
      title: 'Game - Aeturnis Online',
      character,
      weaponAffinities: weaponAffinities.rows,
      magicAffinities: magicAffinities.rows,
      progression: progressionInfo,
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

// Character creation (legacy - redirects to wizard)
router.get('/character-creation', async (req, res) => {
  res.redirect('/game/character-creation-wizard');
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
    const weaponTypes = ['sword', 'axe', 'mace', 'dagger', 'staff', 'bow', 'unarmed'];
    for (const weaponType of weaponTypes) {
      await db.query(
        'INSERT INTO weapon_affinities (character_id, weapon_type) VALUES ($1, $2)',
        [characterId, weaponType]
      );
    }

    // Initialize magic affinities
    const magicSchools = ['fire', 'ice', 'lightning', 'earth', 'holy', 'dark', 'arcane', 'nature'];
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

// ==============================================
// Phase 2.4: Character Creation Wizard Routes
// ==============================================

// Character creation wizard main route
router.get('/character-creation-wizard', async (req, res) => {
  try {
    const step = parseInt(req.query.step) || 1;
    
    // Validate step number
    if (step < 1 || step > 5) {
      return res.redirect('/game/character-creation-wizard?step=1');
    }
    
    // Get or initialize session
    let session = await characterCreationService.getSession(req.session.userId);
    if (!session) {
      await characterCreationService.initializeSession(req.session.userId);
      session = await characterCreationService.getSession(req.session.userId);
    }
    
    const sessionData = JSON.parse(session.session_data || '{}');
    const stepConfig = characterCreationService.getStep(step);
    
    // Get data needed for current step
    let stepData = { sessionData };
    
    if (step >= 2) {
      // Get races for step 2+
      stepData.races = await characterCreationService.getRaces();
    }
    
    if (step >= 3) {
      // Get backgrounds for step 3+
      stepData.backgrounds = await characterCreationService.getBackgrounds();
    }
    
    if (step >= 5) {
      // Get tutorial quests for step 5
      stepData.tutorialQuests = await db.query(`
        SELECT * FROM tutorial_quests 
        WHERE race_specific = false 
        ORDER BY order_sequence
      `).then(result => result.rows);
      
      // Check if this is first character
      const characterCount = await db.query(
        'SELECT COUNT(*) FROM characters WHERE user_id = $1',
        [req.session.userId]
      );
      stepData.isFirstCharacter = parseInt(characterCount.rows[0].count) === 0;
    }
    
    res.render('game/character-creation-wizard', {
      title: `Create Character - Step ${step} - Aeturnis Online`,
      currentStep: step,
      currentStepTemplate: stepConfig.template,
      stepNames: ['Name', 'Race', 'Background', 'Stats', 'Review'],
      ...stepData,
      error: null
    });
    
  } catch (error) {
    console.error('Character creation wizard error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load character creation wizard'
    });
  }
});

// API: Process wizard step
router.post('/api/character-creation/step', async (req, res) => {
  try {
    const { step, data } = req.body;
    
    // Validate step data based on step number
    let validationError = null;
    
    switch (step) {
      case 1: // Name validation
        if (!data.name) {
          validationError = 'Character name is required';
        } else {
          const nameValidation = await characterCreationService.validateName(data.name);
          if (!nameValidation.valid) {
            validationError = nameValidation.errors.join(', ');
          }
        }
        break;
        
      case 2: // Race validation
        if (!data.raceId) {
          validationError = 'Race selection is required';
        } else {
          const races = await characterCreationService.getRaces();
          const selectedRace = races.find(r => r.id == data.raceId);
          if (!selectedRace) {
            validationError = 'Invalid race selection';
          }
        }
        break;
        
      case 3: // Background validation
        if (!data.backgroundId) {
          validationError = 'Background selection is required';
        } else {
          const backgrounds = await characterCreationService.getBackgrounds();
          const selectedBackground = backgrounds.find(b => b.id == data.backgroundId);
          if (!selectedBackground) {
            validationError = 'Invalid background selection';
          }
        }
        break;
        
      case 4: // Stat allocation validation
        if (!data.statAllocation) {
          validationError = 'Stat allocation is required';
        } else {
          const allocation = data.statAllocation;
          const totalPoints = Object.values(allocation).reduce((sum, val) => sum + val, 0);
          if (totalPoints !== 5) {
            validationError = 'You must allocate exactly 5 stat points';
          }
          
          // Validate individual stats
          for (const [stat, points] of Object.entries(allocation)) {
            if (points < 0 || points > 5) {
              validationError = 'Invalid stat allocation';
              break;
            }
          }
        }
        break;
    }
    
    if (validationError) {
      return res.json({ success: false, error: validationError });
    }
    
    // Update session with step data
    const nextStep = step < 5 ? step + 1 : step;
    await characterCreationService.updateSession(req.session.userId, data, nextStep);
    
    res.json({ success: true, nextStep });
    
  } catch (error) {
    console.error('Character creation step error:', error);
    res.json({ success: false, error: 'An error occurred processing your request' });
  }
});

// API: Validate character name
router.post('/api/character-creation/validate-name', async (req, res) => {
  try {
    const { name } = req.body;
    const validation = await characterCreationService.validateName(name);
    res.json(validation);
  } catch (error) {
    console.error('Name validation error:', error);
    res.json({ valid: false, errors: ['Unable to validate name'] });
  }
});

// API: Create character from wizard
router.post('/api/character-creation/create', async (req, res) => {
  try {
    // Get session data
    const session = await characterCreationService.getSession(req.session.userId);
    if (!session || session.step < 5) {
      return res.json({ success: false, error: 'Character creation not complete' });
    }
    
    const sessionData = JSON.parse(session.session_data);
    
    // Validate all required data
    if (!sessionData.name || !sessionData.raceId || !sessionData.backgroundId || !sessionData.statAllocation) {
      return res.json({ success: false, error: 'Missing required character data' });
    }
    
    // Create character
    const characterId = await characterCreationService.createCharacter(req.session.userId, sessionData);
    
    // Set as active character
    req.session.characterId = characterId;
    
    res.json({ success: true, characterId });
    
  } catch (error) {
    console.error('Character creation final error:', error);
    res.json({ success: false, error: 'Failed to create character' });
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

// API endpoint for game state
router.get('/state', requireCharacter, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, r.name as race_name, r.str_modifier, r.int_modifier, 
             r.vit_modifier, r.dex_modifier, r.wis_modifier,
             r.experience_bonus, r.special_ability
      FROM characters c
      JOIN races r ON c.race_id = r.id
      WHERE c.id = $1 AND c.user_id = $2
    `, [req.session.characterId, req.session.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }

    const character = result.rows[0];
    const progressionInfo = await levelService.getProgressionInfo(character.id);

    // Calculate total stats for frontend display
    character.str_total = character.str_base || 10;
    character.int_total = character.int_base || 10;
    character.vit_total = character.vit_base || 10;
    character.dex_total = character.dex_base || 10;
    character.wis_total = character.wis_base || 10;

    // Character data prepared for frontend

    res.json({
      success: true,
      character: {
        ...character,
        experience_to_next: progressionInfo.experienceToNext,
        experience_progress: progressionInfo.currentLevelProgress  // Current exp in this level
      }
    });
  } catch (error) {
    console.error('Game state API error:', error);
    res.status(500).json({ success: false, error: 'Failed to get game state' });
  }
});

// API endpoint for movement
router.post('/move', requireCharacter, async (req, res) => {
  try {
    const { direction } = req.body;
    // Basic movement response - can be expanded later
    res.json({
      success: true,
      message: `You move ${direction}.`,
      location: 'Current Zone'
    });
  } catch (error) {
    console.error('Movement API error:', error);
    res.status(500).json({ success: false, error: 'Movement failed' });
  }
});

// API endpoint for actions
router.post('/action', requireCharacter, async (req, res) => {
  try {
    const { action } = req.body;
    let message = `You attempt to ${action}.`;
    
    // Basic action responses - can be expanded later
    switch(action) {
      case 'fight':
        message = 'You engage in combat!';
        break;
      case 'rest':
        message = 'You rest and recover some health and mana.';
        break;
      case 'cast':
        message = 'You cast a spell!';
        break;
      case 'map':
        message = 'You check your map.';
        break;
    }
    
    res.json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('Action API error:', error);
    res.status(500).json({ success: false, error: 'Action failed' });
  }
});

// API endpoint for chat
router.post('/chat', requireCharacter, async (req, res) => {
  try {
    const { message, channel } = req.body;
    // Basic chat response - can be expanded later
    res.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ success: false, error: 'Chat failed' });
  }
});

module.exports = router;