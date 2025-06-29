
/**
 * Advanced Infinite Leveling System with Affinity Foundation
 * Phase 2.3 Implementation - Integrated with leveling-algorithm.js
 */

class ProgressionSystem {
    constructor() {
        // Advanced leveling configuration from leveling-algorithm.js
        this.config = {
            baseExp: 100,
            
            // Growth phases with higher factors for infinite scaling
            phases: [
                { name: "Novice",       range: [1, 25],       growthFactor: 1.25 },
                { name: "Apprentice",   range: [26, 75],      growthFactor: 1.20 },
                { name: "Journeyman",   range: [76, 150],     growthFactor: 1.16 },
                { name: "Expert",       range: [151, 300],    growthFactor: 1.12 },
                { name: "Master",       range: [301, 500],    growthFactor: 1.09 },
                { name: "Grandmaster",  range: [501, 750],    growthFactor: 1.07 },
                { name: "Champion",     range: [751, 1000],   growthFactor: 1.05 },
                { name: "Legend",       range: [1001, 1500],  growthFactor: 1.04 },
                { name: "Mythic",       range: [1501, 2000],  growthFactor: 1.03 },
                { name: "Eternal",      range: [2001, 3000],  growthFactor: 1.025 },
                { name: "Cosmic",       range: [3001, 5000],  growthFactor: 1.02 },
                { name: "Transcendent", range: [5001, 10000], growthFactor: 1.015 },
                { name: "Infinite",     range: [10001, null], growthFactor: 1.01 }
            ],
            
            smoothingRange: 5,
            
            // Soft caps for ultra-high levels
            softCaps: [
                { level: 1000,  strength: 0.95 },
                { level: 2500,  strength: 0.90 },
                { level: 5000,  strength: 0.85 },
                { level: 10000, strength: 0.80 }
            ],
            
            prestigeMultiplier: 0.95
        };

        // Prestige markers
        this.prestigeMarkers = {
            bronze: 100,
            silver: 500,
            gold: 1000,
            platinum: 2500,
            diamond: 5000,
            legendary: 10000
        };
        
        // Milestone interval for rewards
        this.milestoneInterval = 100;

        // Phase 2.3: Affinity System Foundation
        this.affinitySystem = {
            weapons: {
                sword: { maxLevel: 100, baseGainRate: 0.05 },
                axe: { maxLevel: 100, baseGainRate: 0.05 },
                mace: { maxLevel: 100, baseGainRate: 0.05 },
                dagger: { maxLevel: 100, baseGainRate: 0.06 },
                staff: { maxLevel: 100, baseGainRate: 0.04 },
                bow: { maxLevel: 100, baseGainRate: 0.04 },
                unarmed: { maxLevel: 100, baseGainRate: 0.07 }
            },
            magic: {
                fire: { maxLevel: 100, baseGainRate: 0.03 },
                ice: { maxLevel: 100, baseGainRate: 0.03 },
                lightning: { maxLevel: 100, baseGainRate: 0.03 },
                earth: { maxLevel: 100, baseGainRate: 0.03 },
                holy: { maxLevel: 100, baseGainRate: 0.025 },
                dark: { maxLevel: 100, baseGainRate: 0.025 },
                arcane: { maxLevel: 100, baseGainRate: 0.02 },
                nature: { maxLevel: 100, baseGainRate: 0.035 }
            },
            bonusThresholds: [25, 50, 75, 100] // Affinity levels that provide bonuses
        };
    }

    /**
     * Get the phase information for a given level
     */
    getPhaseForLevel(level) {
        for (const phase of this.config.phases) {
            if (phase.range[1] === null || level <= phase.range[1]) {
                return phase;
            }
        }
        return this.config.phases[this.config.phases.length - 1];
    }

    /**
     * Calculate experience required for a specific level using advanced algorithm
     */
    getExperienceForLevel(level) {
        if (level <= 1) return 0;
        
        let totalExp = 0;
        
        for (let lvl = 2; lvl <= level; lvl++) {
            totalExp += this.getExpToNextLevel(lvl - 1);
        }
        
        return Math.floor(totalExp);
    }

    /**
     * Advanced experience calculation with phase transitions and soft caps
     */
    getExpToNextLevel(currentLevel, prestige = 0) {
        if (currentLevel < 1) return this.config.baseExp;
        
        // Get smoothed growth factor
        let growthFactor = this.getSmoothedGrowthFactor(currentLevel);
        
        // Calculate base requirement using compound growth
        let baseRequirement = this.config.baseExp;
        
        for (let lvl = 1; lvl < currentLevel; lvl++) {
            const factor = this.getSmoothedGrowthFactor(lvl);
            baseRequirement *= factor;
        }
        
        // Apply soft caps for very high levels
        baseRequirement = this.applySoftCaps(baseRequirement, currentLevel);
        
        // Apply logarithmic dampener
        const dampener = 1 + Math.log10(currentLevel + 10) / 20;
        baseRequirement *= dampener;
        
        // Apply prestige bonus
        if (prestige > 0) {
            baseRequirement *= Math.pow(this.config.prestigeMultiplier, prestige);
        }
        
        // Ensure minimum progression
        const minimumExp = this.config.baseExp * currentLevel;
        baseRequirement = Math.max(baseRequirement, minimumExp);
        
        return Math.floor(baseRequirement);
    }

