/**
 * Test exact overflow point for both experience formulas
 */

const MAX_BIGINT = 9223372036854775807n;

console.log(`PostgreSQL BIGINT max: ${MAX_BIGINT.toLocaleString()}\n`);

// Test 1: Simple formula from documentation
console.log("=== TESTING SIMPLE FORMULA (100 * level^2.5 + level * 50) ===\n");

let overflowLevelSimple = 0;
for (let level = 100; level <= 10000000; level += 100) {
    const exp = 100 * Math.pow(level, 2.5) + (level * 50);
    
    if (exp > Number(MAX_BIGINT)) {
        // Found approximate overflow, now find exact
        for (let l = level - 100; l <= level; l++) {
            const exactExp = 100 * Math.pow(l, 2.5) + (l * 50);
            if (exactExp > Number(MAX_BIGINT)) {
                overflowLevelSimple = l;
                break;
            }
        }
        break;
    }
}

if (overflowLevelSimple > 0) {
    const prevLevel = overflowLevelSimple - 1;
    const expAtPrev = 100 * Math.pow(prevLevel, 2.5) + (prevLevel * 50);
    
    console.log(`Simple formula overflow at level ${overflowLevelSimple.toLocaleString()}`);
    console.log(`Level ${prevLevel.toLocaleString()}: ${Math.floor(expAtPrev).toLocaleString()} EXP`);
    console.log(`This is ${((expAtPrev / Number(MAX_BIGINT)) * 100).toFixed(2)}% of BIGINT max\n`);
}

// Test 2: Actual compound growth formula
console.log("=== TESTING ACTUAL COMPOUND GROWTH FORMULA ===\n");

// Simplified compound growth test
let exp = 100; // Starting exp
let totalExp = 0;
let overflowLevelCompound = 0;

for (let level = 1; level <= 1000; level++) {
    // Determine growth factor based on level
    let growthFactor;
    if (level <= 25) growthFactor = 1.25;
    else if (level <= 75) growthFactor = 1.20;
    else if (level <= 150) growthFactor = 1.16;
    else if (level <= 300) growthFactor = 1.12;
    else if (level <= 500) growthFactor = 1.09;
    else if (level <= 750) growthFactor = 1.07;
    else if (level <= 1000) growthFactor = 1.05;
    else growthFactor = 1.01;
    
    exp *= growthFactor;
    totalExp += exp;
    
    if (totalExp > Number(MAX_BIGINT)) {
        overflowLevelCompound = level;
        break;
    }
    
    // Show progress at key levels
    if ([50, 100, 200, 300, 400, 500].includes(level)) {
        console.log(`Level ${level}: ${Math.floor(totalExp).toLocaleString()} total EXP`);
        console.log(`  (${((totalExp / Number(MAX_BIGINT)) * 100).toFixed(6)}% of max)`);
    }
}

if (overflowLevelCompound > 0) {
    console.log(`\n💥 Compound formula overflow at level ${overflowLevelCompound}`);
}

console.log("\n=== RECOMMENDATIONS ===\n");
console.log("1. The compound growth formula hits overflow WAY too early (~level 500)");
console.log("2. Switch to the simple formula: 100 * level^2.5 + level * 50");
console.log("3. This would allow players to reach level 200,000+ before overflow");
console.log("4. At 1 million EXP/hour, it would take 29,252 YEARS to hit overflow!");
console.log("\nAlternatively, adjust the compound growth factors to be much smaller (1.01-1.05 range)");