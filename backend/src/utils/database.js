const fs = require('fs').promises;
const path = require('path');

/**
 * Database Manager for Aeturnis Online MMORPG
 * Provides JSON file-based storage with backup and search capabilities
 */
class Database {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.backupDir = path.join(this.dataDir, 'backups');
    this.initializeDirectories();
  }

  async initializeDirectories() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log('📁 Database directories initialized');
    } catch (error) {
      console.error('Error initializing database directories:', error);
    }
  }

  // Get data file path for collection
  getFilePath(collection) {
    return path.join(this.dataDir, `${collection}.json`);
  }

  // Read entire collection
  async read(collection) {
    try {
      const filePath = this.getFilePath(collection);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return empty object
        return {};
      }
      throw error;
    }
  }

  // Write entire collection
  async write(collection, data) {
    try {
      const filePath = this.getFilePath(collection);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing to ${collection}:`, error);
      throw error;
    }
  }

  // Get specific item from collection
  async get(collection, key) {
    const data = await this.read(collection);
    return data[key] || null;
  }

  // Set specific item in collection
  async set(collection, key, value) {
    const data = await this.read(collection);
    data[key] = {
      ...value,
      _id: key,
      _created: data[key]?._created || new Date().toISOString(),
      _updated: new Date().toISOString()
    };
    await this.write(collection, data);
    return data[key];
  }

  // Delete item from collection
  async delete(collection, key) {
    const data = await this.read(collection);
    if (data[key]) {
      delete data[key];
      await this.write(collection, data);
      return true;
    }
    return false;
  }

  // List all keys in collection
  async list(collection) {
    const data = await this.read(collection);
    return Object.keys(data);
  }

  // Get all items in collection as array
  async getAll(collection) {
    const data = await this.read(collection);
    return Object.values(data);
  }

  // Get multiple items from collection
  async getMany(collection, keys) {
    const data = await this.read(collection);
    const result = {};
    keys.forEach(key => {
      if (data[key]) {
        result[key] = data[key];
      }
    });
    return result;
  }

  // Search collection by criteria
  async search(collection, criteria) {
    const data = await this.read(collection);
    const results = [];
    
    Object.entries(data).forEach(([key, value]) => {
      let matches = true;
      Object.entries(criteria).forEach(([field, searchValue]) => {
        if (field.includes('.')) {
          // Support nested field search (e.g., 'profile.level')
          const fieldParts = field.split('.');
          let currentValue = value;
          for (const part of fieldParts) {
            currentValue = currentValue?.[part];
          }
          if (currentValue !== searchValue) {
            matches = false;
          }
        } else if (value[field] !== searchValue) {
          matches = false;
        }
      });
      if (matches) {
        results.push({ key, ...value });
      }
    });
    
    return results;
  }

  // Advanced search with operators
  async query(collection, query) {
    const data = await this.read(collection);
    const results = [];
    
    Object.entries(data).forEach(([key, value]) => {
      let matches = true;
      
      Object.entries(query).forEach(([field, condition]) => {
        if (typeof condition === 'object' && condition !== null) {
          // Handle operators like $gt, $lt, $in, etc.
          Object.entries(condition).forEach(([operator, operand]) => {
            const fieldValue = value[field];
            switch (operator) {
              case '$gt':
                if (fieldValue <= operand) matches = false;
                break;
              case '$gte':
                if (fieldValue < operand) matches = false;
                break;
              case '$lt':
                if (fieldValue >= operand) matches = false;
                break;
              case '$lte':
                if (fieldValue > operand) matches = false;
                break;
              case '$in':
                if (!operand.includes(fieldValue)) matches = false;
                break;
              case '$nin':
                if (operand.includes(fieldValue)) matches = false;
                break;
              case '$ne':
                if (fieldValue === operand) matches = false;
                break;
              case '$exists':
                if (operand && fieldValue === undefined) matches = false;
                if (!operand && fieldValue !== undefined) matches = false;
                break;
            }
          });
        } else {
          // Simple equality check
          if (value[field] !== condition) matches = false;
        }
      });
      
      if (matches) {
        results.push({ key, ...value });
      }
    });
    
    return results;
  }

  // Create backup of collection
  async backup(collection) {
    try {
      const data = await this.read(collection);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `${collection}_${timestamp}.json`);
      await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
      console.log(`✅ Backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error(`Error creating backup for ${collection}:`, error);
      throw error;
    }
  }

  // Initialize default collections for MMORPG
  async initializeCollections() {
    const collections = [
      'users',        // Player accounts
      'characters',   // Character data
      'zones',        // Game world zones
      'monsters',     // Monster definitions
      'items',        // Item definitions
      'game_state',   // Global game state
      'config',       // Server configuration
      'sessions',     // Active sessions
      'logs'          // Game event logs
    ];

    for (const collection of collections) {
      try {
        await this.read(collection);
        console.log(`📋 Collection '${collection}' verified`);
      } catch (error) {
        // Create empty collection if it doesn't exist
        await this.write(collection, {});
        console.log(`📋 Collection '${collection}' created`);
      }
    }

    // Initialize basic game data
    await this.initializeGameData();
  }

  // Initialize basic game data
  async initializeGameData() {
    // Initialize server config
    const serverConfig = await this.get('config', 'server');
    if (!serverConfig) {
      await this.set('config', 'server', {
        gameVersion: '1.0.0',
        phase: '1A - Replit Setup',
        initialized: new Date().toISOString(),
        maxPlayers: 1000,
        sessionTimeout: 7200000, // 2 hours
        maintenanceMode: false
      });
    }

    // Initialize basic zones
    const zonesExist = await this.list('zones');
    if (zonesExist.length === 0) {
      await this.set('zones', 'starter_town', {
        name: 'Starter Town',
        description: 'A peaceful town where new adventurers begin their journey.',
        level: 1,
        safe: true,
        coordinates: { x: 0, y: 0 },
        connections: [],
        npcs: [],
        monsters: []
      });
    }

    console.log('🎮 Basic game data initialized');
  }

  // Get database statistics
  async getStats() {
    const stats = {
      collections: {},
      totalSize: 0,
      totalItems: 0,
      lastBackup: null
    };

    try {
      const files = await fs.readdir(this.dataDir);
      for (const file of files) {
        if (file.endsWith('.json') && file !== 'backups') {
          const collection = file.replace('.json', '');
          const data = await this.read(collection);
          const itemCount = Object.keys(data).length;
          const fileSize = JSON.stringify(data).length;
          
          stats.collections[collection] = {
            items: itemCount,
            size: fileSize
          };
          stats.totalSize += fileSize;
          stats.totalItems += itemCount;
        }
      }

      // Check for latest backup
      try {
        const backupFiles = await fs.readdir(this.backupDir);
        if (backupFiles.length > 0) {
          const latestBackup = backupFiles.sort().pop();
          const backupStats = await fs.stat(path.join(this.backupDir, latestBackup));
          stats.lastBackup = backupStats.mtime;
        }
      } catch (error) {
        // No backups directory or files
      }

    } catch (error) {
      console.error('Error getting database stats:', error);
    }

    return stats;
  }

  // Cleanup old backups (keep last 10)
  async cleanupBackups() {
    try {
      const backupFiles = await fs.readdir(this.backupDir);
      const sortedBackups = backupFiles.sort();
      
      if (sortedBackups.length > 10) {
        const toDelete = sortedBackups.slice(0, sortedBackups.length - 10);
        for (const file of toDelete) {
          await fs.unlink(path.join(this.backupDir, file));
        }
        console.log(`🧹 Cleaned up ${toDelete.length} old backups`);
      }
    } catch (error) {
      console.error('Error cleaning up backups:', error);
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;