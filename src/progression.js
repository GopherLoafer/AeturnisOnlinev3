// Infinite Level Progression System
// Phase 2.2 Implementation - Exponential scaling with racial modifiers

class ProgressionSystem {
    constructor() {
        // Base experience formula: 100 * (level^2.5) + (level * 50)
        // This creates exponential growth that scales infinitely
        this.baseExperienceMultiplier = 100;
        this.exponentialFactor = 2.5;
        this.linearBonus = 50;
        
        // Prestige markers based on level milestones
        this.prestigeMarkers = {
            bronze: 100,    // Bronze star at level 100
            silver: 500,    // Silver star at level 500
            gold: 1000,     // Gold star at level 1000
            platinum: 2500, // Platinum star at level 2500
            diamond: 5000,  // Diamond star at level 5000
            legendary: 10000 // Legendary star at level 10000
        };
        
        // Exponential milestone levels for infinite progression
        this.milestoneLevels = [
            1000,    // First major milestone
            5000,    // 5x increase
            15000,   // 3x increase
            40000,   // ~2.7x increase
            100000,  // 2.5x increase
            250000,  // 2.5x increase
            600000,  // 2.4x increase
            1400000, // ~2.3x increase
            3200000, // ~2.3x increase
            7200000, // 2.25x increase
            16000000 // ~2.2x increase
            // Pattern continues: each milestone roughly 2.0-2.5x the previous
        ];
    }

    /**
     * Calculate experience required for a specific level
     * Formula: 100 * (level^2.5) + (level * 50)
     * @param {number} level - Target level
     * @returns {number} Experience required for that level
     */
    getExperienceForLevel(level) {
        if (level <= 1) return 0;
        
        const exponentialComponent = this.baseExperienceMultiplier * Math.pow(level, this.exponentialFactor);
        const linearComponent = level * this.linearBonus;
        
        return Math.floor(exponentialComponent + linearComponent);
    }

    /**
     * Calculate total experience needed to reach a level from level 1
     * @param {number} level - Target level
     * @returns {number} Total experience needed
     */
    getTotalExperienceForLevel(level) {
        let totalExp = 0;
        for (let i = 2; i <= level; i++) {
            totalExp += this.getExperienceForLevel(i);
        }
        return totalExp;
    }

    /**
     * Calculate level from total experience
     * @param {number} totalExperience - Total experience accumulated
     * @returns {number} Current level
     */
    getLevelFromExperience(totalExperience) {
        if (totalExperience < 0) return 1;
        
        let level = 1;
        let expUsed = 0;
        
        // Iterate through levels until we exceed the total experience
        while (true) {
            const expForNextLevel = this.getExperienceForLevel(level + 1);
            if (expUsed + expForNextLevel > totalExperience) {
                break;
            }
            expUsed += expForNextLevel;
            level++;
        }
        
        return level;
    }

    /**
     * Calculate experience needed for next level
     * @param {number} currentLevel - Current character level
     * @param {number} currentExperience - Current total experience
     * @returns {object} Experience info for next level
     */
    getExperienceProgress(currentLevel, currentExperience) {
        const expForCurrentLevel = this.getTotalExperienceForLevel(currentLevel);
        const expForNextLevel = this.getTotalExperienceForLevel(currentLevel + 1);
        
        const currentLevelProgress = currentExperience - expForCurrentLevel;
        const expNeededForNext = expForNextLevel - expForCurrentLevel;
        const remainingExp = expForNextLevel - currentExperience;
        
        return {
            currentLevel,
            currentLevelProgress,
            expNeededForNext,
            remainingExp,
            progressPercentage: Math.floor((currentLevelProgress / expNeededForNext) * 100)
        };
    }

    /**
     * Calculate dynamic stat gains per level based on race modifiers
     * @param {number} level - Character level
     * @param {object} raceData - Race information with modifiers
     * @returns {object} Stat gains for this level
     */
    calculateStatGains(level, raceData) {
        // Base stat gains per level (gets higher at milestone levels)
        let baseGains = {
            str: 2,
            int: 2,
            vit: 2,
            dex: 2,
            wis: 2
        };

        // Milestone bonus every 100 levels
        if (level % this.milestoneInterval === 0) {
            const milestoneMultiplier = Math.floor(level / this.milestoneInterval);
            Object.keys(baseGains).forEach(stat => {
                baseGains[stat] += milestoneMultiplier;
            });
        }

        // Apply racial modifiers to stat gains
        const racialGains = {
            str: Math.floor(baseGains.str * (1 + (raceData.str_modifier || 0) * 0.02)),
            int: Math.floor(baseGains.int * (1 + (raceData.int_modifier || 0) * 0.02)),
            vit: Math.floor(baseGains.vit * (1 + (raceData.vit_modifier || 0) * 0.02)),
            dex: Math.floor(baseGains.dex * (1 + (raceData.dex_modifier || 0) * 0.02)),
            wis: Math.floor(baseGains.wis * (1 + (raceData.wis_modifier || 0) * 0.02))
        };

        return racialGains;
    }

