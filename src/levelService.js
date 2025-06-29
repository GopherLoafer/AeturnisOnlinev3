// Level Service - Manages character progression and level ups
// Phase 2.2 Implementation

const db = require('./database');
const ProgressionSystem = require('./progression');

class LevelService {
    constructor() {
        this.progression = new ProgressionSystem();
    }

    /**
     * Award experience to a character and handle level ups
     * @param {number} characterId - Character ID
     * @param {number} experienceAmount - Base experience to award
     * @returns {object} Level up results
     */
    async awardExperience(characterId, experienceAmount) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');

            // Get character with race data
            const charResult = await client.query(`
                SELECT c.*, r.name as race_name, r.str_modifier, r.int_modifier, 
                       r.vit_modifier, r.dex_modifier, r.wis_modifier, r.experience_bonus
                FROM characters c
                JOIN races r ON c.race_id = r.id
                WHERE c.id = $1
            `, [characterId]);

            if (charResult.rows.length === 0) {
                throw new Error('Character not found');
            }

            const character = charResult.rows[0];
            const raceData = {
                str_modifier: character.str_modifier,
                int_modifier: character.int_modifier,
                vit_modifier: character.vit_modifier,
                dex_modifier: character.dex_modifier,
                wis_modifier: character.wis_modifier,
                experience_bonus: character.experience_bonus || 0
            };

            // Apply racial experience bonus
            const finalExperience = this.progression.applyExperienceBonus(experienceAmount, raceData);
            const newTotalExperience = character.experience + finalExperience;

            // Calculate old and new levels
            const oldLevel = character.level;
            const newLevel = this.progression.getLevelFromExperience(newTotalExperience);

            let levelUpResults = {
                experienceGained: finalExperience,
                oldLevel,
                newLevel,
                leveledUp: newLevel > oldLevel,
                statGains: null,
                milestoneRewards: [],
                newPrestigeMarker: null,
                contentUnlocks: []
            };

            // Update character experience
            await client.query(
                'UPDATE characters SET experience = $1, last_active = CURRENT_TIMESTAMP WHERE id = $2',
                [newTotalExperience, characterId]
            );

            // Handle level ups
            if (levelUpResults.leveledUp) {
                levelUpResults = await this.handleLevelUp(client, characterId, character, raceData, oldLevel, newLevel);
                levelUpResults.experienceGained = finalExperience;
            }

            await client.query('COMMIT');
            
            // Update leaderboard cache
            await this.updateLeaderboardCache(characterId);

            return levelUpResults;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Handle level up process including stat gains and rewards
     * @param {object} client - Database client
     * @param {number} characterId - Character ID
     * @param {object} character - Character data
     * @param {object} raceData - Race modifiers
     * @param {number} oldLevel - Previous level
     * @param {number} newLevel - New level
     * @returns {object} Level up results
     */
    async handleLevelUp(client, characterId, character, raceData, oldLevel, newLevel) {
        let totalStatGains = { str: 0, int: 0, vit: 0, dex: 0, wis: 0 };
        let milestoneRewards = [];
        let contentUnlocks = [];

        // Calculate stat gains for each level gained
        for (let level = oldLevel + 1; level <= newLevel; level++) {
            const statGains = this.progression.calculateStatGains(level, raceData);
            
            totalStatGains.str += statGains.str;
            totalStatGains.int += statGains.int;
            totalStatGains.vit += statGains.vit;
            totalStatGains.dex += statGains.dex;
            totalStatGains.wis += statGains.wis;

            // Check for milestone rewards
            if (this.progression.isMilestoneLevel(level)) {
                const milestone = this.progression.getMilestoneReward(level);
                milestoneRewards.push(milestone);
                
                // Check if milestone reward already exists
                const existingMilestone = await client.query(
                    'SELECT id FROM milestone_rewards WHERE character_id = $1 AND milestone_level = $2',
                    [characterId, level]
                );
                
                if (existingMilestone.rows.length === 0) {
                    // Award milestone gold and track it
                    await client.query(
                        'UPDATE characters SET gold = gold + $1 WHERE id = $2',
                        [milestone.goldReward, characterId]
                    );

                    await client.query(
                        'INSERT INTO milestone_rewards (character_id, milestone_level, gold_reward, special_reward) VALUES ($1, $2, $3, $4)',
                        [characterId, level, milestone.goldReward, milestone.specialReward]
                    );
                } else {
                    console.log(`Milestone ${level} already claimed for character ${characterId}`);
                }
            }

            // Collect content unlocks
            const levelUnlocks = this.progression.getContentUnlocks(level);
            contentUnlocks.push(...levelUnlocks);
        }

        // Apply stat gains
        const newStats = {
            str: character.str_base + totalStatGains.str,
            int: character.int_base + totalStatGains.int,
            vit: character.vit_base + totalStatGains.vit,
            dex: character.dex_base + totalStatGains.dex,
            wis: character.wis_base + totalStatGains.wis
        };

        // Calculate new health and mana maximums
        const newHealthMax = 50 + (newStats.vit * 10);
        const newManaMax = 30 + (newStats.int * 5);

        // Update character stats
        await client.query(`
            UPDATE characters SET 
                level = $1,
                str_base = $2,
                int_base = $3,
                vit_base = $4,
                dex_base = $5,
                wis_base = $6,
                health_max = $7,
                mana_max = $8,
                health_current = LEAST(health_current + $9, $7),
                mana_current = LEAST(mana_current + $10, $8),
                total_stat_points = total_stat_points + $11,
                last_level_up = CURRENT_TIMESTAMP
            WHERE id = $12
        `, [
            newLevel,
            newStats.str, newStats.int, newStats.vit, newStats.dex, newStats.wis,
            newHealthMax, newManaMax,
            Math.floor(totalStatGains.vit * 10), // Health bonus from VIT gains
            Math.floor(totalStatGains.int * 5),  // Mana bonus from INT gains
            totalStatGains.str + totalStatGains.int + totalStatGains.vit + totalStatGains.dex + totalStatGains.wis,
            characterId
        ]);

        // Check and update prestige marker
        const newPrestigeMarker = this.progression.getPrestigeMarker(newLevel);
        if (newPrestigeMarker && newPrestigeMarker !== character.prestige_marker) {
            await client.query(
                'UPDATE characters SET prestige_marker = $1 WHERE id = $2',
                [newPrestigeMarker, characterId]
            );
        }

        return {
            oldLevel,
            newLevel,
            leveledUp: true,
            statGains: totalStatGains,
            newStats,
            healthGain: Math.floor(totalStatGains.vit * 10),
            manaGain: Math.floor(totalStatGains.int * 5),
            milestoneRewards,
            newPrestigeMarker,
            contentUnlocks: [...new Set(contentUnlocks)] // Remove duplicates
        };
    }

