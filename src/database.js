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
      )`
    ];

    for (const query of queries) {
      await this.pool.query(query);
    }

    // Insert default races if they don't exist
    await this.insertDefaultRaces();
  }

  async insertDefaultRaces() {
    const defaultRaces = [
      {
        name: 'Human',
        description: 'Balanced race with no particular strengths or weaknesses. Versatile and adaptable.',
        str_modifier: 0, int_modifier: 0, vit_modifier: 0, dex_modifier: 0, wis_modifier: 0,
        starting_zone: 'human_village'
      },
      {
        name: 'Elf',
        description: 'Graceful and intelligent, with natural magical affinity but physically frail.',
        str_modifier: -2, int_modifier: 3, vit_modifier: -1, dex_modifier: 2, wis_modifier: 3,
        starting_zone: 'elven_forest'
      },
      {
        name: 'Dwarf',
        description: 'Hardy mountain folk with great strength and constitution but lacking in agility.',
        str_modifier: 3, int_modifier: 1, vit_modifier: 4, dex_modifier: -2, wis_modifier: 1,
        starting_zone: 'dwarven_halls'
      },
      {
        name: 'Orc',
        description: 'Powerful warriors with incredible strength but limited intelligence and wisdom.',
        str_modifier: 4, int_modifier: -2, vit_modifier: 3, dex_modifier: 0, wis_modifier: -2,
        starting_zone: 'orc_stronghold'
      },
      {
        name: 'Halfling',
        description: 'Small but nimble folk with keen senses and natural luck.',
        str_modifier: -2, int_modifier: 1, vit_modifier: 1, dex_modifier: 4, wis_modifier: 2,
        starting_zone: 'halfling_shire'
      },
      {
        name: 'Gnome',
        description: 'Tiny but brilliant, masters of both magic and mechanical contraptions.',
        str_modifier: -3, int_modifier: 4, vit_modifier: -1, dex_modifier: 1, wis_modifier: 4,
        starting_zone: 'gnome_workshop'
      },
      {
        name: 'Dark Elf',
        description: 'Mysterious underground dwellers with dark magic affinity and deadly precision.',
        str_modifier: 1, int_modifier: 2, vit_modifier: 0, dex_modifier: 3, wis_modifier: 1,
        starting_zone: 'dark_caverns'
      },
      {
        name: 'Dragonborn',
        description: 'Descendants of dragons with balanced abilities and natural magical resistance.',
        str_modifier: 2, int_modifier: 2, vit_modifier: 2, dex_modifier: 1, wis_modifier: 2,
        starting_zone: 'dragon_peaks'
      }
    ];

    for (const race of defaultRaces) {
      try {
        await this.pool.query(
          `INSERT INTO races (name, description, str_modifier, int_modifier, vit_modifier, dex_modifier, wis_modifier, starting_zone)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (name) DO NOTHING`,
          [race.name, race.description, race.str_modifier, race.int_modifier, 
           race.vit_modifier, race.dex_modifier, race.wis_modifier, race.starting_zone]
        );
      } catch (error) {
        console.error(`Error inserting race ${race.name}:`, error);
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