    /**
     * Get smoothed growth factor for phase transitions
     */
    getSmoothedGrowthFactor(level) {
        const currentPhase = this.getPhaseForLevel(level);
        const currentIndex = this.config.phases.indexOf(currentPhase);
        
        if (currentIndex === this.config.phases.length - 1 || 
            level <= currentPhase.range[0] + this.config.smoothingRange) {
            return currentPhase.growthFactor;
        }
        
        const phaseEnd = currentPhase.range[1];
        if (level >= phaseEnd - this.config.smoothingRange) {
            const nextPhase = this.config.phases[currentIndex + 1];
            const transitionStart = phaseEnd - this.config.smoothingRange;
            const transitionEnd = phaseEnd + this.config.smoothingRange;
            
            if (level <= transitionEnd) {
                const progress = (level - transitionStart) / (2 * this.config.smoothingRange);
                return this.lerp(
                    currentPhase.growthFactor, 
                    nextPhase.growthFactor, 
                    this.smoothstep(progress)
                );
            }
        }
        
        return currentPhase.growthFactor;
    }

    /**
     * Apply soft caps based on level thresholds
     */
    applySoftCaps(baseRequirement, level) {
        let modifiedRequirement = baseRequirement;
        
        for (const softCap of this.config.softCaps) {
            if (level > softCap.level) {
                const levelsOverCap = level - softCap.level;
                const reductionFactor = Math.pow(softCap.strength, levelsOverCap / 100);
                modifiedRequirement *= reductionFactor;
            }
        }
        
        return modifiedRequirement;
    }

    /**
     * Linear interpolation
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Smooth step function
     */
    smoothstep(t) {
        t = Math.max(0, Math.min(1, t));
        return t * t * (3 - 2 * t);
    }

    /**
     * Calculate level from total experience using advanced algorithm
     */
    getLevelFromExperience(totalExperience) {
        if (totalExperience < 0) return 1;
        
        let level = 1;
        let expNeeded = 0;
        
        while (expNeeded <= totalExperience) {
            level++;
            expNeeded = this.getExperienceForLevel(level);
        }
        
        return level - 1;
    }

    /**
     * Get total experience needed to reach a level
     */
    getTotalExperienceForLevel(level) {
        return this.getExperienceForLevel(level);
    }

    /**
     * Calculate experience progress with advanced algorithm
     */
    getExperienceProgress(currentLevel, currentExperience) {
        const expForCurrentLevel = this.getTotalExperienceForLevel(currentLevel);
        const expForNextLevel = this.getTotalExperienceForLevel(currentLevel + 1);
        
        const currentLevelProgress = currentExperience - expForCurrentLevel;
        const expNeededForNext = expForNextLevel - expForCurrentLevel;
        const remainingExp = expForNextLevel - currentExperience;
        
        // Debug logging
        console.log('Experience Progress Debug:', {
            currentLevel,
            currentExperience,
            expForCurrentLevel,
            expForNextLevel,
            currentLevelProgress,
            expNeededForNext
        });
        
        return {
            currentLevel,
            currentLevelProgress: Math.max(0, currentLevelProgress),
            expNeededForNext,
            remainingExp: Math.max(0, remainingExp),
            progressPercentage: Math.min(100, Math.max(0, Math.floor((currentLevelProgress / expNeededForNext) * 100))),
            phase: this.getPhaseForLevel(currentLevel).name
        };
    }