    /**
     * Apply experience gain with racial bonuses
     * @param {number} baseExperience - Base experience to award
     * @param {object} raceData - Race information with experience bonus
     * @returns {number} Final experience after racial bonuses
     */
    applyExperienceBonus(baseExperience, raceData) {
        const experienceBonus = raceData.experience_bonus || 0;
        return Math.floor(baseExperience * (1 + experienceBonus));
    }

    /**
     * Get prestige marker for a given level
     * @param {number} level - Character level
     * @returns {string|null} Prestige marker name or null
     */
    getPrestigeMarker(level) {
        if (level >= this.prestigeMarkers.legendary) return 'legendary';
        if (level >= this.prestigeMarkers.diamond) return 'diamond';
        if (level >= this.prestigeMarkers.platinum) return 'platinum';
        if (level >= this.prestigeMarkers.gold) return 'gold';
        if (level >= this.prestigeMarkers.silver) return 'silver';
        if (level >= this.prestigeMarkers.bronze) return 'bronze';
        return null;
    }

    /**
     * Check if level qualifies for milestone rewards
     * @param {number} level - Character level
     * @returns {boolean} True if milestone level
     */
    isMilestoneLevel(level) {
        return this.milestoneLevels.includes(level);
    }

    /**
     * Calculate milestone reward based on level
     * @param {number} level - Milestone level
     * @returns {object} Reward details
     */
    getMilestoneReward(level) {
        if (!this.isMilestoneLevel(level)) return null;

        const milestoneIndex = this.milestoneLevels.indexOf(level);
        const milestoneNumber = milestoneIndex + 1;
        
        // Exponential gold rewards: starts at 50,000 and increases significantly
        const baseReward = 50000;
        const goldReward = Math.floor(baseReward * Math.pow(3, milestoneIndex));
        
        return {
            level,
            milestoneNumber,
            goldReward,
            specialReward: this.getSpecialMilestoneReward(level)
        };
    }

    /**
     * Get special rewards for significant milestones
     * @param {number} level - Milestone level
     * @returns {string|null} Special reward description
     */
    getSpecialMilestoneReward(level) {
        const prestige = this.getPrestigeMarker(level);
        
        switch (level) {
            case 1000:
                return 'Gold Prestige Star + Title: "Ascendant"';
            case 5000:
                return 'Diamond Prestige Star + Title: "Transcendent"';
            case 15000:
                return 'Legendary Star + Title: "Apex Warrior"';
            case 40000:
                return 'Mythic Crown + Title: "Planar Champion"';
            case 100000:
                return 'Ethereal Aura + Title: "Reality Shaper"';
            case 250000:
                return 'Cosmic Emblem + Title: "Universe Walker"';
            case 600000:
                return 'Dimensional Seal + Title: "Infinity Breaker"';
            case 1400000:
                return 'Primordial Mark + Title: "Existence Defier"';
            case 3200000:
                return 'Origin Crystal + Title: "Void Conqueror"';
            case 7200000:
                return 'Creation Spark + Title: "Reality Architect"';
            case 16000000:
                return 'Ultimate Ascension + Title: "Omnipotent One"';
            default:
                if (prestige) {
                    return `${prestige.charAt(0).toUpperCase() + prestige.slice(1)} Tier Achievement`;
                }
                return 'Legendary Achievement Unlocked';
        }
    }

    /**
     * Get next milestone information for display
     * @param {number} currentLevel - Current character level
     * @returns {object|null} Next milestone info or null if no more milestones
     */
    getNextMilestone(currentLevel) {
        const nextMilestone = this.milestoneLevels.find(level => level > currentLevel);
        
        if (!nextMilestone) {
            return null; // No more predefined milestones
        }
        
        return {
            level: nextMilestone,
            levelsRemaining: nextMilestone - currentLevel,
            reward: this.getMilestoneReward(nextMilestone)
        };
    }

    /**
     * Get content unlocks for a specific level
     * @param {number} level - Character level
     * @returns {array} Array of unlocked content
     */
    getContentUnlocks(level) {
        const unlocks = [];

        // Zone unlocks
        if (level >= 10) unlocks.push('Forest Depths');
        if (level >= 25) unlocks.push('Mountain Caves');
        if (level >= 50) unlocks.push('Desert Wastelands');
        if (level >= 100) unlocks.push('Frozen Tundra');
        if (level >= 250) unlocks.push('Volcanic Peaks');
        if (level >= 500) unlocks.push('Shadow Realm');
        if (level >= 1000) unlocks.push('Celestial Planes');
        if (level >= 2500) unlocks.push('Void Dimensions');

        // Feature unlocks
        if (level >= 5) unlocks.push('Chat Channel: General');
        if (level >= 15) unlocks.push('Guild System');
        if (level >= 30) unlocks.push('PvP Arena');
        if (level >= 75) unlocks.push('Crafting System');
        if (level >= 150) unlocks.push('Advanced Combat');

        return unlocks;
    }
}

module.exports = ProgressionSystem;