/**
 * Infinite Leveling System with Extended Growth Phases and Higher Factors
 * This algorithm provides challenging progression with multiple phases for infinite scaling
 */

class LevelingSystem {
  constructor() {
    // Configuration parameters with higher factors and extended phases
    this.config = {
      // Base experience for level 1
      baseExp: 100,
      
      // Growth phases with higher factors
      phases: [
        { name: "Novice",       range: [1, 25],       growthFactor: 1.25 },    // 25% growth
        { name: "Apprentice",   range: [26, 75],      growthFactor: 1.20 },    // 20% growth
        { name: "Journeyman",   range: [76, 150],     growthFactor: 1.16 },    // 16% growth
        { name: "Expert",       range: [151, 300],    growthFactor: 1.12 },    // 12% growth
        { name: "Master",       range: [301, 500],    growthFactor: 1.09 },    // 9% growth
        { name: "Grandmaster",  range: [501, 750],    growthFactor: 1.07 },    // 7% growth
        { name: "Champion",     range: [751, 1000],   growthFactor: 1.05 },    // 5% growth
        { name: "Legend",       range: [1001, 1500],  growthFactor: 1.04 },    // 4% growth
        { name: "Mythic",       range: [1501, 2000],  growthFactor: 1.03 },    // 3% growth
        { name: "Eternal",      range: [2001, 3000],  growthFactor: 1.025 },   // 2.5% growth
        { name: "Cosmic",       range: [3001, 5000],  growthFactor: 1.02 },    // 2% growth
        { name: "Transcendent", range: [5001, 10000], growthFactor: 1.015 },   // 1.5% growth
        { name: "Infinite",     range: [10001, null], growthFactor: 1.01 }     // 1% growth
      ],
      
      // Smoothing factor for transitions between phases
      smoothingRange: 5,
      
      // Soft cap configurations for ultra-high levels
      softCaps: [
        { level: 1000,  strength: 0.95 },   // 5% reduction per 100 levels
        { level: 2500,  strength: 0.90 },   // 10% reduction per 100 levels
        { level: 5000,  strength: 0.85 },   // 15% reduction per 100 levels
        { level: 10000, strength: 0.80 }    // 20% reduction per 100 levels
      ],
      
      // Prestige multiplier (for games with prestige/rebirth systems)
      prestigeMultiplier: 0.95 // Each prestige reduces exp requirements by 5%
    };
  }

  /**
   * Get the phase information for a given level
   * @param {number} level - The level to check
   * @returns {object} - Phase information
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
   * Calculate experience required for a specific level
   * @param {number} level - The level to calculate exp for
   * @param {number} prestige - Prestige level (optional, default 0)
   * @returns {number} - Experience required for that level
   */
  getExpForLevel(level, prestige = 0) {
    if (level <= 1) return 0;
    
    let totalExp = 0;
    
    // Calculate cumulative experience up to the target level
    for (let lvl = 2; lvl <= level; lvl++) {
      totalExp += this.getExpToNextLevel(lvl - 1, prestige);
    }
    
    return Math.floor(totalExp);
  }

  /**
   * Calculate experience needed to go from current level to next level
   * @param {number} currentLevel - Current level
   * @param {number} prestige - Prestige level (optional, default 0)
   * @returns {number} - Experience needed for next level
   */
  getExpToNextLevel(currentLevel, prestige = 0) {
    if (currentLevel < 1) return this.config.baseExp;
    
    // Get growth factor with smooth transitions
    let growthFactor = this.getSmoothedGrowthFactor(currentLevel);
    
    // Calculate base requirement using compound growth
    let baseRequirement = this.config.baseExp;
    
    // Apply growth for each level up to current
    for (let lvl = 1; lvl < currentLevel; lvl++) {
      const factor = this.getSmoothedGrowthFactor(lvl);
      baseRequirement *= factor;
    }
    
    // Apply soft caps for very high levels
    baseRequirement = this.applySoftCaps(baseRequirement, currentLevel);
    
    // Apply logarithmic dampener to prevent complete explosion
    const dampener = 1 + Math.log10(currentLevel + 10) / 20;
    baseRequirement *= dampener;
    
    // Apply prestige bonus if applicable
    if (prestige > 0) {
      baseRequirement *= Math.pow(this.config.prestigeMultiplier, prestige);
    }
    
    // Ensure minimum progression
    const minimumExp = this.config.baseExp * currentLevel;
    baseRequirement = Math.max(baseRequirement, minimumExp);
    
    return Math.floor(baseRequirement);
  }