    /**
     * Enhanced stat gains with affinity bonuses
     */
    calculateStatGains(level, raceData) {
        // Base stat gains
        let baseGains = {
            str: 2,
            int: 2,
            vit: 2,
            dex: 2,
            wis: 2
        };

        // Phase bonus
        const phase = this.getPhaseForLevel(level);
        const phaseBonus = this.getPhaseStatBonus(phase.name);
        
        Object.keys(baseGains).forEach(stat => {
            baseGains[stat] += phaseBonus;
        });

        // Milestone bonus every 100 levels
        if (level % this.milestoneInterval === 0) {
            const milestoneMultiplier = Math.floor(level / this.milestoneInterval);
            Object.keys(baseGains).forEach(stat => {
                baseGains[stat] += milestoneMultiplier;
            });
        }

        // Apply racial modifiers
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
     * Get phase-based stat bonus
     */
    getPhaseStatBonus(phaseName) {
        const bonuses = {
            "Novice": 0,
            "Apprentice": 1,
            "Journeyman": 2,
            "Expert": 3,
            "Master": 5,
            "Grandmaster": 7,
            "Champion": 10,
            "Legend": 15,
            "Mythic": 20,
            "Eternal": 30,
            "Cosmic": 40,
            "Transcendent": 60,
            "Infinite": 100
        };
        return bonuses[phaseName] || 0;
    }

    /**
     * Phase 2.3: Calculate affinity gain from combat/casting
     */
    calculateAffinityGain(affinityType, category, level, raceData) {
        const affinity = this.affinitySystem[category][affinityType];
        if (!affinity) return 0;

        // Base gain rate
        let gainRate = affinity.baseGainRate;

        // Level-based scaling (higher levels gain affinity slower)
        const levelPenalty = Math.max(0.1, 1 - (level / 1000));
        gainRate *= levelPenalty;

        // Racial bonuses for affinity gain
        if (category === 'weapons' && raceData.weapon_affinity_bonus) {
            gainRate *= (1 + raceData.weapon_affinity_bonus);
        }
        if (category === 'magic' && raceData.magic_affinity_bonus) {
            gainRate *= (1 + raceData.magic_affinity_bonus);
        }

        // Random variance (0.5x to 1.5x)
        const variance = 0.5 + Math.random();
        gainRate *= variance;

        return Math.min(0.5, gainRate); // Cap at 0.5% per action
    }

    /**
     * Phase 2.3: Get affinity damage bonus
     */
    getAffinityDamageBonus(affinityLevel) {
        if (affinityLevel >= 100) return 0.60; // 60% bonus at max
        if (affinityLevel >= 75) return 0.40;  // 40% bonus
        if (affinityLevel >= 50) return 0.25;  // 25% bonus
        if (affinityLevel >= 25) return 0.10;  // 10% bonus
        return 0; // No bonus below 25%
    }

    /**
     * Phase 2.3: Get affinity special attack chance
     */
    getAffinitySpecialChance(affinityLevel) {
        if (affinityLevel >= 100) return 0.40; // 40% chance at max
        if (affinityLevel >= 75) return 0.25;  // 25% chance
        if (affinityLevel >= 50) return 0.15;  // 15% chance
        if (affinityLevel >= 25) return 0.05;  // 5% chance
        return 0; // No special attacks below 25%
    }

    /**
     * Apply experience bonus with racial modifiers
     */
    applyExperienceBonus(baseExperience, raceData) {
        const experienceBonus = raceData.experience_bonus || 0;
        return Math.floor(baseExperience * (1 + experienceBonus));
    }

    /**
     * Get prestige marker for level
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
     * Check if level is milestone
     */
    isMilestoneLevel(level) {
        return level % this.milestoneInterval === 0 && level > 0;
    }

    /**
     * Get milestone reward with enhanced rewards
     */
    getMilestoneReward(level) {
        if (!this.isMilestoneLevel(level)) return null;

        const milestoneNumber = level / this.milestoneInterval;
        
        // Exponential gold rewards
        const baseReward = 1000;
        const goldReward = Math.floor(baseReward * Math.pow(1.5, milestoneNumber));
        
        // Phase-based special rewards
        const phase = this.getPhaseForLevel(level);
        let specialReward = `${phase.name} Phase Achievement`;
        
        // Major milestone rewards
        if (level >= 1000) {
            specialReward += " + Affinity Mastery Bonus";
        }
        if (level >= 5000) {
            specialReward += " + Legendary Weapon Unlock";
        }
        
        return {
            level,
            milestoneNumber,
            goldReward,
            specialReward,
            phase: phase.name
        };
    }

    /**
     * Get content unlocks for level
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

        // Affinity unlocks
        if (level >= 15) unlocks.push('Weapon Affinity Training');
        if (level >= 30) unlocks.push('Magic Affinity Training');
        if (level >= 75) unlocks.push('Advanced Combat Techniques');
        if (level >= 150) unlocks.push('Elemental Mastery');
        if (level >= 500) unlocks.push('Legendary Abilities');

        return unlocks;
    }

    /**
     * Format large numbers for display
     */
    formatNumber(num) {
        const units = ['', 'K', 'M', 'B', 'T', 'Q'];
        let unitIndex = 0;
        let value = num;
        
        while (value >= 1000 && unitIndex < units.length - 1) {
            value /= 1000;
            unitIndex++;
        }
        
        return value.toFixed(2) + units[unitIndex];
    }
}

module.exports = ProgressionSystem;
