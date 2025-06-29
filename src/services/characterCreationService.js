/**
 * Character Creation Service
 * Handles multi-step character creation wizard logic
 */

const db = require('../database');
const startingZonesService = require('./startingZonesService');

class CharacterCreationService {
  constructor() {
    this.steps = [
      { id: 1, name: 'name', title: 'Character Name', template: 'step1-name' },
      { id: 2, name: 'race', title: 'Race Selection', template: 'step2-race' },
      { id: 3, name: 'background', title: 'Background Story', template: 'step3-background' },
      { id: 4, name: 'stats', title: 'Stat Allocation', template: 'step4-stats' },
      { id: 5, name: 'review', title: 'Final Review', template: 'step5-review' }
    ];
  }

  /**
   * Initialize a new character creation session
   */
  async initializeSession(userId) {
    try {
      // Clear any existing sessions for this user
      await db.query('DELETE FROM character_creation_sessions WHERE user_id = $1', [userId]);
      
      // Create new session
      const result = await db.query(`
        INSERT INTO character_creation_sessions (user_id, session_data, step, expires_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [userId, JSON.stringify({}), 1, new Date(Date.now() + 3600000)]); // 1 hour expiry
      
      return result.rows[0].id;
    } catch (error) {
      console.error('Error initializing creation session:', error);
      throw error;
    }
  }

  /**
   * Get current session data
   */
  async getSession(userId) {
    try {
      const result = await db.query(`
        SELECT * FROM character_creation_sessions 
        WHERE user_id = $1 AND expires_at > NOW()
        ORDER BY created_at DESC 
        LIMIT 1
      `, [userId]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting creation session:', error);
      return null;
    }
  }

  /**
   * Update session data for a step
   */
  async updateSession(userId, stepData, nextStep = null) {
    try {
      const session = await this.getSession(userId);
      if (!session) {
        throw new Error('No active creation session found');
      }

      const sessionData = typeof session.session_data === 'string' 
        ? JSON.parse(session.session_data || '{}') 
        : (session.session_data || {});
      Object.assign(sessionData, stepData);

      const step = nextStep || session.step;
      
      await db.query(`
        UPDATE character_creation_sessions 
        SET session_data = $1, step = $2, expires_at = $3
        WHERE user_id = $4
      `, [JSON.stringify(sessionData), step, new Date(Date.now() + 3600000), userId]);
      
      return { sessionData, step };
    } catch (error) {
      console.error('Error updating creation session:', error);
      throw error;
    }
  }

  /**
   * Validate character name
   */
  async validateName(name) {
    const errors = [];
    
    // Length validation
    if (!name || name.length < 3) {
      errors.push('Name must be at least 3 characters long');
    }
    if (name && name.length > 20) {
      errors.push('Name cannot exceed 20 characters');
    }
    
    // Character validation
    if (name && !/^[a-zA-Z0-9_-]+$/.test(name)) {
      errors.push('Name can only contain letters, numbers, underscores, and hyphens');
    }
    
    // Profanity filter (basic)
    const profanity = ['admin', 'moderator', 'system', 'null', 'undefined'];
    if (name && profanity.some(word => name.toLowerCase().includes(word))) {
      errors.push('Name contains restricted words');
    }
    
    // Check uniqueness
    if (name && errors.length === 0) {
      try {
        const existing = await db.query('SELECT id FROM characters WHERE LOWER(name) = LOWER($1)', [name]);
        if (existing.rows.length > 0) {
          errors.push('Name is already taken');
        }
      } catch (error) {
        console.error('Error checking name uniqueness:', error);
        errors.push('Unable to verify name availability');
      }
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Get all races with abilities
   */
  async getRaces() {
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
      
      return races.rows;
    } catch (error) {
      console.error('Error getting races:', error);
      throw error;
    }
  }

  /**
   * Get all character backgrounds
   */
  async getBackgrounds() {
    try {
      const backgrounds = await db.query(`
        SELECT * FROM character_backgrounds 
        ORDER BY name
      `);
      
      return backgrounds.rows.map(bg => ({
        ...bg,
        starting_items: bg.starting_items || [],
        stat_bonuses: bg.stat_bonuses || {}
      }));
    } catch (error) {
      console.error('Error getting backgrounds:', error);
      throw error;
    }
  }

  /**
   * Calculate starting stats based on race, background, and allocated points
   */
  calculateStartingStats(race, background, statAllocation = null) {
    const baseStats = { str: 10, int: 10, vit: 10, dex: 10, wis: 10 };
    
    // Apply race modifiers
    baseStats.str += race.str_modifier || 0;
    baseStats.int += race.int_modifier || 0;
    baseStats.vit += race.vit_modifier || 0;
    baseStats.dex += race.dex_modifier || 0;
    baseStats.wis += race.wis_modifier || 0;
    
    // Apply background bonuses
    if (background && background.stat_bonuses) {
      const bonuses = typeof background.stat_bonuses === 'string' 
        ? JSON.parse(background.stat_bonuses) 
        : background.stat_bonuses;
        
      baseStats.str += bonuses.str || 0;
      baseStats.int += bonuses.int || 0;
      baseStats.vit += bonuses.vit || 0;
      baseStats.dex += bonuses.dex || 0;
      baseStats.wis += bonuses.wis || 0;
    }
    
    // Apply allocated stat points from character creation step 4
    if (statAllocation) {
      baseStats.str += statAllocation.str || 0;
      baseStats.int += statAllocation.int || 0;
      baseStats.vit += statAllocation.vit || 0;
      baseStats.dex += statAllocation.dex || 0;
      baseStats.wis += statAllocation.wis || 0;
    }
    
    return baseStats;
  }

  /**
   * Create the character
   */
  async createCharacter(userId, sessionData) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Get race and background data
      const raceResult = await client.query('SELECT * FROM races WHERE id = $1', [sessionData.raceId]);
      const race = raceResult.rows[0];
      
      const backgroundResult = await client.query('SELECT * FROM character_backgrounds WHERE id = $1', [sessionData.backgroundId]);
      const background = backgroundResult.rows[0];
      
      // Calculate final stats including allocated points from step 4
      const stats = this.calculateStartingStats(race, background, sessionData.statAllocation);
      
      // Calculate starting health and mana
      const health = stats.vit * 10;
      const mana = Math.floor(stats.int * 5);
      
      // Calculate starting gold
      const backgroundGold = background ? background.starting_gold : 0;
      const backgroundBonuses = background ? background.stat_bonuses || {} : {};
      const goldBonus = backgroundBonuses.gold_bonus || 0;
      const startingGold = 100 + backgroundGold + goldBonus;
      
      // Create character
      const characterResult = await client.query(`
        INSERT INTO characters (
          user_id, race_id, name, level, experience, 
          str_base, int_base, vit_base, dex_base, wis_base,
          health_current, health_max, mana_current, mana_max,
          gold, location_zone, created_at, last_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
        RETURNING id
      `, [
        userId, sessionData.raceId, sessionData.name, 1, 25,
        stats.str, stats.int, stats.vit, stats.dex, stats.wis,
        health, health, mana, mana,
        startingGold, race.starting_zone
      ]);
      
      const characterId = characterResult.rows[0].id;
      
      // Assign tutorial quests
      const tutorialQuests = await client.query(`
        SELECT id FROM tutorial_quests 
        WHERE race_specific = false OR race_id = $1
        ORDER BY order_sequence
      `, [sessionData.raceId]);
      
      for (const quest of tutorialQuests.rows) {
        await client.query(`
          INSERT INTO character_tutorial_progress (character_id, quest_id, status)
          VALUES ($1, $2, 'assigned')
        `, [characterId, quest.id]);
      }
      
      // Phase 2.5: Initialize starting zone features
      await this.initializeStartingZoneFeatures(client, characterId, sessionData.raceId, race.starting_zone);
      
      // Apply first-time player bonuses
      await this.applyFirstTimePlayerBonuses(client, characterId);
      
      await client.query('COMMIT');
      
      // Clean up session
      await db.query('DELETE FROM character_creation_sessions WHERE user_id = $1', [userId]);
      
      return characterId;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating character:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Apply first-time player bonuses
   */
  async applyFirstTimePlayerBonuses(client, characterId) {
    try {
      // Check if this is the user's first character
      const characterCount = await client.query(`
        SELECT COUNT(*) FROM characters 
        WHERE user_id = (SELECT user_id FROM characters WHERE id = $1)
      `, [characterId]);
      
      if (parseInt(characterCount.rows[0].count) === 1) {
        // First character bonuses
        await client.query(`
          UPDATE characters 
          SET gold = gold + 200,
              experience = experience + 100
          WHERE id = $1
        `, [characterId]);
        
        console.log(`Applied first-time player bonuses to character ${characterId}`);
      }
    } catch (error) {
      console.error('Error applying first-time bonuses:', error);
      // Don't throw - bonuses are nice to have but not essential
    }
  }

  /**
   * Phase 2.5: Initialize starting zone features for new character
   */
  async initializeStartingZoneFeatures(client, characterId, raceId, zoneName) {
    try {
      // Grant starting equipment
      await startingZonesService.grantStartingEquipment(characterId, raceId);
      
      // Assign racial quests
      await startingZonesService.assignRacialQuests(characterId, raceId, zoneName);
      
      console.log(`Initialized starting zone features for character ${characterId} in ${zoneName}`);
    } catch (error) {
      console.error('Error initializing starting zone features:', error);
      // Don't throw - starting zone features are nice to have but not essential for character creation
    }
  }

  /**
   * Get step configuration
   */
  getStep(stepNumber) {
    return this.steps.find(step => step.id === stepNumber);
  }

  /**
   * Get all steps for navigation
   */
  getAllSteps() {
    return this.steps;
  }
}

module.exports = new CharacterCreationService();