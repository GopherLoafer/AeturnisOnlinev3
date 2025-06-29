/**
 * Admin Race Management Service
 * Phase 2.6: Comprehensive administrative tools for race management and balance
 */

const database = require('../database');

class AdminRaceManagementService {
  constructor() {
    this.db = database;
  }

  /**
   * Get comprehensive race statistics
   */
  async getRaceStatistics() {
    try {
      const raceStats = await this.db.query(`
        SELECT 
          r.id,
          r.name,
          r.description,
          r.str_modifier,
          r.int_modifier,
          r.vit_modifier,
          r.dex_modifier,
          r.wis_modifier,
          r.experience_bonus,
          r.magic_affinity_bonus,
          r.weapon_affinity_bonus,
          r.special_ability,
          r.starting_zone,
          COUNT(c.id) as character_count,
          ROUND(AVG(c.level), 2) as average_level,
          ROUND(AVG(CAST(c.experience AS NUMERIC)), 0) as average_experience,
          MAX(c.level) as highest_level,
          MIN(c.level) as lowest_level,
          COUNT(CASE WHEN c.last_active > NOW() - INTERVAL '24 hours' THEN 1 END) as active_24h,
          COUNT(CASE WHEN c.last_active > NOW() - INTERVAL '7 days' THEN 1 END) as active_7d,
          COUNT(CASE WHEN c.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_characters_7d,
          ROUND(AVG(CAST(c.gold AS NUMERIC)), 0) as average_gold
        FROM races r
        LEFT JOIN characters c ON r.id = c.race_id
        GROUP BY r.id, r.name, r.description, r.str_modifier, r.int_modifier, 
                 r.vit_modifier, r.dex_modifier, r.wis_modifier, r.experience_bonus,
                 r.magic_affinity_bonus, r.weapon_affinity_bonus, r.special_ability, r.starting_zone
        ORDER BY character_count DESC
      `);

      return raceStats.rows;
    } catch (error) {
      console.error('Error getting race statistics:', error);
      throw error;
    }
  }

  /**
   * Get detailed population distribution
   */
  async getPopulationMonitoring() {
    try {
      const totalCharacters = await this.db.query('SELECT COUNT(*) as total FROM characters');
      const totalUsers = await this.db.query('SELECT COUNT(*) as total FROM users');
      
      const raceDistribution = await this.db.query(`
        SELECT 
          r.name,
          COUNT(c.id) as count,
          ROUND((COUNT(c.id)::numeric / NULLIF((SELECT COUNT(*) FROM characters), 0)) * 100, 2) as percentage
        FROM races r
        LEFT JOIN characters c ON r.id = c.race_id
        GROUP BY r.id, r.name
        ORDER BY count DESC
      `);

      const levelDistribution = await this.db.query(`
        SELECT 
          r.name as race_name,
          CASE 
            WHEN c.level BETWEEN 1 AND 10 THEN '1-10'
            WHEN c.level BETWEEN 11 AND 25 THEN '11-25'
            WHEN c.level BETWEEN 26 AND 50 THEN '26-50'
            WHEN c.level BETWEEN 51 AND 100 THEN '51-100'
            WHEN c.level BETWEEN 101 AND 500 THEN '101-500'
            WHEN c.level BETWEEN 501 AND 1000 THEN '501-1000'
            ELSE '1000+'
          END as level_range,
          COUNT(*) as count
        FROM characters c
        JOIN races r ON c.race_id = r.id
        GROUP BY r.name, level_range
        ORDER BY r.name, 
          CASE level_range 
            WHEN '1-10' THEN 1
            WHEN '11-25' THEN 2
            WHEN '26-50' THEN 3
            WHEN '51-100' THEN 4
            WHEN '101-500' THEN 5
            WHEN '501-1000' THEN 6
            ELSE 7
          END
      `);

      const activityMetrics = await this.db.query(`
        SELECT 
          r.name,
          COUNT(CASE WHEN c.last_active > NOW() - INTERVAL '1 hour' THEN 1 END) as active_1h,
          COUNT(CASE WHEN c.last_active > NOW() - INTERVAL '24 hours' THEN 1 END) as active_24h,
          COUNT(CASE WHEN c.last_active > NOW() - INTERVAL '7 days' THEN 1 END) as active_7d,
          COUNT(CASE WHEN c.last_active > NOW() - INTERVAL '30 days' THEN 1 END) as active_30d
        FROM races r
        LEFT JOIN characters c ON r.id = c.race_id
        GROUP BY r.id, r.name
        ORDER BY active_24h DESC
      `);

      return {
        overview: {
          total_characters: parseInt(totalCharacters.rows[0].total),
          total_users: parseInt(totalUsers.rows[0].total),
          characters_per_user: totalCharacters.rows[0].total / totalUsers.rows[0].total
        },
        race_distribution: raceDistribution.rows,
        level_distribution: levelDistribution.rows,
        activity_metrics: activityMetrics.rows
      };
    } catch (error) {
      console.error('Error getting population monitoring:', error);
      throw error;
    }
  }