  /**
   * Get smoothed growth factor for a level (handles transitions between phases)
   * @param {number} level - Current level
   * @returns {number} - Smoothed growth factor
   */
  getSmoothedGrowthFactor(level) {
    const currentPhase = this.getPhaseForLevel(level);
    const currentIndex = this.config.phases.indexOf(currentPhase);
    
    // If we're in the last phase or not near a transition, return the phase factor
    if (currentIndex === this.config.phases.length - 1 || 
        level <= currentPhase.range[0] + this.config.smoothingRange) {
      return currentPhase.growthFactor;
    }
    
    // Check if we're near the end of current phase (transition zone)
    const phaseEnd = currentPhase.range[1];
    if (level >= phaseEnd - this.config.smoothingRange) {
      const nextPhase = this.config.phases[currentIndex + 1];
      const transitionStart = phaseEnd - this.config.smoothingRange;
      const transitionEnd = phaseEnd + this.config.smoothingRange;
      
      if (level <= transitionEnd) {
        // We're in the transition zone
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
   * @param {number} baseRequirement - Base exp requirement
   * @param {number} level - Current level
   * @returns {number} - Modified requirement
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
   * Linear interpolation between two values
   */
  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Smooth step function for smooth transitions
   */
  smoothstep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  /**
   * Calculate what level a player should be given their total experience
   * @param {number} totalExp - Total experience points
   * @param {number} prestige - Prestige level (optional, default 0)
   * @returns {number} - Current level
   */
  getLevelFromExp(totalExp, prestige = 0) {
    let level = 1;
    let expNeeded = 0;
    
    while (expNeeded <= totalExp) {
      level++;
      expNeeded = this.getExpForLevel(level, prestige);
    }
    
    return level - 1;
  }

  /**
   * Get detailed level information
   * @param {number} level - Level to get info for
   * @param {number} prestige - Prestige level (optional, default 0)
   * @returns {object} - Detailed level information
   */
  getLevelInfo(level, prestige = 0) {
    const expForThisLevel = this.getExpForLevel(level, prestige);
    const expForNextLevel = this.getExpForLevel(level + 1, prestige);
    const expToNext = expForNextLevel - expForThisLevel;
    const phase = this.getPhaseForLevel(level);
    
    return {
      level: level,
      phase: phase.name,
      totalExpRequired: expForThisLevel,
      expToNextLevel: expToNext,
      growthFactor: this.getSmoothedGrowthFactor(level),
      percentIncrease: level > 1 ? 
        ((expToNext / this.getExpToNextLevel(level - 1, prestige) - 1) * 100).toFixed(2) + '%' : 
        'N/A',
      prestige: prestige
    };
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

  /**
   * Generate a progression table for visualization
   * @param {number[]} levels - Array of levels to show
   * @param {number} prestige - Prestige level (optional, default 0)
   * @returns {array} - Array of level information
   */
  generateProgressionTable(levels, prestige = 0) {
    const table = [];
    
    for (const level of levels) {
      const info = this.getLevelInfo(level, prestige);
      table.push({
        ...info,
        totalExpFormatted: this.formatNumber(info.totalExpRequired),
        expToNextFormatted: this.formatNumber(info.expToNextLevel)
      });
    }
    
    return table;
  }
}

// Example usage and testing
const levelSystem = new LevelingSystem();

// Show progression for key levels across all phases
console.log("=== Level Progression Across All Phases ===");
const keyLevels = [1, 10, 25, 50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 10000];
const progression = levelSystem.generateProgressionTable(keyLevels);

progression.forEach(info => {
  console.log(
    `Level ${info.level.toString().padStart(5)} (${info.phase.padEnd(12)}): ` +
    `${info.expToNextFormatted.padStart(8)} to next | ` +
    `Total: ${info.totalExpFormatted.padStart(8)} | ` +
    `Growth: ${info.growthFactor.toFixed(3)}`
  );
});

// Show phase transitions
console.log("\n=== Phase Transitions ===");
const transitionLevels = [23, 25, 27, 73, 75, 77, 148, 150, 152];
transitionLevels.forEach(level => {
  const info = levelSystem.getLevelInfo(level);
  console.log(
    `Level ${level}: ${info.phase.padEnd(12)} - ` +
    `Growth Factor: ${info.growthFactor.toFixed(4)} ` +
    `(${info.percentIncrease} increase)`
  );
});

// Show prestige effects
console.log("\n=== Prestige Effects (Level 100) ===");
for (let prestige = 0; prestige <= 5; prestige++) {
  const info = levelSystem.getLevelInfo(100, prestige);
  console.log(
    `Prestige ${prestige}: ${levelSystem.formatNumber(info.expToNextLevel)} exp to next ` +
    `(Total: ${levelSystem.formatNumber(info.totalExpRequired)})`
  );
}

// Calculate time estimates (assuming 1000 exp/hour at level 1)
console.log("\n=== Time Estimates (at 1000 exp/hour base rate) ===");
const timeEstimateLevels = [50, 100, 250, 500, 1000, 2500, 5000];
timeEstimateLevels.forEach(level => {
  const exp = levelSystem.getExpForLevel(level);
  const hours = exp / 1000;
  const days = hours / 24;
  const years = days / 365;
  
  console.log(
    `Level ${level.toString().padStart(4)}: ` +
    `${years >= 1 ? years.toFixed(2) + ' years' : 
       days >= 1 ? days.toFixed(2) + ' days' : 
       hours.toFixed(2) + ' hours'}`
  );
});