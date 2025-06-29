/**
 * Combat Service
 * Phase 3.1: Turn-Based Combat with Spam Prevention
 * Handles combat mechanics, cooldowns, and anti-spam measures
 */

const database = require('../database');

class CombatService {
  constructor() {
    this.db = database;
    // Cooldown settings (in milliseconds)
    this.GLOBAL_COOLDOWN = 1500; // 1.5 seconds between actions
    this.SPAM_WINDOW = 5000; // 5 second window for spam detection
    this.MAX_ACTIONS_PER_WINDOW = 5; // Max actions in spam window
    this.TEMP_LOCK_DURATION = 30000; // 30 second lock for spammers
    this.LATENCY_COMPENSATION = 100; // 100ms latency compensation
  }

  /**
   * Check if player can perform an action (spam prevention)
   */
  async checkCooldown(characterId) {
    try {
      // Get or create cooldown record
      let cooldownResult = await this.db.query(
        `SELECT * FROM player_cooldowns WHERE character_id = $1`,
        [characterId]
      );

      if (cooldownResult.rows.length === 0) {
        // Create new cooldown record
        await this.db.query(
          `INSERT INTO player_cooldowns (character_id) VALUES ($1)`,
          [characterId]
        );
        return { canAct: true, remainingCooldown: 0 };
      }

      const cooldown = cooldownResult.rows[0];
      const now = new Date();

      // Check if temporarily locked
      if (cooldown.temp_locked_until && new Date(cooldown.temp_locked_until) > now) {
        const remainingLock = Math.ceil((new Date(cooldown.temp_locked_until) - now) / 1000);
        return { 
          canAct: false, 
          reason: 'spam_lock', 
          remainingLock,
          message: `You are temporarily locked due to spamming. Wait ${remainingLock} seconds.`
        };
      }

      // Check global cooldown
      if (cooldown.cooldown_until && new Date(cooldown.cooldown_until) > now) {
        const remainingCooldown = Math.ceil((new Date(cooldown.cooldown_until) - now) / 1000);
        return { 
          canAct: false, 
          reason: 'cooldown',
          remainingCooldown,
          message: `Action on cooldown. Wait ${remainingCooldown} seconds.`
        };
      }

      // Check spam detection
      const windowStart = new Date(now.getTime() - this.SPAM_WINDOW);
      if (new Date(cooldown.last_action_time) > windowStart) {
        if (cooldown.action_count >= this.MAX_ACTIONS_PER_WINDOW) {
          // Apply temporary lock
          const lockUntil = new Date(now.getTime() + this.TEMP_LOCK_DURATION);
          await this.db.query(
            `UPDATE player_cooldowns 
             SET temp_locked_until = $1, spam_warnings = spam_warnings + 1, updated_at = NOW()
             WHERE character_id = $2`,
            [lockUntil, characterId]
          );
          return { 
            canAct: false, 
            reason: 'spam_lock',
            remainingLock: 30,
            message: 'Too many actions! You have been temporarily locked for 30 seconds.'
          };
        }
      }

      return { canAct: true, remainingCooldown: 0 };
    } catch (error) {
      console.error('Error checking cooldown:', error);
      throw error;
    }
  }

  /**
   * Update cooldown after action
   */
  async updateCooldown(characterId) {
    try {
      const now = new Date();
      const cooldownUntil = new Date(now.getTime() + this.GLOBAL_COOLDOWN - this.LATENCY_COMPENSATION);
      const windowStart = new Date(now.getTime() - this.SPAM_WINDOW);

      // Get current cooldown record
      const cooldownResult = await this.db.query(
        `SELECT * FROM player_cooldowns WHERE character_id = $1`,
        [characterId]
      );

      const cooldown = cooldownResult.rows[0];
      let actionCount = 1;

      // If last action was within spam window, increment count
      if (new Date(cooldown.last_action_time) > windowStart) {
        actionCount = cooldown.action_count + 1;
      }

      // Update cooldown record
      await this.db.query(
        `UPDATE player_cooldowns 
         SET last_action_time = $1, cooldown_until = $2, action_count = $3, updated_at = NOW()
         WHERE character_id = $4`,
        [now, cooldownUntil, actionCount, characterId]
      );

      return { cooldownUntil, actionCount };
    } catch (error) {
      console.error('Error updating cooldown:', error);
      throw error;
    }
  }

