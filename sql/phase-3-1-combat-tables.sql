-- Phase 3.1: Turn-Based Combat with Spam Prevention
-- Database tables for combat system

-- Combat sessions table for tracking active battles
CREATE TABLE IF NOT EXISTS combat_sessions (
    id SERIAL PRIMARY KEY,
    attacker_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    defender_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    defender_type VARCHAR(50) NOT NULL DEFAULT 'monster', -- 'player' or 'monster'
    monster_id INTEGER REFERENCES monsters(id) ON DELETE CASCADE,
    session_status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, completed, fled
    turn_count INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    winner_id INTEGER,
    winner_type VARCHAR(50), -- 'player' or 'monster'
    experience_gained NUMERIC(40,0) DEFAULT 0,
    gold_gained NUMERIC(40,0) DEFAULT 0,
    loot_gained JSONB DEFAULT '[]'
);

-- Combat actions log for tracking all combat moves
CREATE TABLE IF NOT EXISTS combat_actions (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES combat_sessions(id) ON DELETE CASCADE,
    actor_id INTEGER NOT NULL,
    actor_type VARCHAR(50) NOT NULL, -- 'player' or 'monster'
    action_type VARCHAR(50) NOT NULL, -- 'attack', 'spell', 'skill', 'item', 'flee'
    action_details JSONB NOT NULL, -- weapon/spell/skill used, damage dealt, etc.
    damage_dealt INTEGER DEFAULT 0,
    damage_type VARCHAR(50), -- 'physical', 'fire', 'ice', etc.
    critical_hit BOOLEAN DEFAULT FALSE,
    dodged BOOLEAN DEFAULT FALSE,
    blocked BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Player action cooldowns for spam prevention
CREATE TABLE IF NOT EXISTS player_cooldowns (
    character_id INTEGER PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
    last_action_time TIMESTAMP NOT NULL DEFAULT NOW(),
    action_count INTEGER DEFAULT 0, -- Actions in current window
    cooldown_until TIMESTAMP, -- When player can act again
    spam_warnings INTEGER DEFAULT 0,
    temp_locked_until TIMESTAMP, -- Temporary lock for spam
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Combat queue for managing turn order and actions
CREATE TABLE IF NOT EXISTS combat_queue (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES combat_sessions(id) ON DELETE CASCADE,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_data JSONB NOT NULL,
    priority INTEGER DEFAULT 0, -- For handling simultaneous actions
    processed BOOLEAN DEFAULT FALSE,
    queued_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Monsters table (basic implementation for combat)
CREATE TABLE IF NOT EXISTS monsters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    base_health INTEGER NOT NULL DEFAULT 100,
    base_damage INTEGER NOT NULL DEFAULT 10,
    defense INTEGER NOT NULL DEFAULT 5,
    experience_reward NUMERIC(40,0) NOT NULL DEFAULT 50,
    gold_reward NUMERIC(40,0) NOT NULL DEFAULT 10,
    element_type VARCHAR(50) DEFAULT 'neutral',
    special_abilities JSONB DEFAULT '[]',
    loot_table JSONB DEFAULT '[]',
    spawn_zone VARCHAR(100) NOT NULL,
    respawn_time INTEGER DEFAULT 300, -- seconds
    created_at TIMESTAMP DEFAULT NOW()
);

-- Monster spawns for tracking active monsters
CREATE TABLE IF NOT EXISTS monster_spawns (
    id SERIAL PRIMARY KEY,
    monster_id INTEGER NOT NULL REFERENCES monsters(id) ON DELETE CASCADE,
    current_health INTEGER NOT NULL,
    max_health INTEGER NOT NULL,
    location_zone VARCHAR(100) NOT NULL,
    location_x INTEGER DEFAULT 0,
    location_y INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'alive', -- alive, in_combat, dead
    spawned_at TIMESTAMP DEFAULT NOW(),
    last_combat TIMESTAMP,
    respawn_at TIMESTAMP
);

-- Combat buffs and debuffs
CREATE TABLE IF NOT EXISTS combat_effects (
    id SERIAL PRIMARY KEY,
    target_id INTEGER NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'player' or 'monster'
    effect_type VARCHAR(50) NOT NULL, -- 'buff' or 'debuff'
    effect_name VARCHAR(100) NOT NULL,
    effect_data JSONB NOT NULL, -- stat changes, damage over time, etc.
    duration INTEGER NOT NULL, -- in seconds
    remaining_duration INTEGER NOT NULL,
    applied_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_combat_sessions_status ON combat_sessions(session_status);
CREATE INDEX idx_combat_sessions_attacker ON combat_sessions(attacker_id);
CREATE INDEX idx_combat_sessions_defender ON combat_sessions(defender_id);
CREATE INDEX idx_combat_actions_session ON combat_actions(session_id);
CREATE INDEX idx_player_cooldowns_updated ON player_cooldowns(updated_at);
CREATE INDEX idx_combat_queue_session ON combat_queue(session_id, processed);
CREATE INDEX idx_monster_spawns_zone ON monster_spawns(location_zone, status);
CREATE INDEX idx_combat_effects_target ON combat_effects(target_id, target_type, expires_at);