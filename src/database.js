const { Pool } = require('pg');

class Database {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async initialize() {
    try {
      // Test connection
      const client = await this.pool.connect();
      console.log('Database connection established');
      client.release();

      // Create tables
      await this.createTables();
      console.log('Database tables initialized');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  async createTables() {
    const queries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        remember_token VARCHAR(255)
      )`,

      // Races table
      `CREATE TABLE IF NOT EXISTS races (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        str_modifier INTEGER DEFAULT 0,
        int_modifier INTEGER DEFAULT 0,
        vit_modifier INTEGER DEFAULT 0,
        dex_modifier INTEGER DEFAULT 0,
        wis_modifier INTEGER DEFAULT 0,
        starting_zone VARCHAR(100),
        experience_bonus DECIMAL(3,2) DEFAULT 0.00,
        magic_affinity_bonus DECIMAL(3,2) DEFAULT 0.00,
        weapon_affinity_bonus DECIMAL(3,2) DEFAULT 0.00,
        special_ability VARCHAR(50),
        equipment_restrictions TEXT,
        regeneration_modifier DECIMAL(3,2) DEFAULT 1.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Characters table
      `CREATE TABLE IF NOT EXISTS characters (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        race_id INTEGER REFERENCES races(id),
        name VARCHAR(50) UNIQUE NOT NULL,
        level INTEGER DEFAULT 1,
        experience BIGINT DEFAULT 0,
        str_base INTEGER DEFAULT 10,
        int_base INTEGER DEFAULT 10,
        vit_base INTEGER DEFAULT 10,
        dex_base INTEGER DEFAULT 10,
        wis_base INTEGER DEFAULT 10,
        health_current INTEGER DEFAULT 100,
        health_max INTEGER DEFAULT 100,
        mana_current INTEGER DEFAULT 50,
        mana_max INTEGER DEFAULT 50,
        gold BIGINT DEFAULT 100,
        location_zone VARCHAR(100) DEFAULT 'newbie_grounds',
        location_x INTEGER DEFAULT 0,
        location_y INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Weapon affinities table
      `CREATE TABLE IF NOT EXISTS weapon_affinities (
        id SERIAL PRIMARY KEY,
        character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
        weapon_type VARCHAR(20) NOT NULL,
        affinity_percentage DECIMAL(5,2) DEFAULT 0.00,
        total_uses BIGINT DEFAULT 0,
        last_used TIMESTAMP,
        UNIQUE(character_id, weapon_type)
      )`,

      // Magic affinities table
      `CREATE TABLE IF NOT EXISTS magic_affinities (
        id SERIAL PRIMARY KEY,
        character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
        magic_school VARCHAR(20) NOT NULL,
        affinity_percentage DECIMAL(5,2) DEFAULT 0.00,
        total_uses BIGINT DEFAULT 0,
        last_used TIMESTAMP,
        UNIQUE(character_id, magic_school)
      )`,

      // Game sessions table for tracking active players
      `CREATE TABLE IF NOT EXISTS game_sessions (
        id SERIAL PRIMARY KEY,
        character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
        session_id VARCHAR(255) NOT NULL,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address INET,
        user_agent TEXT
      )`,

      // Chat messages table
      `CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
        channel VARCHAR(20) DEFAULT 'global',
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Admin actions log
      `CREATE TABLE IF NOT EXISTS admin_actions (
        id SERIAL PRIMARY KEY,
        admin_user_id INTEGER REFERENCES users(id),
        action_type VARCHAR(50) NOT NULL,
        target_user_id INTEGER REFERENCES users(id),
        target_character_id INTEGER REFERENCES characters(id),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Race abilities table
      `CREATE TABLE IF NOT EXISTS race_abilities (
        id SERIAL PRIMARY KEY,
        race_id INTEGER REFERENCES races(id),
        ability_name VARCHAR(50) NOT NULL,
        description TEXT,
        cooldown_seconds INTEGER DEFAULT 0,
        mana_cost INTEGER DEFAULT 0,
        level_requirement INTEGER DEFAULT 1,
        ability_type VARCHAR(20) DEFAULT 'active',
        effect_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Character race ability cooldowns
      `CREATE TABLE IF NOT EXISTS character_ability_cooldowns (
        id SERIAL PRIMARY KEY,
        character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
        ability_name VARCHAR(50) NOT NULL,
        cooldown_expires TIMESTAMP,
        UNIQUE(character_id, ability_name)
      )`,

      // Equipment restrictions by race
      `CREATE TABLE IF NOT EXISTS race_equipment_restrictions (
        id SERIAL PRIMARY KEY,
        race_id INTEGER REFERENCES races(id),
        item_type VARCHAR(50) NOT NULL,
        restriction_type VARCHAR(20) DEFAULT 'forbidden',
        description TEXT
      )`,

      // Phase 2.3: Character affinities table for unified affinity tracking
      `CREATE TABLE IF NOT EXISTS character_affinities (
        id SERIAL PRIMARY KEY,
        character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
        affinity_type VARCHAR(20) NOT NULL,
        category VARCHAR(10) NOT NULL,
        level DECIMAL(5,2) DEFAULT 0.00,
        total_experience DECIMAL(10,2) DEFAULT 0.00,
        last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(character_id, affinity_type, category)
      )`
    ];

    for (const query of queries) {
      await this.pool.query(query);
    }

    // Create indices for affinity system
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_character_affinities_character 
      ON character_affinities(character_id);
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_character_affinities_type 
      ON character_affinities(affinity_type, category);
    `);

    // Add affinity bonus columns to races table if they don't exist
    try {
      await this.pool.query(`
        ALTER TABLE races 
        ADD COLUMN IF NOT EXISTS weapon_affinity_bonus DECIMAL(3,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS magic_affinity_bonus DECIMAL(3,2) DEFAULT 0.00;
      `);
    } catch (error) {
      // Columns might already exist, ignore error
      console.log('Affinity bonus columns may already exist:', error.message);
    }

    // Add phase_name column to milestone_rewards if it doesn't exist
    try {
      await this.pool.query(`
        ALTER TABLE milestone_rewards 
        ADD COLUMN IF NOT EXISTS phase_name VARCHAR(20);
      `);
    } catch (error) {
      // Column might already exist, ignore error
      console.log('Phase name column may already exist:', error.message);
    }

    console.log('Affinity system tables initialized');

    // Insert default races if they don't exist
    await this.insertDefaultRaces();
    
    // Insert default race abilities
    await this.insertDefaultRaceAbilities();
  }

  async insertDefaultRaces() {
    const defaultRaces = [
      {
        name: 'Human',
        description: 'Balanced stats, +10% experience gain. Versatile and adaptable survivors.',
        str_modifier: 0, int_modifier: 0, vit_modifier: 0, dex_modifier: 0, wis_modifier: 0,
        starting_zone: 'human_village',
        experience_bonus: 0.10,
        magic_affinity_bonus: 0.0,
        weapon_affinity_bonus: 0.0,
        special_ability: 'adaptive_learning',
        equipment_restrictions: null,
        regeneration_modifier: 1.0
      },
      {
        name: 'Elf',
        description: '+15 INT/WIS, -10 STR, +20% magic affinity gain. Masters of arcane arts.',
        str_modifier: -10, int_modifier: 15, vit_modifier: 0, dex_modifier: 0, wis_modifier: 15,
        starting_zone: 'elven_forest',
        experience_bonus: 0.0,
        magic_affinity_bonus: 0.20,
        weapon_affinity_bonus: 0.0,
        special_ability: 'magic_mastery',
        equipment_restrictions: null,
        regeneration_modifier: 1.0
      },
      {
        name: 'Dwarf',
        description: '+20 STR/VIT, -15 INT, +20% weapon affinity gain. Sturdy mountain warriors.',
        str_modifier: 20, int_modifier: -15, vit_modifier: 20, dex_modifier: 0, wis_modifier: 0,
        starting_zone: 'dwarven_halls',
        experience_bonus: 0.0,
        magic_affinity_bonus: 0.0,
        weapon_affinity_bonus: 0.20,
        special_ability: 'weapon_mastery',
        equipment_restrictions: null,
        regeneration_modifier: 1.0
      },
      {
        name: 'Orc',
        description: '+25 STR, -20 INT/WIS, +50% rage generation. Brutal berserker warriors.',
        str_modifier: 25, int_modifier: -20, vit_modifier: 0, dex_modifier: 0, wis_modifier: -20,
        starting_zone: 'orc_stronghold',
        experience_bonus: 0.0,
        magic_affinity_bonus: 0.0,
        weapon_affinity_bonus: 0.0,
        special_ability: 'berserker_rage',
        equipment_restrictions: null,
        regeneration_modifier: 1.0
      },
      {
        name: 'Dark Elf',
        description: '+20 DEX/INT, -15 VIT, +30% critical chance. Shadowy assassins.',
        str_modifier: 0, int_modifier: 20, vit_modifier: -15, dex_modifier: 20, wis_modifier: 0,
        starting_zone: 'dark_caverns',
        experience_bonus: 0.0,
        magic_affinity_bonus: 0.0,
        weapon_affinity_bonus: 0.0,
        special_ability: 'shadow_strike',
        equipment_restrictions: null,
        regeneration_modifier: 1.0
      },
      {
        name: 'Halfling',
        description: '+25 DEX, -20 STR, +40% dodge chance. Quick and nimble scouts.',
        str_modifier: -20, int_modifier: 0, vit_modifier: 0, dex_modifier: 25, wis_modifier: 0,
        starting_zone: 'halfling_shire',
        experience_bonus: 0.0,
        magic_affinity_bonus: 0.0,
        weapon_affinity_bonus: 0.0,
        special_ability: 'evasion',
        equipment_restrictions: null,
        regeneration_modifier: 1.0
      },
      {
        name: 'Dragonborn',
        description: '+10 all stats, -25% experience gain, breath weapon. Descendants of dragons.',
        str_modifier: 10, int_modifier: 10, vit_modifier: 10, dex_modifier: 10, wis_modifier: 10,
        starting_zone: 'dragon_peaks',
        experience_bonus: -0.25,
        magic_affinity_bonus: 0.0,
        weapon_affinity_bonus: 0.0,
        special_ability: 'dragon_breath',
        equipment_restrictions: null,
        regeneration_modifier: 1.0
      },
      {
        name: 'Undead',
        description: 'No VIT regen, +50% dark magic affinity, immune to poison. Cursed beings.',
        str_modifier: 0, int_modifier: 0, vit_modifier: 0, dex_modifier: 0, wis_modifier: 0,
        starting_zone: 'cursed_graveyard',
        experience_bonus: 0.0,
        magic_affinity_bonus: 0.0,
        weapon_affinity_bonus: 0.0,
        special_ability: 'undeath',
        equipment_restrictions: null,
        regeneration_modifier: 0.0
      }
    ];

    for (const race of defaultRaces) {
      try {
        await this.pool.query(
          `INSERT INTO races (name, description, str_modifier, int_modifier, vit_modifier, dex_modifier, wis_modifier, starting_zone, experience_bonus, magic_affinity_bonus, weapon_affinity_bonus, special_ability, equipment_restrictions, regeneration_modifier)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (name) DO NOTHING`,
          [race.name, race.description, race.str_modifier, race.int_modifier, 
           race.vit_modifier, race.dex_modifier, race.wis_modifier, race.starting_zone,
           race.experience_bonus, race.magic_affinity_bonus, race.weapon_affinity_bonus,
           race.special_ability, race.equipment_restrictions, race.regeneration_modifier]
        );
      } catch (error) {
        console.error(`Error inserting race ${race.name}:`, error);
      }
    }
  }

  async insertDefaultRaceAbilities() {
    const abilities = [
      // Human abilities
      { race_name: 'Human', ability_name: 'adaptive_learning', description: 'Gains 10% extra experience from all sources', ability_type: 'passive', effect_data: { experience_multiplier: 1.10 } },
      
      // Elf abilities
      { race_name: 'Elf', ability_name: 'magic_mastery', description: 'Magic affinity increases 20% faster', ability_type: 'passive', effect_data: { magic_affinity_multiplier: 1.20 } },
      { race_name: 'Elf', ability_name: 'elven_sight', description: 'See hidden magical auras and detect illusions', ability_type: 'passive', effect_data: { magic_detection: true } },
      
      // Dwarf abilities
      { race_name: 'Dwarf', ability_name: 'weapon_mastery', description: 'Weapon affinity increases 20% faster', ability_type: 'passive', effect_data: { weapon_affinity_multiplier: 1.20 } },
      { race_name: 'Dwarf', ability_name: 'dwarven_resilience', description: 'Resistance to poison and disease', ability_type: 'passive', effect_data: { poison_resistance: 0.5, disease_resistance: 0.5 } },
      
      // Orc abilities
      { race_name: 'Orc', ability_name: 'berserker_rage', description: 'Enter rage state: +50% damage, -25% defense for 30 seconds', cooldown_seconds: 300, ability_type: 'active', effect_data: { damage_bonus: 0.5, defense_penalty: 0.25, duration: 30 } },
      { race_name: 'Orc', ability_name: 'intimidation', description: 'Chance to cause fear in enemies during combat', ability_type: 'passive', effect_data: { fear_chance: 0.15 } },
      
      // Dark Elf abilities
      { race_name: 'Dark Elf', ability_name: 'shadow_strike', description: 'Next attack has 30% higher critical chance', cooldown_seconds: 60, ability_type: 'active', effect_data: { critical_bonus: 0.30 } },
      { race_name: 'Dark Elf', ability_name: 'darkvision', description: 'See perfectly in darkness and detect hidden enemies', ability_type: 'passive', effect_data: { darkness_immunity: true, detect_hidden: true } },
      
      // Halfling abilities
      { race_name: 'Halfling', ability_name: 'evasion', description: '40% chance to dodge physical attacks', ability_type: 'passive', effect_data: { dodge_chance: 0.40 } },
      { race_name: 'Halfling', ability_name: 'lucky_strike', description: 'Random chance for extraordinary success in any action', ability_type: 'passive', effect_data: { luck_factor: 0.05 } },
      
      // Dragonborn abilities
      { race_name: 'Dragonborn', ability_name: 'dragon_breath', description: 'Breathe elemental energy dealing area damage', cooldown_seconds: 120, mana_cost: 25, ability_type: 'active', effect_data: { damage_multiplier: 2.0, area_effect: true } },
      { race_name: 'Dragonborn', ability_name: 'draconic_heritage', description: 'Resistance to elemental damage and magic', ability_type: 'passive', effect_data: { elemental_resistance: 0.25, magic_resistance: 0.15 } },
      
      // Undead abilities
      { race_name: 'Undead', ability_name: 'undeath', description: 'Immune to poison, disease, and fear. No vitality regeneration.', ability_type: 'passive', effect_data: { poison_immunity: true, disease_immunity: true, fear_immunity: true, no_vit_regen: true } },
      { race_name: 'Undead', ability_name: 'dark_affinity', description: '50% bonus to dark magic affinity gain', ability_type: 'passive', effect_data: { dark_magic_bonus: 0.50 } },
      { race_name: 'Undead', ability_name: 'life_drain', description: 'Absorb health from enemies during combat', cooldown_seconds: 90, ability_type: 'active', effect_data: { drain_percentage: 0.25 } }
    ];

    for (const ability of abilities) {
      try {
        // Get race ID
        const raceResult = await this.pool.query('SELECT id FROM races WHERE name = $1', [ability.race_name]);
        if (raceResult.rows.length > 0) {
          const raceId = raceResult.rows[0].id;
          
          await this.pool.query(
            `INSERT INTO race_abilities (race_id, ability_name, description, cooldown_seconds, mana_cost, ability_type, effect_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
            [raceId, ability.ability_name, ability.description, ability.cooldown_seconds || 0, 
             ability.mana_cost || 0, ability.ability_type, JSON.stringify(ability.effect_data)]
          );
        }
      } catch (error) {
        console.error(`Error inserting ability ${ability.ability_name}:`, error);
      }
    }
  }

  async query(text, params = []) {
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async getClient() {
    return await this.pool.connect();
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = new Database();