  /**
   * Start a combat session
   */
  async startCombat(attackerId, targetId, targetType = 'monster') {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Check if already in combat
      const existingCombat = await client.query(
        `SELECT * FROM combat_sessions 
         WHERE attacker_id = $1 AND session_status = 'active'`,
        [attackerId]
      );

      if (existingCombat.rows.length > 0) {
        throw new Error('Already in combat!');
      }

      // Create new combat session
      const sessionResult = await client.query(
        `INSERT INTO combat_sessions (attacker_id, defender_id, defender_type, monster_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [attackerId, targetType === 'player' ? targetId : null, targetType, 
         targetType === 'monster' ? targetId : null]
      );

      const session = sessionResult.rows[0];

      // If fighting a monster, mark it as in combat
      if (targetType === 'monster') {
        await client.query(
          `UPDATE monster_spawns SET status = 'in_combat', last_combat = NOW()
           WHERE id = $1`,
          [targetId]
        );
      }

      await client.query('COMMIT');
      return session;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error starting combat:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Perform a combat action
   */
  async performCombatAction(characterId, sessionId, actionType, actionData) {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Get combat session
      const sessionResult = await client.query(
        `SELECT * FROM combat_sessions WHERE id = $1 AND session_status = 'active'`,
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        throw new Error('Combat session not found or already ended');
      }

      const session = sessionResult.rows[0];

      // Verify character is in this combat
      if (session.attacker_id !== characterId && session.defender_id !== characterId) {
        throw new Error('You are not in this combat!');
      }

      // Queue the action
      await client.query(
        `INSERT INTO combat_queue (session_id, character_id, action_type, action_data)
         VALUES ($1, $2, $3, $4)`,
        [sessionId, characterId, actionType, JSON.stringify(actionData)]
      );

      // Process the action immediately (for now - can be made async later)
      const result = await this.processCombatAction(client, session, characterId, actionType, actionData);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error performing combat action:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process a combat action (calculate damage, apply effects, etc.)
   */
  async processCombatAction(client, session, actorId, actionType, actionData) {
    // Get character stats
    const charResult = await client.query(
      `SELECT c.*, r.name as race_name, r.str_modifier, r.int_modifier, r.vit_modifier, r.dex_modifier, r.wis_modifier
       FROM characters c
       JOIN races r ON c.race_id = r.id
       WHERE c.id = $1`,
      [actorId]
    );

    const character = charResult.rows[0];
    const totalStr = character.str + character.str_modifier;
    
    let damage = 0;
    let dodged = false;
    let critical = false;
    let message = '';

    switch (actionType) {
      case 'attack':
        // Basic attack calculation
        damage = Math.floor(totalStr * 1.5 + Math.random() * 10);
        
        // Critical hit chance (base 5% + DEX bonus)
        const critChance = 0.05 + (character.dex + character.dex_modifier) * 0.001;
        if (Math.random() < critChance) {
          critical = true;
          damage *= 2;
          message = 'Critical hit!';
        }

        // Apply damage to target
        if (session.defender_type === 'monster') {
          const monsterResult = await client.query(
            `UPDATE monster_spawns 
             SET current_health = GREATEST(0, current_health - $1)
             WHERE id = $2
             RETURNING *`,
            [damage, session.monster_id]
          );

          const monster = monsterResult.rows[0];
          
          // Check if monster died
          if (monster.current_health <= 0) {
            await this.endCombat(client, session.id, actorId, 'player');
            message += ` Victory! The monster has been defeated!`;
          }
        }
        break;

      case 'spell':
        // Magic damage calculation
        const totalInt = character.int + character.int_modifier;
        damage = Math.floor(totalInt * 2 + Math.random() * 15);
        
        // Deduct mana
        const manaCost = actionData.manaCost || 10;
        await client.query(
          `UPDATE characters SET mana_current = GREATEST(0, mana_current - $1) WHERE id = $2`,
          [manaCost, actorId]
        );
        break;

      case 'flee':
        // Attempt to flee
        const fleeDex = character.dex + character.dex_modifier;
        const fleeChance = 0.3 + fleeDex * 0.01;
        
        if (Math.random() < fleeChance) {
          await this.endCombat(client, session.id, null, null, 'fled');
          message = 'You successfully fled from combat!';
        } else {
          message = 'Failed to flee!';
        }
        break;
    }

    // Log the action
    await client.query(
      `INSERT INTO combat_actions (session_id, actor_id, actor_type, action_type, action_details, damage_dealt, critical_hit, dodged)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [session.id, actorId, 'player', actionType, JSON.stringify(actionData), damage, critical, dodged]
    );

    // Update turn count
    await client.query(
      `UPDATE combat_sessions SET turn_count = turn_count + 1 WHERE id = $1`,
      [session.id]
    );

    return { 
      success: true, 
      damage, 
      critical, 
      dodged, 
      message,
      actionType 
    };
  }

