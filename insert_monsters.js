const db = require('./src/database');

(async () => {
  try {
    await db.insertDefaultMonsters();
    console.log('Monsters insertion complete');
    
    // Check results
    const monsterCount = await db.query('SELECT COUNT(*) FROM monsters');
    console.log('Total monsters:', monsterCount.rows[0].count);
    
    const spawnCount = await db.query("SELECT COUNT(*) FROM monster_spawns WHERE status = 'alive'");
    console.log('Active spawns:', spawnCount.rows[0].count);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
