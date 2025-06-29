
// Advanced Level Service - Manages character progression and affinity system
// Phase 2.3 Implementation with leveling-algorithm.js integration

const db = require('./database');
const ProgressionSystem = require('./progression');

class LevelService {
    constructor() {
        this.progression = new ProgressionSystem();
    }

    /**
     * Award experience with advanced progression system
     */
    async awardExperience(characterId, experienceAmount) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');

            // Get character with race data
            const charResult = await client.query(`
                SELECT c.*, r.name as race_name, r.str_modifier, r.int_modifier, 
                       r.vit_modifier, r.dex_modifier, r.wis_modifier, r.experience_bonus,
                       r.weapon_affinity_bonus, r.magic_affinity_bonus
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
                experience_bonus: character.experience_bonus || 0,
                weapon_affinity_bonus: character.weapon_affinity_bonus || 0,
                magic_affinity_bonus: character.magic_affinity_bonus || 0
            };

            // Apply racial experience bonus
            const finalExperience = this.progression.applyExperienceBonus(experienceAmount, raceData);
            
            // Validate experience amount
            if (finalExperience <= 0 || finalExperience > 1000000) {
                throw new Error(`Invalid experience amount: ${finalExperience}`);
            }
            
            // NUMERIC type handles arbitrarily large numbers, no overflow check needed
            const currentExperience = parseFloat(character.experience) || 0;
            const newTotalExperience = currentExperience + finalExperience;

            // Calculate levels using advanced algorithm
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
                contentUnlocks: [],
                phaseInfo: this.progression.getPhaseForLevel(newLevel)
            };

            // Update character experience
            await client.query(
                'UPDATE characters SET experience = $1, last_active = CURRENT_TIMESTAMP WHERE id = $2',
                [newTotalExperience, characterId]
            );

            // Handle level ups with advanced system
            if (levelUpResults.leveledUp) {
                levelUpResults = await this.handleLevelUp(client, characterId, character, raceData, oldLevel, newLevel);
                levelUpResults.experienceGained = finalExperience;
                levelUpResults.phaseInfo = this.progression.getPhaseForLevel(newLevel);
            }

            await client.query('COMMIT');
            
            // Update leaderboard cache
            await this.updateLeaderboardCache(characterId);

            return levelUpResults;

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error awarding experience:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Handle level up with advanced stat calculations
     */
    async handleLevelUp(client, characterId, character, raceData, oldLevel, newLevel) {
        let totalStatGains = { str: 0, int: 0, vit: 0, dex: 0, wis: 0 };
        let milestoneRewards = [];
        let contentUnlocks = [];

        // Calculate stat gains for each level using advanced system
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
                    // Award milestone gold
                    await client.query(
                        'UPDATE characters SET gold = gold + $1 WHERE id = $2',
                        [milestone.goldReward, characterId]
                    );

                    await client.query(
                        'INSERT INTO milestone_rewards (character_id, milestone_level, gold_reward, special_reward, phase_name) VALUES ($1, $2, $3, $4, $5)',
                        [characterId, level, milestone.goldReward, milestone.specialReward, milestone.phase]
                    );
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
            Math.floor(totalStatGains.vit * 10),
            Math.floor(totalStatGains.int * 5),
            totalStatGains.str + totalStatGains.int + totalStatGains.vit + totalStatGains.dex + totalStatGains.wis,
            characterId
        ]);

        // Update prestige marker
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
            contentUnlocks: [...new Set(contentUnlocks)],
            phase: this.progression.getPhaseForLevel(newLevel).name
        };
    }

    /**
     * Get progression info with advanced algorithm
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
        const progressInfo = this.progression.getExperienceProgress(character.level, parseFloat(character.experience) || 0);
        
        return {
            ...progressInfo,
            experienceToNext: progressInfo.expNeededForNext,  // Add this for frontend compatibility
            prestigeMarker: character.prestige_marker,
            nextMilestone: this.getNextMilestone(character.level),
            contentUnlocks: this.progression.getContentUnlocks(character.level),
            phaseInfo: this.progression.getPhaseForLevel(character.level)
        };
    }

    /**
     * Phase 2.3: Award affinity experience
     */
    async awardAffinityExperience(characterId, affinityType, category, amount = 1) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');

            // Get character and race data
            const charResult = await client.query(`
                SELECT c.level, r.weapon_affinity_bonus, r.magic_affinity_bonus
                FROM characters c
                JOIN races r ON c.race_id = r.id
                WHERE c.id = $1
            `, [characterId]);

            if (charResult.rows.length === 0) {
                throw new Error('Character not found');
            }

            const character = charResult.rows[0];
            const raceData = {
                weapon_affinity_bonus: character.weapon_affinity_bonus || 0,
                magic_affinity_bonus: character.magic_affinity_bonus || 0
            };

            // Calculate affinity gain
            const affinityGain = this.progression.calculateAffinityGain(
                affinityType, category, character.level, raceData
            ) * amount;

            // Update or insert affinity record
            await client.query(`
                INSERT INTO character_affinities (character_id, affinity_type, category, level, total_experience)
                VALUES ($1, $2, $3, $4, $4)
                ON CONFLICT (character_id, affinity_type, category)
                DO UPDATE SET 
                    total_experience = character_affinities.total_experience + $4,
                    level = LEAST(100, character_affinities.level + $4),
                    last_used = CURRENT_TIMESTAMP
            `, [characterId, affinityType, category, affinityGain]);

            await client.query('COMMIT');

            return {
                affinityType,
                category,
                gainAmount: affinityGain,
                success: true
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error awarding affinity experience:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get character affinities
     */
    async getCharacterAffinities(characterId) {
        const result = await db.query(`
            SELECT affinity_type, category, level, total_experience, last_used
            FROM character_affinities
            WHERE character_id = $1
            ORDER BY category, affinity_type
        `, [characterId]);

        const affinities = {
            weapons: {},
            magic: {}
        };

        result.rows.forEach(row => {
            affinities[row.category][row.affinity_type] = {
                level: parseFloat(row.level),
                totalExperience: parseFloat(row.total_experience),
                lastUsed: row.last_used,
                damageBonus: this.progression.getAffinityDamageBonus(row.level),
                specialChance: this.progression.getAffinitySpecialChance(row.level)
            };
        });

        return affinities;
    }

    /**
     * Get next milestone with advanced progression
     */
    getNextMilestone(currentLevel) {
        const nextMilestone = Math.ceil(currentLevel / this.progression.milestoneInterval) * this.progression.milestoneInterval;
        if (nextMilestone === currentLevel && currentLevel > 0) {
            return this.progression.getMilestoneReward(currentLevel);
        }
        return {
            level: nextMilestone,
            levelsRemaining: nextMilestone - currentLevel,
            preview: this.progression.getMilestoneReward(nextMilestone)
        };
    }

    /**
     * Update leaderboard cache
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
                
                // Validate and sanitize numeric values to prevent NaN errors
                const validatedLevel = isNaN(char.level) ? 1 : parseInt(char.level);
                const validatedExperience = isNaN(char.experience) ? 0 : parseFloat(char.experience);
                
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
                `, [char.id, char.name, char.race_name, validatedLevel, validatedExperience, char.prestige_marker]);
            }
        } catch (error) {
            console.error('Error updating leaderboard cache:', error);
        }
    }

    /**
     * Get leaderboard with phase information
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
            prestigeDisplay: this.getPrestigeDisplay(row.prestige_marker),
            phase: this.progression.getPhaseForLevel(row.level).name
        }));
    }

    /**
     * Get prestige display symbol
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
     * Get milestone rewards
     */
    async getMilestoneRewards(characterId) {
        const result = await db.query(`
            SELECT milestone_level, gold_reward, special_reward, phase_name, claimed_at
            FROM milestone_rewards
            WHERE character_id = $1
            ORDER BY milestone_level DESC
        `, [characterId]);

        return result.rows;
    }
}

module.exports = LevelService;