  /**
   * Apply racial balance adjustments
   */
  async applyRacialBalanceAdjustment(raceId, adjustments, adminUserId, reason) {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (adjustments.str_modifier !== undefined) {
        updateFields.push(`str_modifier = $${paramIndex++}`);
        updateValues.push(adjustments.str_modifier);
      }
      if (adjustments.int_modifier !== undefined) {
        updateFields.push(`int_modifier = $${paramIndex++}`);
        updateValues.push(adjustments.int_modifier);
      }
      if (adjustments.vit_modifier !== undefined) {
        updateFields.push(`vit_modifier = $${paramIndex++}`);
        updateValues.push(adjustments.vit_modifier);
      }
      if (adjustments.dex_modifier !== undefined) {
        updateFields.push(`dex_modifier = $${paramIndex++}`);
        updateValues.push(adjustments.dex_modifier);
      }
      if (adjustments.wis_modifier !== undefined) {
        updateFields.push(`wis_modifier = $${paramIndex++}`);
        updateValues.push(adjustments.wis_modifier);
      }
      if (adjustments.experience_bonus !== undefined) {
        updateFields.push(`experience_bonus = $${paramIndex++}`);
        updateValues.push(adjustments.experience_bonus);
      }
      if (adjustments.magic_affinity_bonus !== undefined) {
        updateFields.push(`magic_affinity_bonus = $${paramIndex++}`);
        updateValues.push(adjustments.magic_affinity_bonus);
      }
      if (adjustments.weapon_affinity_bonus !== undefined) {
        updateFields.push(`weapon_affinity_bonus = $${paramIndex++}`);
        updateValues.push(adjustments.weapon_affinity_bonus);
      }

      if (updateFields.length === 0) {
        throw new Error('No valid adjustments provided');
      }

      // Update race
      updateValues.push(raceId);
      const updateQuery = `UPDATE races SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
      await client.query(updateQuery, updateValues);

      // Log the balance adjustment
      await client.query(`
        INSERT INTO admin_actions (admin_user_id, action_type, description, created_at)
        VALUES ($1, $2, $3, NOW())
      `, [adminUserId, 'racial_balance_adjustment', 
          `Applied balance adjustment to race ID ${raceId}: ${JSON.stringify(adjustments)}. Reason: ${reason}`]);

      await client.query('COMMIT');

      return { success: true, message: 'Racial balance adjustment applied successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error applying racial balance adjustment:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Implement race change for character
   */
  async changeCharacterRace(characterId, newRaceId, adminUserId, reason) {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Get current character data
      const characterResult = await client.query(`
        SELECT c.*, r.name as current_race_name 
        FROM characters c 
        JOIN races r ON c.race_id = r.id 
        WHERE c.id = $1
      `, [characterId]);

      if (characterResult.rows.length === 0) {
        throw new Error('Character not found');
      }

      const character = characterResult.rows[0];

      // Get new race data
      const newRaceResult = await client.query('SELECT * FROM races WHERE id = $1', [newRaceId]);
      if (newRaceResult.rows.length === 0) {
        throw new Error('New race not found');
      }

      const newRace = newRaceResult.rows[0];

      // Update character race and starting zone
      await client.query(`
        UPDATE characters 
        SET race_id = $1, location_zone = $2
        WHERE id = $3
      `, [newRaceId, newRace.starting_zone, characterId]);

      // Clear existing racial quest progress
      await client.query('DELETE FROM character_racial_quests WHERE character_id = $1', [characterId]);

      // Assign new racial quests
      const racialQuests = await client.query(`
        SELECT id FROM racial_quests WHERE race_id = $1 AND starting_zone = $2
      `, [newRaceId, newRace.starting_zone]);

      for (const quest of racialQuests.rows) {
        await client.query(`
          INSERT INTO character_racial_quests (character_id, quest_id, status)
          VALUES ($1, $2, 'available')
        `, [characterId, quest.id]);
      }

      // Log the race change
      await client.query(`
        INSERT INTO admin_actions (admin_user_id, action_type, target_character_id, description, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [adminUserId, 'race_change', characterId, 
          `Changed character ${character.name} from ${character.current_race_name} to ${newRace.name}. Reason: ${reason}`]);

      await client.query('COMMIT');

      return { 
        success: true, 
        message: `Character race changed from ${character.current_race_name} to ${newRace.name}`,
        character_name: character.name,
        old_race: character.current_race_name,
        new_race: newRace.name
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error changing character race:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create racial event
   */
  async createRacialEvent(eventData, adminUserId) {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Insert racial event
      const eventResult = await client.query(`
        INSERT INTO racial_events (
          name, description, event_type, target_race_id, 
          bonus_data, start_time, end_time, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        eventData.name,
        eventData.description,
        eventData.event_type,
        eventData.target_race_id,
        JSON.stringify(eventData.bonus_data),
        eventData.start_time,
        eventData.end_time,
        adminUserId
      ]);

      const eventId = eventResult.rows[0].id;

      // Log the event creation
      await client.query(`
        INSERT INTO admin_actions (admin_user_id, action_type, description, created_at)
        VALUES ($1, $2, $3, NOW())
      `, [adminUserId, 'racial_event_creation', 
          `Created racial event: ${eventData.name} for race ID ${eventData.target_race_id}`]);

      await client.query('COMMIT');

      return { success: true, event_id: eventId, message: 'Racial event created successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating racial event:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get active racial events
   */
  async getActiveRacialEvents() {
    try {
      const result = await this.db.query(`
        SELECT 
          re.*,
          r.name as race_name,
          u.username as created_by_username
        FROM racial_events re
        LEFT JOIN races r ON re.target_race_id = r.id
        LEFT JOIN users u ON re.created_by = u.id
        WHERE re.start_time <= NOW() AND re.end_time >= NOW()
        ORDER BY re.start_time DESC
      `);

      return result.rows.map(event => {
        event.bonus_data = JSON.parse(event.bonus_data || '{}');
        return event;
      });
    } catch (error) {
      console.error('Error getting active racial events:', error);
      throw error;
    }
  }

  /**
   * Create race-specific rewards
   */
  async createRaceSpecificReward(rewardData, adminUserId) {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      const rewardResult = await client.query(`
        INSERT INTO race_specific_rewards (
          race_id, reward_name, description, reward_type,
          reward_data, level_requirement, one_time_only, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        rewardData.race_id,
        rewardData.reward_name,
        rewardData.description,
        rewardData.reward_type,
        JSON.stringify(rewardData.reward_data),
        rewardData.level_requirement || 1,
        rewardData.one_time_only || false,
        adminUserId
      ]);

      const rewardId = rewardResult.rows[0].id;

      // Log the reward creation
      await client.query(`
        INSERT INTO admin_actions (admin_user_id, action_type, description, created_at)
        VALUES ($1, $2, $3, NOW())
      `, [adminUserId, 'race_reward_creation', 
          `Created race-specific reward: ${rewardData.reward_name} for race ID ${rewardData.race_id}`]);

      await client.query('COMMIT');

      return { success: true, reward_id: rewardId, message: 'Race-specific reward created successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating race-specific reward:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get race balance recommendations based on statistics
   */
  async getRaceBalanceRecommendations() {
    try {
      const stats = await this.getRaceStatistics();
      const recommendations = [];

      // Calculate overall averages
      const totalCharacters = stats.reduce((sum, race) => sum + parseInt(race.character_count || 0), 0);
      const averagePopulation = totalCharacters / stats.length;
      const overallAvgLevel = stats.reduce((sum, race) => sum + (parseFloat(race.average_level) || 0), 0) / stats.length;

      for (const race of stats) {
        const characterCount = parseInt(race.character_count || 0);
        const avgLevel = parseFloat(race.average_level) || 0;
        const experienceBonus = parseFloat(race.experience_bonus) || 0;

        // Population balance check
        if (characterCount < averagePopulation * 0.5) {
          recommendations.push({
            race_name: race.name,
            type: 'population',
            severity: 'high',
            issue: 'Significantly underpopulated',
            suggestion: 'Consider increasing experience bonus or adding unique rewards',
            current_pop: characterCount,
            target_pop: Math.round(averagePopulation)
          });
        } else if (characterCount > averagePopulation * 2) {
          recommendations.push({
            race_name: race.name,
            type: 'population',
            severity: 'medium',
            issue: 'Overpopulated',
            suggestion: 'Consider reducing bonuses or adding challenges',
            current_pop: characterCount,
            target_pop: Math.round(averagePopulation)
          });
        }

        // Level progression check
        if (avgLevel > overallAvgLevel * 1.3) {
          recommendations.push({
            race_name: race.name,
            type: 'progression',
            severity: 'medium',
            issue: 'Progressing too quickly',
            suggestion: 'Consider reducing experience bonus',
            current_avg_level: avgLevel,
            overall_avg_level: overallAvgLevel
          });
        } else if (avgLevel < overallAvgLevel * 0.7 && characterCount > 5) {
          recommendations.push({
            race_name: race.name,
            type: 'progression',
            severity: 'medium',
            issue: 'Progressing too slowly',
            suggestion: 'Consider increasing experience bonus or reducing difficulty',
            current_avg_level: avgLevel,
            overall_avg_level: overallAvgLevel
          });
        }

        // Experience bonus analysis
        if (experienceBonus < -0.3) {
          recommendations.push({
            race_name: race.name,
            type: 'balance',
            severity: 'low',
            issue: 'Very negative experience bonus may discourage players',
            suggestion: 'Consider compensating with other bonuses',
            current_bonus: experienceBonus
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting race balance recommendations:', error);
      throw error;
    }
  }
}

module.exports = new AdminRaceManagementService();