  /**
   * End a combat session
   */
  async endCombat(client, sessionId, winnerId, winnerType, reason = 'completed') {
    try {
      // Get session details
      const sessionResult = await client.query(
        `SELECT * FROM combat_sessions WHERE id = $1`,
        [sessionId]
      );

      const session = sessionResult.rows[0];
      let experienceGained = 0;
      let goldGained = 0;

      // If player won against monster, award rewards
      if (winnerType === 'player' && session.defender_type === 'monster') {
        // Get monster details
        const monsterResult = await client.query(
          `SELECT m.* FROM monsters m
           JOIN monster_spawns ms ON ms.monster_id = m.id
           WHERE ms.id = $1`,
          [session.monster_id]
        );

        if (monsterResult.rows.length > 0) {
          const monster = monsterResult.rows[0];
          experienceGained = monster.experience_reward;
          goldGained = monster.gold_reward;

          // Award rewards to player
          await client.query(
            `UPDATE characters 
             SET experience = experience + $1, gold = gold + $2
             WHERE id = $3`,
            [experienceGained, goldGained, winnerId]
          );

          // Mark monster as dead and set respawn time
          const respawnTime = new Date(Date.now() + monster.respawn_time * 1000);
          await client.query(
            `UPDATE monster_spawns 
             SET status = 'dead', respawn_at = $1
             WHERE id = $2`,
            [respawnTime, session.monster_id]
          );
        }
      }

      // Update session
      await client.query(
        `UPDATE combat_sessions 
         SET session_status = $1, ended_at = NOW(), winner_id = $2, winner_type = $3,
             experience_gained = $4, gold_gained = $5
         WHERE id = $6`,
        [reason === 'fled' ? 'fled' : 'completed', winnerId, winnerType, 
         experienceGained, goldGained, sessionId]
      );

      // Clear any combat effects
      await client.query(
        `DELETE FROM combat_effects 
         WHERE (target_id = $1 AND target_type = 'player') 
            OR (target_id = $2 AND target_type = 'monster')`,
        [session.attacker_id, session.monster_id]
      );

      return { experienceGained, goldGained };
    } catch (error) {
      console.error('Error ending combat:', error);
      throw error;
    }
  }

  /**
   * Get active combat session for a character
   */
  async getActiveCombat(characterId) {
    try {
      const result = await this.db.query(
        `SELECT cs.*, 
                ms.current_health as monster_current_health,
                ms.max_health as monster_max_health,
                m.name as monster_name,
                m.level as monster_level,
                m.element_type as monster_element
         FROM combat_sessions cs
         LEFT JOIN monster_spawns ms ON cs.monster_id = ms.id
         LEFT JOIN monsters m ON ms.monster_id = m.id
         WHERE cs.attacker_id = $1 AND cs.session_status = 'active'`,
        [characterId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting active combat:', error);
      throw error;
    }
  }

  /**
   * Get combat log for a session
   */
  async getCombatLog(sessionId, limit = 10) {
    try {
      const result = await this.db.query(
        `SELECT * FROM combat_actions 
         WHERE session_id = $1 
         ORDER BY timestamp DESC 
         LIMIT $2`,
        [sessionId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting combat log:', error);
      throw error;
    }
  }

  /**
   * Monster AI action (for NPC combat)
   */
  async performMonsterAction(sessionId, monsterId) {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Get monster and session info
      const monsterResult = await client.query(
        `SELECT ms.*, m.base_damage, m.special_abilities
         FROM monster_spawns ms
         JOIN monsters m ON ms.monster_id = m.id
         WHERE ms.id = $1`,
        [monsterId]
      );

      const monster = monsterResult.rows[0];
      
      // Simple AI: Basic attack
      const damage = Math.floor(monster.base_damage + Math.random() * 10);

      // Apply damage to player
      const sessionResult = await client.query(
        `SELECT * FROM combat_sessions WHERE id = $1`,
        [sessionId]
      );

      const session = sessionResult.rows[0];

      await client.query(
        `UPDATE characters 
         SET health_current = GREATEST(0, health_current - $1)
         WHERE id = $2
         RETURNING *`,
        [damage, session.attacker_id]
      );

      // Log monster action
      await client.query(
        `INSERT INTO combat_actions (session_id, actor_id, actor_type, action_type, action_details, damage_dealt)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sessionId, monsterId, 'monster', 'attack', '{"type": "basic_attack"}', damage]
      );

      await client.query('COMMIT');
      return { damage };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error performing monster action:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new CombatService();