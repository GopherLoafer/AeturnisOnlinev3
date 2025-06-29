const db = require('./src/database');

(async () => {
  try {
    // Check combat tables
    const combatTables = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('monsters', 'combat_sessions', 'combat_actions', 'combat_cooldowns', 'monster_spawns')
      ORDER BY table_name
    `);
    console.log('Combat tables:', combatTables.rows.map(r => r.table_name).join(', '));
    
    // Check monsters
    const monsterCount = await db.query('SELECT COUNT(*) FROM monsters');
    console.log('Total monsters:', monsterCount.rows[0].count);
    
    // Check spawns
    const spawnCount = await db.query("SELECT COUNT(*) FROM monster_spawns WHERE status = 'alive'");
    console.log('Active spawns:', spawnCount.rows[0].count);
    
    // List first 3 monsters
    const monsters = await db.query('SELECT name, level, spawn_zone FROM monsters ORDER BY level LIMIT 3');
    console.log('\nFirst 3 monsters:');
    monsters.rows.forEach(m => console.log(`- ${m.name} (Lv ${m.level}) in ${m.spawn_zone}`));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
