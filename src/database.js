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
        experience NUMERIC(40,0) DEFAULT 0,
        str_base INTEGER DEFAULT 10,
        int_base INTEGER DEFAULT 10,
        vit_base INTEGER DEFAULT 10,
        dex_base INTEGER DEFAULT 10,
        wis_base INTEGER DEFAULT 10,
        health_current INTEGER DEFAULT 100,
        health_max INTEGER DEFAULT 100,
        mana_current INTEGER DEFAULT 50,
        mana_max INTEGER DEFAULT 50,
        gold NUMERIC(40,0) DEFAULT 100,
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
        total_uses NUMERIC(40,0) DEFAULT 0,
        last_used TIMESTAMP,
        UNIQUE(character_id, weapon_type)
      )`,

      // Magic affinities table
      `CREATE TABLE IF NOT EXISTS magic_affinities (
        id SERIAL PRIMARY KEY,
        character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
        magic_school VARCHAR(20) NOT NULL,
        affinity_percentage DECIMAL(5,2) DEFAULT 0.00,
        total_uses NUMERIC(40,0) DEFAULT 0,
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
      )`,

      // Phase 2.4: Character backgrounds for creation wizard
      `CREATE TABLE IF NOT EXISTS character_backgrounds (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        description TEXT,
        starting_items JSONB DEFAULT '[]',
        stat_bonuses JSONB DEFAULT '{}',
        starting_gold INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Phase 2.4: Tutorial quests system
      `CREATE TABLE IF NOT EXISTS tutorial_quests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        objectives JSONB DEFAULT '[]',
        rewards JSONB DEFAULT '{}',
        order_sequence INTEGER DEFAULT 0,
        race_specific BOOLEAN DEFAULT false,
        race_id INTEGER REFERENCES races(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Phase 2.4: Character tutorial progress tracking
      `CREATE TABLE IF NOT EXISTS character_tutorial_progress (
        id SERIAL PRIMARY KEY,
        character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
        quest_id INTEGER REFERENCES tutorial_quests(id),
        status VARCHAR(20) DEFAULT 'assigned',
        progress JSONB DEFAULT '{}',
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Phase 2.4: Character creation session data
      `CREATE TABLE IF NOT EXISTS character_creation_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_data JSONB DEFAULT '{}',
        step INTEGER DEFAULT 1,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Phase 2.5: Starting zones table
      `CREATE TABLE IF NOT EXISTS starting_zones (
        id SERIAL PRIMARY KEY,
        zone_name VARCHAR(100) UNIQUE NOT NULL,
        race_id INTEGER REFERENCES races(id),
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        cultural_flavor TEXT,
        welcome_message TEXT,
        zone_level_range VARCHAR(20) DEFAULT '1-10',
        special_features JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Phase 2.5: Racial trainers and merchants
      `CREATE TABLE IF NOT EXISTS racial_npcs (
        id SERIAL PRIMARY KEY,
        zone_name VARCHAR(100) NOT NULL,
        npc_name VARCHAR(100) NOT NULL,
        npc_type VARCHAR(20) NOT NULL, -- 'trainer', 'merchant', 'questgiver'
        race_id INTEGER REFERENCES races(id),
        description TEXT,
        services JSONB DEFAULT '[]',
        location_x INTEGER DEFAULT 0,
        location_y INTEGER DEFAULT 0,
        dialogue_options JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Phase 2.5: Race-specific equipment and items
      `CREATE TABLE IF NOT EXISTS racial_equipment (
        id SERIAL PRIMARY KEY,
        race_id INTEGER REFERENCES races(id),
        item_name VARCHAR(100) NOT NULL,
        item_type VARCHAR(50) NOT NULL,
        description TEXT,
        stats JSONB DEFAULT '{}',
        price INTEGER DEFAULT 0,
        level_requirement INTEGER DEFAULT 1,
        cultural_significance TEXT,
        available_at_start BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Phase 2.5: Race relations system
      `CREATE TABLE IF NOT EXISTS race_relations (
        id SERIAL PRIMARY KEY,
        race1_id INTEGER REFERENCES races(id),
        race2_id INTEGER REFERENCES races(id),
        relation_type VARCHAR(20) NOT NULL, -- 'allied', 'neutral', 'hostile', 'trading'
        relation_strength INTEGER DEFAULT 0, -- -100 to 100
        description TEXT,
        historical_context TEXT,
        trade_bonuses JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(race1_id, race2_id)
      )`,

      // Phase 2.5: Race-specific quests
      `CREATE TABLE IF NOT EXISTS racial_quests (
        id SERIAL PRIMARY KEY,
        race_id INTEGER REFERENCES races(id),
        quest_name VARCHAR(100) NOT NULL,
        description TEXT,
        cultural_story TEXT,
        objectives JSONB DEFAULT '[]',
        rewards JSONB DEFAULT '{}',
        level_requirement INTEGER DEFAULT 1,
        quest_chain_id INTEGER,
        order_in_chain INTEGER DEFAULT 1,
        starting_zone VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Phase 2.5: Character racial quest progress
      `CREATE TABLE IF NOT EXISTS character_racial_quests (
        id SERIAL PRIMARY KEY,
        character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
        quest_id INTEGER REFERENCES racial_quests(id),
        status VARCHAR(20) DEFAULT 'available',
        progress JSONB DEFAULT '{}',
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    
    // Phase 2.4: Initialize character creation system
    await this.insertDefaultBackgrounds();
    await this.insertDefaultTutorialQuests();
    
    // Phase 2.5: Initialize starting zones system
    await this.insertDefaultStartingZones();
    await this.insertDefaultRacialNPCs();
    await this.insertDefaultRacialEquipment();
    await this.insertDefaultRaceRelations();
    await this.insertDefaultRacialQuests();
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

  async insertDefaultBackgrounds() {
    // Check if backgrounds already exist
    const existingBackgrounds = await this.pool.query('SELECT COUNT(*) FROM character_backgrounds');
    if (parseInt(existingBackgrounds.rows[0].count) > 0) {
      console.log('Character backgrounds already exist');
      return;
    }

    const backgrounds = [
      {
        name: 'Noble Born',
        description: 'Raised in luxury with access to the finest education and resources. You begin with extra gold and refined equipment.',
        starting_items: JSON.stringify([
          { name: 'Fine Silk Clothing', type: 'clothing', quantity: 1 },
          { name: 'Silver Ring', type: 'accessory', quantity: 1 },
          { name: 'Letter of Introduction', type: 'document', quantity: 1 }
        ]),
        stat_bonuses: JSON.stringify({ wis: 2, gold_bonus: 200 }),
        starting_gold: 500
      },
      {
        name: 'Street Orphan',
        description: 'Survived on the streets through wit and agility. You possess keen survival instincts and street knowledge.',
        starting_items: JSON.stringify([
          { name: 'Worn Leather Gloves', type: 'gloves', quantity: 1 },
          { name: 'Street Map', type: 'document', quantity: 1 },
          { name: 'Lockpick Set', type: 'tool', quantity: 1 }
        ]),
        stat_bonuses: JSON.stringify({ dex: 3, dodge_bonus: 5 }),
        starting_gold: 50
      },
      {
        name: 'Scholar',
        description: 'Dedicated your life to learning and research. You begin with magical knowledge and research materials.',
        starting_items: JSON.stringify([
          { name: 'Basic Spellbook', type: 'book', quantity: 1 },
          { name: 'Research Notes', type: 'document', quantity: 3 },
          { name: 'Magic Components', type: 'material', quantity: 5 }
        ]),
        stat_bonuses: JSON.stringify({ int: 3, magic_affinity_bonus: 10 }),
        starting_gold: 150
      },
      {
        name: 'Merchant',
        description: 'Traveled trade routes and understand commerce. You start with trading goods and negotiation skills.',
        starting_items: JSON.stringify([
          { name: 'Trade Goods', type: 'commodity', quantity: 3 },
          { name: 'Merchant Ledger', type: 'document', quantity: 1 },
          { name: 'Weight Scales', type: 'tool', quantity: 1 }
        ]),
        stat_bonuses: JSON.stringify({ wis: 2, gold_bonus: 100 }),
        starting_gold: 300
      },
      {
        name: 'Warrior',
        description: 'Trained in combat from a young age. You begin with basic weapons and combat knowledge.',
        starting_items: JSON.stringify([
          { name: 'Training Sword', type: 'weapon', quantity: 1 },
          { name: 'Leather Armor', type: 'armor', quantity: 1 },
          { name: 'Combat Manual', type: 'book', quantity: 1 }
        ]),
        stat_bonuses: JSON.stringify({ str: 3, weapon_affinity_bonus: 10 }),
        starting_gold: 100
      },
      {
        name: 'Hermit',
        description: 'Lived in solitude, mastering nature and inner wisdom. You possess survival skills and natural knowledge.',
        starting_items: JSON.stringify([
          { name: 'Herbal Remedies', type: 'consumable', quantity: 5 },
          { name: 'Nature Guide', type: 'book', quantity: 1 },
          { name: 'Wooden Staff', type: 'weapon', quantity: 1 }
        ]),
        stat_bonuses: JSON.stringify({ wis: 3, vit: 1 }),
        starting_gold: 75
      }
    ];

    for (const background of backgrounds) {
      await this.pool.query(`
        INSERT INTO character_backgrounds (name, description, starting_items, stat_bonuses, starting_gold)
        VALUES ($1, $2, $3, $4, $5)
      `, [background.name, background.description, background.starting_items, 
          background.stat_bonuses, background.starting_gold]);
    }

    console.log('Default character backgrounds inserted');
  }

  async insertDefaultTutorialQuests() {
    // Check if tutorial quests already exist
    const existingTutorials = await this.pool.query('SELECT COUNT(*) FROM tutorial_quests');
    if (parseInt(existingTutorials.rows[0].count) > 0) {
      console.log('Tutorial quests already exist');
      return;
    }

    const tutorials = [
      {
        name: 'Welcome to Aeturnis',
        description: 'Learn the basics of your new adventure in the world of Aeturnis.',
        objectives: JSON.stringify([
          'Read the game interface guide',
          'Check your character stats',
          'Explore the starting area'
        ]),
        rewards: JSON.stringify({ experience: 100, gold: 50 }),
        order_sequence: 1,
        race_specific: false
      },
      {
        name: 'First Steps in Combat',
        description: 'Learn the fundamentals of combat and weapon usage.',
        objectives: JSON.stringify([
          'Engage in practice combat',
          'Use a weapon attack',
          'Understand combat cooldowns'
        ]),
        rewards: JSON.stringify({ experience: 150, gold: 25 }),
        order_sequence: 2,
        race_specific: false
      },
      {
        name: 'Understanding Affinities',
        description: 'Discover how weapon and magic affinities work in Aeturnis.',
        objectives: JSON.stringify([
          'Check your affinity levels',
          'Use different weapon types',
          'Cast a basic spell'
        ]),
        rewards: JSON.stringify({ experience: 200, affinity_boost: 5 }),
        order_sequence: 3,
        race_specific: false
      },
      {
        name: 'Social Features',
        description: 'Learn about chat, groups, and player interaction.',
        objectives: JSON.stringify([
          'Send a message in global chat',
          'View the leaderboard',
          'Check progression system'
        ]),
        rewards: JSON.stringify({ experience: 100, gold: 75 }),
        order_sequence: 4,
        race_specific: false
      }
    ];

    for (const tutorial of tutorials) {
      await this.pool.query(`
        INSERT INTO tutorial_quests (name, description, objectives, rewards, order_sequence, race_specific)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [tutorial.name, tutorial.description, tutorial.objectives, 
          tutorial.rewards, tutorial.order_sequence, tutorial.race_specific]);
    }

    console.log('Default tutorial quests inserted');
  }

  // Phase 2.5: Starting zones seeding methods
  async insertDefaultStartingZones() {
    // Check if starting zones already exist
    const existingZones = await this.pool.query('SELECT COUNT(*) FROM starting_zones');
    if (parseInt(existingZones.rows[0].count) > 0) {
      console.log('Starting zones already exist');
      return;
    }

    const zones = [
      {
        zone_name: 'human_village',
        race_name: 'Human',
        display_name: 'Brightwater Village',
        description: 'A bustling human settlement where merchants, farmers, and adventurers converge. The village serves as a crossroads of trade and opportunity.',
        cultural_flavor: 'Cobblestone streets wind between timber-framed houses with thatched roofs. The sound of hammering from the blacksmith mingles with laughter from the tavern. Humans of all walks of life bustle about their daily business.',
        welcome_message: 'Welcome to Brightwater Village, young adventurer! This thriving community will serve as your home base as you begin your journey.',
        zone_level_range: '1-15',
        special_features: JSON.stringify(['market_square', 'adventurers_guild', 'training_grounds', 'port'])
      },
      {
        zone_name: 'elven_forest',
        race_name: 'Elf',
        display_name: 'Silverleaf Sanctum',
        description: 'An ancient elven city built among towering silver-barked trees. Magic flows through every leaf and stone, creating an atmosphere of timeless wonder.',
        cultural_flavor: 'Elegant spires of living wood spiral upward, connected by graceful bridges of woven branches. Crystals embedded in the trees glow with soft magical light, and the air shimmers with arcane energy.',
        welcome_message: 'May the light of the eternal moon guide you, young elf. Silverleaf Sanctum has stood for millennia, and now it welcomes you to learn its ancient secrets.',
        zone_level_range: '1-15',
        special_features: JSON.stringify(['magic_academy', 'moonwell', 'ancient_library', 'crystal_gardens'])
      },
      {
        zone_name: 'dwarven_halls',
        race_name: 'Dwarf',
        display_name: 'Ironforge Stronghold',
        description: 'A mighty dwarven fortress carved deep into the mountain. The sound of forges and the glow of molten metal echo through its stone corridors.',
        cultural_flavor: 'Massive stone halls supported by carved pillars depict the deeds of ancient dwarven heroes. The air is thick with the scent of metal and stone, punctuated by the rhythmic hammering of countless forges.',
        welcome_message: 'By beard and hammer, welcome to Ironforge! These halls have sheltered our people for generations, and now they shelter you, young dwarf.',
        zone_level_range: '1-15',
        special_features: JSON.stringify(['great_forge', 'mine_entrance', 'warrior_training', 'gem_markets'])
      },
      {
        zone_name: 'orc_stronghold',
        race_name: 'Orc',
        display_name: 'Bloodfang Warcamp',
        description: 'A formidable orcish stronghold built for war. Massive wooden palisades and iron spikes create an imposing fortress that speaks of strength and conquest.',
        cultural_flavor: 'War drums echo across the camp as orcs train for battle. Crude but effective structures of wood and iron provide shelter, while weapon racks display an impressive array of brutal armaments.',
        welcome_message: 'Strength and honor, young warrior! Bloodfang Warcamp breeds the mightiest fighters in all the lands. Prove your worth or be trampled underfoot.',
        zone_level_range: '1-15',
        special_features: JSON.stringify(['arena', 'weapon_pits', 'war_council', 'trophy_hall'])
      },
      {
        zone_name: 'halfling_shire',
        race_name: 'Halfling',
        display_name: 'Greenhill Commons',
        description: 'A peaceful halfling community of round-door houses built into rolling hills. Gardens and farms stretch as far as the eye can see.',
        cultural_flavor: 'Cozy hobbit-holes dot the landscape like colorful flowers. Smoke rises from numerous chimneys, carrying the scent of baking bread and hearty stews. Children play in meadows while adults tend their beloved gardens.',
        welcome_message: 'A very good morning to you! Greenhill Commons may seem small, but great adventures often begin in the most unlikely places.',
        zone_level_range: '1-15',
        special_features: JSON.stringify(['feast_hall', 'garden_maze', 'burrow_market', 'celebration_grounds'])
      },
      {
        zone_name: 'gnome_workshop',
        race_name: 'Gnome',
        display_name: 'Gearspring Laboratory',
        description: 'A sprawling gnomish invention facility where magic and machinery blend in impossible ways. Steam and sparks fill the air as countless experiments unfold.',
        cultural_flavor: 'Clockwork contraptions tick and whir alongside bubbling alchemical apparatuses. Gnomes scurry about with tools and components, their excited chatter mixing with the sounds of their incredible inventions.',
        welcome_message: 'Magnificent! Another brilliant mind joins our ranks! Gearspring Laboratory is where impossibility becomes reality through ingenuity and determination.',
        zone_level_range: '1-15',
        special_features: JSON.stringify(['invention_labs', 'magic_workshop', 'automaton_factory', 'experiment_chambers'])
      },
      {
        zone_name: 'dark_caverns',
        race_name: 'Dark Elf',
        display_name: 'Shadowhaven Enclave',
        description: 'A hidden dark elf city deep underground, illuminated by phosphorescent fungi and dark magic. Shadows dance across obsidian walls carved with ancient runes.',
        cultural_flavor: 'Sleek black architecture rises from the cavern floor, lit by eerie purple and blue glows. Dark elves move silently through the streets, their eyes gleaming in the otherworldly light.',
        welcome_message: 'Welcome to the depths, child of shadow. Shadowhaven has remained hidden from the surface world for centuries, and here you will learn our dark arts.',
        zone_level_range: '1-15',
        special_features: JSON.stringify(['shadow_academy', 'poison_gardens', 'assassin_quarters', 'dark_markets'])
      },
      {
        zone_name: 'dragon_peaks',
        race_name: 'Dragonborn',
        display_name: 'Draconic Aerie',
        description: 'A majestic dragonborn citadel built on mountain peaks where dragons once soared. Ancient draconic magic still permeates the thin mountain air.',
        cultural_flavor: 'Towering spires of dragonbone and scale-forged metal reach toward the sky. Massive platforms provide landing areas for the few remaining dragons, while dragonborn patrol with regal bearing.',
        welcome_message: 'Rise, descendant of dragons! The Draconic Aerie has waited long for one such as you. Here, you will reclaim the power that flows in your ancient bloodline.',
        zone_level_range: '1-15',
        special_features: JSON.stringify(['dragon_roost', 'breath_training', 'scale_armor_forge', 'aerial_platforms'])
      },
      {
        zone_name: 'cursed_graveyard',
        race_name: 'Undead',
        display_name: 'Whisperfall Necropolis',
        description: 'A sprawling city of the undead built among ancient crypts and mausoleums. Death magic flows freely here, sustaining the unliving inhabitants.',
        cultural_flavor: 'Crumbling stone monuments stretch endlessly under a perpetually gray sky. Wisps of necromantic energy drift between the tombs, and the air carries whispers of the long dead.',
        welcome_message: 'Death has brought you here, but not as an ending. Whisperfall Necropolis is where the undead find purpose beyond the grave.',
        zone_level_range: '1-15',
        special_features: JSON.stringify(['necromantic_academy', 'bone_markets', 'spirit_wells', 'eternal_crypts'])
      }
    ];

    for (const zone of zones) {
      try {
        // Get race ID
        const raceResult = await this.pool.query('SELECT id FROM races WHERE name = $1', [zone.race_name]);
        if (raceResult.rows.length > 0) {
          const raceId = raceResult.rows[0].id;
          
          await this.pool.query(
            `INSERT INTO starting_zones (zone_name, race_id, display_name, description, cultural_flavor, welcome_message, zone_level_range, special_features)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (zone_name) DO NOTHING`,
            [zone.zone_name, raceId, zone.display_name, zone.description, zone.cultural_flavor, zone.welcome_message, zone.zone_level_range, zone.special_features]
          );
        }
      } catch (error) {
        console.error(`Error inserting starting zone ${zone.zone_name}:`, error);
      }
    }
    console.log('Starting zones initialized');
  }

  async insertDefaultRacialNPCs() {
    // Check if racial NPCs already exist
    const existingNPCs = await this.pool.query('SELECT COUNT(*) FROM racial_npcs');
    if (parseInt(existingNPCs.rows[0].count) > 0) {
      console.log('Racial NPCs already exist');
      return;
    }

    const npcs = [
      // Human NPCs
      { zone_name: 'human_village', npc_name: 'Captain Marcus Brightwater', npc_type: 'trainer', race_name: 'Human', description: 'A veteran soldier who trains new recruits in combat basics.', services: JSON.stringify(['weapon_training', 'basic_combat']), dialogue_options: JSON.stringify({ greeting: 'Ready to learn the blade, recruit?', training: 'Discipline and practice make a warrior.' }) },
      { zone_name: 'human_village', npc_name: 'Merchant Elena Goldcoin', npc_type: 'merchant', race_name: 'Human', description: 'A savvy trader offering basic equipment to starting adventurers.', services: JSON.stringify(['basic_weapons', 'armor', 'supplies']), dialogue_options: JSON.stringify({ greeting: 'Welcome to my shop!', trade: 'Fair prices for quality goods.' }) },
      { zone_name: 'human_village', npc_name: 'Sage Aldric the Learned', npc_type: 'questgiver', race_name: 'Human', description: 'An elderly scholar who guides newcomers on their first adventures.', services: JSON.stringify(['quests', 'lore']), dialogue_options: JSON.stringify({ greeting: 'Ah, a new face seeking adventure!', quest: 'Every journey begins with a single step.' }) },

      // Elf NPCs
      { zone_name: 'elven_forest', npc_name: 'Archmagus Silverwind', npc_type: 'trainer', race_name: 'Elf', description: 'An ancient elf master who teaches the mysteries of magic.', services: JSON.stringify(['magic_training', 'spell_research']), dialogue_options: JSON.stringify({ greeting: 'The weave of magic calls to you, young one.', training: 'Magic flows through all things - learn to guide its current.' }) },
      { zone_name: 'elven_forest', npc_name: 'Artisan Moonwhisper', npc_type: 'merchant', race_name: 'Elf', description: 'A master craftsman creating elegant elven equipment.', services: JSON.stringify(['elven_weapons', 'magic_items', 'enchanted_gear']), dialogue_options: JSON.stringify({ greeting: 'May starlight guide your path.', trade: 'Each piece is crafted with centuries of tradition.' }) },
      { zone_name: 'elven_forest', npc_name: 'Lorekeeper Starleaf', npc_type: 'questgiver', race_name: 'Elf', description: 'A guardian of elven lore who assigns tasks to preserve their heritage.', services: JSON.stringify(['ancient_quests', 'magical_research']), dialogue_options: JSON.stringify({ greeting: 'The forest whispers of your arrival.', quest: 'Ancient mysteries await those wise enough to seek them.' }) },

      // Dwarf NPCs
      { zone_name: 'dwarven_halls', npc_name: 'Warmaster Ironbeard', npc_type: 'trainer', race_name: 'Dwarf', description: 'A grizzled dwarf veteran who forges warriors in the fires of training.', services: JSON.stringify(['weapon_mastery', 'armor_training']), dialogue_options: JSON.stringify({ greeting: 'By my beard, another warrior seeks the forge!', training: 'Iron sharpens iron - let us forge you into steel!' }) },
      { zone_name: 'dwarven_halls', npc_name: 'Smith Goldanvil', npc_type: 'merchant', race_name: 'Dwarf', description: 'A master weaponsmith whose creations are legendary.', services: JSON.stringify(['dwarven_weapons', 'heavy_armor', 'forge_materials']), dialogue_options: JSON.stringify({ greeting: 'Welcome to the finest forge in the mountain!', trade: 'Every weapon tells a story - let me craft yours.' }) },
      { zone_name: 'dwarven_halls', npc_name: 'Elder Stonebeard', npc_type: 'questgiver', race_name: 'Dwarf', description: 'A wise dwarf elder who knows every tunnel and secret of the mountain.', services: JSON.stringify(['mountain_quests', 'clan_missions']), dialogue_options: JSON.stringify({ greeting: 'Stone and steel, young one!', quest: 'The mountain holds many secrets for those bold enough to seek them.' }) },

      // Orc NPCs
      { zone_name: 'orc_stronghold', npc_name: 'Bloodlord Grimfang', npc_type: 'trainer', race_name: 'Orc', description: 'A fearsome orc warlord who trains warriors in brutal combat.', services: JSON.stringify(['berserker_training', 'rage_mastery']), dialogue_options: JSON.stringify({ greeting: 'Another weakling seeks strength!', training: 'Pain is the only teacher that matters!' }) },
      { zone_name: 'orc_stronghold', npc_name: 'Weaponmaster Skullsplitter', npc_type: 'merchant', race_name: 'Orc', description: 'A battle-scarred orc who sells weapons taken from fallen foes.', services: JSON.stringify(['crude_weapons', 'battle_gear', 'trophies']), dialogue_options: JSON.stringify({ greeting: 'You want weapons? I have the best!', trade: 'These weapons have tasted blood - they hunger for more!' }) },
      { zone_name: 'orc_stronghold', npc_name: 'Shaman Bonecrusher', npc_type: 'questgiver', race_name: 'Orc', description: 'A wise orc shaman who guides the tribe with ancient wisdom.', services: JSON.stringify(['tribal_quests', 'spirit_missions']), dialogue_options: JSON.stringify({ greeting: 'The spirits speak of your coming.', quest: 'Prove your worth to the ancestors!' }) }
    ];

    for (const npc of npcs) {
      try {
        // Get race ID
        const raceResult = await this.pool.query('SELECT id FROM races WHERE name = $1', [npc.race_name]);
        if (raceResult.rows.length > 0) {
          const raceId = raceResult.rows[0].id;
          
          await this.pool.query(
            `INSERT INTO racial_npcs (zone_name, npc_name, npc_type, race_id, description, services, dialogue_options)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [npc.zone_name, npc.npc_name, npc.npc_type, raceId, npc.description, npc.services, npc.dialogue_options]
          );
        }
      } catch (error) {
        console.error(`Error inserting NPC ${npc.npc_name}:`, error);
      }
    }
    console.log('Racial NPCs initialized');
  }

  async insertDefaultRacialEquipment() {
    // Check if racial equipment already exists
    const existingEquipment = await this.pool.query('SELECT COUNT(*) FROM racial_equipment');
    if (parseInt(existingEquipment.rows[0].count) > 0) {
      console.log('Racial equipment already exist');
      return;
    }

    const equipment = [
      // Human equipment
      { race_name: 'Human', item_name: 'Human Steel Sword', item_type: 'weapon', description: 'A well-balanced sword forged in human traditions.', stats: JSON.stringify({ damage: '15-25', type: 'slashing', weight: 3.5 }), price: 100, available_at_start: true, cultural_significance: 'Symbol of human versatility and adaptability' },
      { race_name: 'Human', item_name: 'Village Guard Armor', item_type: 'armor', description: 'Standard leather armor worn by village guards.', stats: JSON.stringify({ defense: 12, weight: 8 }), price: 75, available_at_start: true, cultural_significance: 'Represents duty and protection of community' },
      
      // Elf equipment
      { race_name: 'Elf', item_name: 'Silverleaf Bow', item_type: 'weapon', description: 'An elegant elven bow crafted from sacred silverleaf wood.', stats: JSON.stringify({ damage: '18-30', type: 'piercing', weight: 2.0, magical: true }), price: 200, available_at_start: true, cultural_significance: 'Connects the wielder to the forest spirits' },
      { race_name: 'Elf', item_name: 'Moonweave Robes', item_type: 'armor', description: 'Flowing robes woven with moonlight and starthread.', stats: JSON.stringify({ defense: 8, magic_resistance: 15, weight: 1 }), price: 150, available_at_start: true, cultural_significance: 'Enhances magical sensitivity and connection to nature' },
      
      // Dwarf equipment
      { race_name: 'Dwarf', item_name: 'Dwarven War Hammer', item_type: 'weapon', description: 'A mighty hammer forged in the heart of the mountain.', stats: JSON.stringify({ damage: '20-35', type: 'bludgeoning', weight: 8.0 }), price: 180, available_at_start: true, cultural_significance: 'Represents the dwarven mastery of metal and stone' },
      { race_name: 'Dwarf', item_name: 'Mountain Scale Mail', item_type: 'armor', description: 'Sturdy armor crafted from mountain metals.', stats: JSON.stringify({ defense: 18, durability: 200, weight: 15 }), price: 120, available_at_start: true, cultural_significance: 'Provides protection worthy of the mountain halls' },
      
      // Orc equipment
      { race_name: 'Orc', item_name: 'Bloodfang Cleaver', item_type: 'weapon', description: 'A brutal weapon designed for maximum carnage.', stats: JSON.stringify({ damage: '22-40', type: 'slashing', weight: 6.0, intimidation: 5 }), price: 140, available_at_start: true, cultural_significance: 'Shows the brutal efficiency of orc warfare' },
      { race_name: 'Orc', item_name: 'Spiked War Harness', item_type: 'armor', description: 'Intimidating armor designed to inspire fear.', stats: JSON.stringify({ defense: 15, intimidation: 10, weight: 12 }), price: 90, available_at_start: true, cultural_significance: 'Displays the wearer\'s warrior status and ferocity' }
    ];

    for (const item of equipment) {
      try {
        // Get race ID
        const raceResult = await this.pool.query('SELECT id FROM races WHERE name = $1', [item.race_name]);
        if (raceResult.rows.length > 0) {
          const raceId = raceResult.rows[0].id;
          
          await this.pool.query(
            `INSERT INTO racial_equipment (race_id, item_name, item_type, description, stats, price, level_requirement, cultural_significance, available_at_start)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [raceId, item.item_name, item.item_type, item.description, item.stats, item.price, item.level_requirement || 1, item.cultural_significance, item.available_at_start]
          );
        }
      } catch (error) {
        console.error(`Error inserting equipment ${item.item_name}:`, error);
      }
    }
    console.log('Racial equipment initialized');
  }

  async insertDefaultRaceRelations() {
    // Check if race relations already exist
    const existingRelations = await this.pool.query('SELECT COUNT(*) FROM race_relations');
    if (parseInt(existingRelations.rows[0].count) > 0) {
      console.log('Race relations already exist');
      return;
    }

    const relations = [
      // Human relations
      { race1: 'Human', race2: 'Elf', relation_type: 'allied', relation_strength: 60, description: 'Long-standing trade and diplomatic relations', historical_context: 'Humans and elves have maintained peaceful relations for centuries through mutual trade agreements.' },
      { race1: 'Human', race2: 'Dwarf', relation_type: 'allied', relation_strength: 70, description: 'Strong military and trade alliance', historical_context: 'Dwarven craftsmanship and human resources create a powerful economic partnership.' },
      { race1: 'Human', race2: 'Halfling', relation_type: 'allied', relation_strength: 80, description: 'Protective relationship and agricultural trade', historical_context: 'Humans have long protected halfling settlements in exchange for agricultural surplus.' },
      { race1: 'Human', race2: 'Orc', relation_type: 'hostile', relation_strength: -40, description: 'Historical conflicts over territory', historical_context: 'Generations of border wars have created lasting animosity between these races.' },
      
      // Elf relations
      { race1: 'Elf', race2: 'Dwarf', relation_type: 'neutral', relation_strength: 10, description: 'Philosophical differences but mutual respect', historical_context: 'Elves value nature while dwarves shape it, leading to ideological tension but no open conflict.' },
      { race1: 'Elf', race2: 'Dark Elf', relation_type: 'hostile', relation_strength: -80, description: 'Ancient schism and betrayal', historical_context: 'The dark elves\' exile and turn to shadow magic created an irreparable rift.' },
      { race1: 'Elf', race2: 'Gnome', relation_type: 'allied', relation_strength: 50, description: 'Shared love of magic and nature', historical_context: 'Both races appreciate the delicate balance between magic and the natural world.' },
      
      // Dwarf relations
      { race1: 'Dwarf', race2: 'Gnome', relation_type: 'allied', relation_strength: 65, description: 'Shared craftsmanship and engineering', historical_context: 'Dwarven forging techniques complement gnomish innovation and precision.' },
      { race1: 'Dwarf', race2: 'Orc', relation_type: 'hostile', relation_strength: -70, description: 'Competition for mountain resources', historical_context: 'Orcs frequently raid dwarven mines and strongholds for weapons and treasure.' },
      
      // Orc relations
      { race1: 'Orc', race2: 'Dark Elf', relation_type: 'trading', relation_strength: 30, description: 'Weapons for dark magic exchange', historical_context: 'A pragmatic alliance born of mutual benefit rather than friendship.' },
      { race1: 'Orc', race2: 'Undead', relation_type: 'neutral', relation_strength: -10, description: 'Cautious coexistence', historical_context: 'Orcs respect strength, even in undeath, but find the unliving unnatural.' },
      
      // Dark Elf relations
      { race1: 'Dark Elf', race2: 'Undead', relation_type: 'allied', relation_strength: 40, description: 'Shared affinity for dark magic', historical_context: 'Both races draw power from shadow and death, creating natural understanding.' },
      
      // Dragonborn relations
      { race1: 'Dragonborn', race2: 'Human', relation_type: 'neutral', relation_strength: 20, description: 'Cautious respect', historical_context: 'Humans admire dragonborn power but fear their ancient heritage.' },
      { race1: 'Dragonborn', race2: 'Elf', relation_type: 'neutral', relation_strength: 15, description: 'Ancient rivals turned neutral', historical_context: 'Dragons and elves once competed for magical dominance, now maintain wary peace.' }
    ];

    for (const relation of relations) {
      try {
        // Get race IDs
        const race1Result = await this.pool.query('SELECT id FROM races WHERE name = $1', [relation.race1]);
        const race2Result = await this.pool.query('SELECT id FROM races WHERE name = $1', [relation.race2]);
        
        if (race1Result.rows.length > 0 && race2Result.rows.length > 0) {
          const race1Id = race1Result.rows[0].id;
          const race2Id = race2Result.rows[0].id;
          
          await this.pool.query(
            `INSERT INTO race_relations (race1_id, race2_id, relation_type, relation_strength, description, historical_context)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [race1Id, race2Id, relation.relation_type, relation.relation_strength, relation.description, relation.historical_context]
          );
        }
      } catch (error) {
        console.error(`Error inserting race relation ${relation.race1}-${relation.race2}:`, error);
      }
    }
    console.log('Race relations initialized');
  }

  async insertDefaultRacialQuests() {
    // Check if racial quests already exist
    const existingQuests = await this.pool.query('SELECT COUNT(*) FROM racial_quests');
    if (parseInt(existingQuests.rows[0].count) > 0) {
      console.log('Racial quests already exist');
      return;
    }

    const quests = [
      // Human quests
      {
        race_name: 'Human',
        quest_name: 'Village Defense',
        description: 'Protect Brightwater Village from approaching bandits.',
        cultural_story: 'As a human, your adaptability and determination are your greatest assets. The village has been your home, and now it needs your protection.',
        objectives: JSON.stringify([
          { type: 'kill', target: 'bandit', count: 5, description: 'Defeat 5 bandits threatening the village' },
          { type: 'interact', target: 'Captain Marcus', description: 'Report back to Captain Marcus' }
        ]),
        rewards: JSON.stringify({ experience: 100, gold: 50, items: ['Iron Sword'] }),
        starting_zone: 'human_village'
      },
      
      // Elf quests
      {
        race_name: 'Elf',
        quest_name: 'The Dying Grove',
        description: 'Investigate the corruption spreading through the sacred grove.',
        cultural_story: 'The ancient connection between elves and nature calls you to action. The forest spirits whisper of a growing darkness that threatens the balance.',
        objectives: JSON.stringify([
          { type: 'explore', target: 'corrupted_grove', description: 'Investigate the source of corruption' },
          { type: 'cast', spell: 'purification', count: 3, description: 'Cast purification magic on infected trees' },
          { type: 'collect', item: 'moonwell_water', count: 1, description: 'Gather blessed water from the moonwell' }
        ]),
        rewards: JSON.stringify({ experience: 120, gold: 40, items: ['Elven Cloak'], magic_affinity: 10 }),
        starting_zone: 'elven_forest'
      },
      
      // Dwarf quests
      {
        race_name: 'Dwarf',
        quest_name: 'Reclaim the Mine',
        description: 'Clear the collapsed mine tunnel and restore access to the iron veins.',
        cultural_story: 'Dwarven heritage runs deep in the mountain tunnels. Your people have worked these mines for generations, and it falls to you to restore their glory.',
        objectives: JSON.stringify([
          { type: 'kill', target: 'cave_spider', count: 8, description: 'Clear out dangerous cave spiders' },
          { type: 'mine', resource: 'iron_ore', count: 10, description: 'Extract iron ore from the reclaimed tunnel' },
          { type: 'craft', item: 'iron_ingot', count: 5, description: 'Smelt iron ingots at the forge' }
        ]),
        rewards: JSON.stringify({ experience: 110, gold: 60, items: ['Dwarven Pickaxe'], weapon_affinity: 15 }),
        starting_zone: 'dwarven_halls'
      },
      
      // Orc quests
      {
        race_name: 'Orc',
        quest_name: 'Trial by Combat',
        description: 'Prove your strength in the arena to earn your place among the warriors.',
        cultural_story: 'Strength defines worth in orc society. Only through combat can you prove that the blood of warriors flows in your veins.',
        objectives: JSON.stringify([
          { type: 'defeat', target: 'arena_challenger', count: 3, description: 'Defeat 3 challengers in single combat' },
          { type: 'survive', duration: 300, description: 'Survive 5 minutes in the warrior pit' },
          { type: 'collect', item: 'trophy_tooth', count: 1, description: 'Claim a trophy from your strongest opponent' }
        ]),
        rewards: JSON.stringify({ experience: 130, gold: 30, items: ['War Paint', 'Bone Trophy'], strength_bonus: 2 }),
        starting_zone: 'orc_stronghold'
      },
      
      // Dark Elf quests
      {
        race_name: 'Dark Elf',
        quest_name: 'Shadows of the Past',
        description: 'Uncover the ancient secrets hidden in the deepest chambers of Shadowhaven.',
        cultural_story: 'The dark paths call to you, child of shadow. Ancient knowledge awaits those brave enough to delve into the forbidden depths.',
        objectives: JSON.stringify([
          { type: 'explore', target: 'ancient_chamber', description: 'Locate the sealed chamber beneath the city' },
          { type: 'decipher', target: 'shadow_runes', count: 5, description: 'Translate the ancient shadow script' },
          { type: 'ritual', target: 'shadow_binding', description: 'Complete the shadow binding ritual' }
        ]),
        rewards: JSON.stringify({ experience: 140, gold: 45, items: ['Shadow Cloak'], dark_magic: 20 }),
        starting_zone: 'dark_caverns'
      }
    ];

    for (const quest of quests) {
      try {
        // Get race ID
        const raceResult = await this.pool.query('SELECT id FROM races WHERE name = $1', [quest.race_name]);
        if (raceResult.rows.length > 0) {
          const raceId = raceResult.rows[0].id;
          
          await this.pool.query(
            `INSERT INTO racial_quests (race_id, quest_name, description, cultural_story, objectives, rewards, starting_zone)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [raceId, quest.quest_name, quest.description, quest.cultural_story, quest.objectives, quest.rewards, quest.starting_zone]
          );
        }
      } catch (error) {
        console.error(`Error inserting racial quest ${quest.quest_name}:`, error);
      }
    }
    console.log('Racial quests initialized');
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