    /**
     * Get character's current level progression info
     * @param {number} characterId - Character ID
     * @returns {object} Progression information
     */
    async getProgressionInfo(characterId) {
        const result = await db.query(
            'SELECT level, experience, prestige_marker FROM characters WHERE id = $1',
            [characterId]
        );

        if (result.rows.length === 0) {
            throw new Error('Character not found');
        }

        const character = result.rows[0];
        const progressInfo = this.progression.getExperienceProgress(character.level, character.experience);
        
        return {
            ...progressInfo,
            prestigeMarker: character.prestige_marker,
            nextMilestone: this.getNextMilestone(character.level),
            contentUnlocks: this.progression.getContentUnlocks(character.level)
        };
    }

    /**
     * Get next milestone information
     * @param {number} currentLevel - Current character level
     * @returns {object} Next milestone info
     */
    getNextMilestone(currentLevel) {
        const nextMilestone = Math.ceil(currentLevel / this.progression.milestoneInterval) * this.progression.milestoneInterval;
        if (nextMilestone === currentLevel) {
            return this.progression.getMilestoneReward(currentLevel);
        }
        return {
            level: nextMilestone,
            levelsRemaining: nextMilestone - currentLevel,
            preview: this.progression.getMilestoneReward(nextMilestone)
        };
    }

    /**
     * Update leaderboard cache for efficient ranking
     * @param {number} characterId - Character ID
     */
    async updateLeaderboardCache(characterId) {
        try {
            const result = await db.query(`
                SELECT c.id, c.name, c.level, c.experience, c.prestige_marker, r.name as race_name
                FROM characters c
                JOIN races r ON c.race_id = r.id
                WHERE c.id = $1
            `, [characterId]);

            if (result.rows.length > 0) {
                const char = result.rows[0];
                await db.query(`
                    INSERT INTO leaderboard_cache (character_id, character_name, race_name, level, experience, prestige_marker, last_updated)
                    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
                    ON CONFLICT (character_id)
                    DO UPDATE SET
                        character_name = $2,
                        race_name = $3,
                        level = $4,
                        experience = $5,
                        prestige_marker = $6,
                        last_updated = CURRENT_TIMESTAMP
                `, [char.id, char.name, char.race_name, char.level, char.experience, char.prestige_marker]);
            }
        } catch (error) {
            console.error('Error updating leaderboard cache:', error);
        }
    }

    /**
     * Get top level leaderboard
     * @param {number} limit - Number of entries to return
     * @returns {array} Leaderboard entries
     */
    async getLeaderboard(limit = 50) {
        const result = await db.query(`
            SELECT character_name, race_name, level, experience, prestige_marker,
                   RANK() OVER (ORDER BY level DESC, experience DESC) as rank
            FROM leaderboard_cache
            ORDER BY level DESC, experience DESC
            LIMIT $1
        `, [limit]);

        return result.rows.map(row => ({
            rank: row.rank,
            name: row.character_name,
            race: row.race_name,
            level: row.level,
            experience: row.experience,
            prestigeMarker: row.prestige_marker,
            prestigeDisplay: this.getPrestigeDisplay(row.prestige_marker)
        }));
    }

    /**
     * Get prestige display symbol
     * @param {string} prestigeMarker - Prestige marker name
     * @returns {string} Display symbol
     */
    getPrestigeDisplay(prestigeMarker) {
        const symbols = {
            bronze: '🥉',
            silver: '🥈',
            gold: '🥇',
            platinum: '💎',
            diamond: '💠',
            legendary: '⭐'
        };
        return symbols[prestigeMarker] || '';
    }

    /**
     * Get milestone rewards for a character
     * @param {number} characterId - Character ID
     * @returns {array} Milestone rewards
     */
    async getMilestoneRewards(characterId) {
        const result = await db.query(`
            SELECT milestone_level, gold_reward, special_reward, claimed_at
            FROM milestone_rewards
            WHERE character_id = $1
            ORDER BY milestone_level DESC
        `, [characterId]);

        return result.rows;
    }
}

module.exports = LevelService;