const fs = require('fs').promises;
const path = require('path');

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

  // Get data file path
  getFilePath(collection) {
    return path.join(this.dataDir, `${collection}.json`);
  }

  // Read data from collection
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

  // Write data to collection
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
    data[key] = value;
    await this.write(collection, data);
    return value;
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
        if (value[field] !== searchValue) {
          matches = false;
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

  // Initialize default collections
  async initializeCollections() {
    const collections = [
      'users',
      'characters', 
      'game_state',
      'config'
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
  }

  // Get database statistics
  async getStats() {
    const stats = {
      collections: {},
      totalSize: 0,
      lastBackup: null
    };

    try {
      const files = await fs.readdir(this.dataDir);
      for (const file of files) {
        if (file.endsWith('.json') && file !== 'backups') {
          const collection = file.replace('.json', '');
          const data = await this.read(collection);
          const itemCount = Object.keys(data).length;
          
          stats.collections[collection] = {
            items: itemCount,
            size: JSON.stringify(data).length
          };
          stats.totalSize += stats.collections[collection].size;
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
}

// Create singleton instance
const database = new Database();

module.exports = database;