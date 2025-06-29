/**
 * Test BigInt overflow for the endless leveling system
 * PostgreSQL BIGINT max: 9,223,372,036,854,775,807
 */

const MAX_BIGINT = 9223372036854775807n;

// Simplified version of the leveling algorithm for testing
class LevelingTest {
    constructor() {
        this.config = {
            baseExp: 100,
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
            softCaps: [
                { level: 1000,  strength: 0.95 },
                { level: 2500,  strength: 0.90 },
                { level: 5000,  strength: 0.85 },
                { level: 10000, strength: 0.80 }
            ]
        };
    }
    
    getPhaseForLevel(level) {
        for (const phase of this.config.phases) {
            if (phase.range[1] === null || level <= phase.range[1]) {
                return phase;
            }
        }
        return this.config.phases[this.config.phases.length - 1];
    }
    
    getSmoothedGrowthFactor(level) {
        const phase = this.getPhaseForLevel(level);
        return phase.growthFactor;
    }
    
    applySoftCaps(baseRequirement, level) {
        let adjustedReq = baseRequirement;
        
        for (let i = this.config.softCaps.length - 1; i >= 0; i--) {
            const cap = this.config.softCaps[i];
            if (level >= cap.level) {
                const levelsAboveCap = level - cap.level;
                const reductionPer100 = 1 - cap.strength;
                const totalReduction = Math.pow(cap.strength, levelsAboveCap / 100);
                adjustedReq *= totalReduction;
                break;
            }
        }
        
        return adjustedReq;
    }
    
    getExpToNextLevel(currentLevel) {
        if (currentLevel < 1) return this.config.baseExp;
        
        let growthFactor = this.getSmoothedGrowthFactor(currentLevel);
        let baseRequirement = this.config.baseExp;
        
        for (let lvl = 1; lvl < currentLevel; lvl++) {
            const factor = this.getSmoothedGrowthFactor(lvl);
            baseRequirement *= factor;
        }
        
        baseRequirement = this.applySoftCaps(baseRequirement, currentLevel);
        
        const dampener = 1 + Math.log10(currentLevel + 10) / 20;
        baseRequirement *= dampener;
        
        const minimumExp = this.config.baseExp * currentLevel;
        baseRequirement = Math.max(baseRequirement, minimumExp);
        
        return Math.floor(baseRequirement);
    }
    
    getTotalExpForLevel(level) {
        let totalExp = 0;
        for (let lvl = 2; lvl <= level; lvl++) {
            totalExp += this.getExpToNextLevel(lvl - 1);
        }
        return Math.floor(totalExp);
    }
}

// Run the test
const test = new LevelingTest();
console.log(`PostgreSQL BIGINT max: ${MAX_BIGINT.toLocaleString()}`);
console.log(`\nTesting experience requirements at various levels:\n`);

const testLevels = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];

for (const level of testLevels) {
    try {
        const totalExp = test.getTotalExpForLevel(level);
        const percentage = (totalExp / Number(MAX_BIGINT)) * 100;
        const expNextLevel = test.getExpToNextLevel(level);
        
        console.log(`Level ${level.toLocaleString()}:`);
        console.log(`  Total EXP: ${totalExp.toLocaleString()}`);
        console.log(`  EXP to next: ${expNextLevel.toLocaleString()}`);
        console.log(`  % of BIGINT max: ${percentage.toFixed(6)}%`);
        
        if (totalExp > Number(MAX_BIGINT)) {
            console.log(`  ⚠️  OVERFLOW! Exceeds BIGINT limit!`);
            break;
        }
        console.log('');
    } catch (e) {
        console.log(`Level ${level}: ERROR - ${e.message}`);
        break;
    }
}

// Find approximate overflow level using binary search
console.log('\nSearching for exact overflow level...\n');

let low = 1;
let high = 10000000;
let overflowLevel = -1;

while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    try {
        const totalExp = test.getTotalExpForLevel(mid);
        
        if (totalExp > Number(MAX_BIGINT)) {
            overflowLevel = mid;
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    } catch (e) {
        high = mid - 1;
    }
}

if (overflowLevel > 0) {
    console.log(`💥 BIGINT overflow occurs at approximately level ${overflowLevel.toLocaleString()}`);
    const prevLevel = overflowLevel - 1;
    const expAtPrev = test.getTotalExpForLevel(prevLevel);
    console.log(`   Level ${prevLevel.toLocaleString()} total EXP: ${expAtPrev.toLocaleString()}`);
    console.log(`   This is ${((expAtPrev / Number(MAX_BIGINT)) * 100).toFixed(2)}% of BIGINT max`);
} else {
    console.log('✅ No overflow detected within reasonable level range!');
}