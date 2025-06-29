/**
 * Find exact level where BigInt overflow occurs
 */

const MAX_BIGINT = 9223372036854775807n;

// Test smaller range to find exact overflow
console.log(`PostgreSQL BIGINT max: ${MAX_BIGINT.toLocaleString()}\n`);

// Use the simpler calculation from your actual implementation
const testLevels = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];

for (const level of testLevels) {
    // Using the actual formula from your code: 100 * (level^2.5) + (level * 50)
    const totalExp = Math.floor(100 * Math.pow(level, 2.5) + (level * 50));
    const percentage = (totalExp / Number(MAX_BIGINT)) * 100;
    
    console.log(`Level ${level}:`);
    console.log(`  Total EXP: ${totalExp.toLocaleString()}`);
    console.log(`  % of BIGINT max: ${percentage.toFixed(10)}%`);
    
    if (totalExp > Number(MAX_BIGINT)) {
        console.log(`  ⚠️  OVERFLOW! Exceeds BIGINT limit!`);
        break;
    }
    console.log('');
}

// Find exact overflow point
console.log('\nFinding exact overflow level...\n');

let overflowLevel = 0;
for (let level = 1; level <= 1000000; level++) {
    const totalExp = Math.floor(100 * Math.pow(level, 2.5) + (level * 50));
    
    if (totalExp > Number(MAX_BIGINT)) {
        overflowLevel = level;
        break;
    }
}

if (overflowLevel > 0) {
    console.log(`💥 BIGINT overflow occurs at level ${overflowLevel.toLocaleString()}`);
    
    const prevLevel = overflowLevel - 1;
    const expAtPrev = Math.floor(100 * Math.pow(prevLevel, 2.5) + (prevLevel * 50));
    const expAtOverflow = Math.floor(100 * Math.pow(overflowLevel, 2.5) + (overflowLevel * 50));
    
    console.log(`\nLevel ${prevLevel}: ${expAtPrev.toLocaleString()} (${((expAtPrev / Number(MAX_BIGINT)) * 100).toFixed(2)}% of max)`);
    console.log(`Level ${overflowLevel}: ${expAtOverflow.toLocaleString()} (OVERFLOW)`);
    
    // Calculate years to reach overflow at different play rates
    console.log('\n⏱️  Time to reach overflow level at different play rates:');
    
    const expPerHour = [10000, 100000, 1000000, 10000000];
    for (const rate of expPerHour) {
        const hours = expAtPrev / rate;
        const days = hours / 24;
        const years = days / 365;
        
        console.log(`  ${rate.toLocaleString()} EXP/hour: ${years.toFixed(1)} years`);
    }
}