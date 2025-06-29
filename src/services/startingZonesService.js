/**
 * Starting Zones Service
 * Phase 2.5: Manages race-specific starting areas, NPCs, equipment, and quests
 */

const database = require('../database');

class StartingZonesService {
  constructor() {
    this.db = database;
  }

  /**
   * Get starting zone information for a race
   */
  async getStartingZoneForRace(raceId) {
    try {
      const result = await this.db.query(
        `SELECT sz.*, r.name as race_name 
         FROM starting_zones sz
         JOIN races r ON sz.race_id = r.id
         WHERE sz.race_id = $1`,
        [raceId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }

      const zone = result.rows[0];
      
      // Parse JSON fields
      zone.special_features = JSON.parse(zone.special_features || '[]');
      
      return zone;
    } catch (error) {
      console.error('Error getting starting zone for race:', error);
      throw error;
    }
  }

  /**
   * Get all NPCs in a starting zone
   */
  async getNPCsInZone(zoneName) {
    try {
      const result = await this.db.query(
        `SELECT rn.*, r.name as race_name 
         FROM racial_npcs rn
         JOIN races r ON rn.race_id = r.id
         WHERE rn.zone_name = $1
         ORDER BY rn.npc_type, rn.npc_name`,
        [zoneName]
      );
      
      return result.rows.map(npc => {
        npc.services = JSON.parse(npc.services || '[]');
        npc.dialogue_options = JSON.parse(npc.dialogue_options || '{}');
        return npc;
      });
    } catch (error) {
      console.error('Error getting NPCs in zone:', error);
      throw error;
    }
  }

  /**
   * Get racial equipment available at character start
   */
  async getStartingEquipmentForRace(raceId) {
    try {
      const result = await this.db.query(
        `SELECT * FROM racial_equipment 
         WHERE race_id = $1 AND available_at_start = true
         ORDER BY item_type, item_name`,
        [raceId]
      );
      
      return result.rows.map(item => {
        item.stats = JSON.parse(item.stats || '{}');
        return item;
      });
    } catch (error) {
      console.error('Error getting starting equipment for race:', error);
      throw error;
    }
  }

  /**
   * Get racial quests for a starting zone
   */
  async getRacialQuestsForZone(raceId, zoneName) {
    try {
      const result = await this.db.query(
        `SELECT * FROM racial_quests 
         WHERE race_id = $1 AND starting_zone = $2
         ORDER BY order_in_chain, quest_name`,
        [raceId, zoneName]
      );
      
      return result.rows.map(quest => {
        quest.objectives = JSON.parse(quest.objectives || '[]');
        quest.rewards = JSON.parse(quest.rewards || '{}');
        return quest;
      });
    } catch (error) {
      console.error('Error getting racial quests for zone:', error);
      throw error;
    }
  }

  /**
   * Get race relations for diplomatic interactions
   */
  async getRaceRelations(raceId) {
    try {
      const result = await this.db.query(
        `SELECT rr.*, 
                r1.name as race1_name, 
                r2.name as race2_name
         FROM race_relations rr
         JOIN races r1 ON rr.race1_id = r1.id
         JOIN races r2 ON rr.race2_id = r2.id
         WHERE rr.race1_id = $1 OR rr.race2_id = $1
         ORDER BY rr.relation_strength DESC`,
        [raceId]
      );
      
      return result.rows.map(relation => {
        relation.trade_bonuses = JSON.parse(relation.trade_bonuses || '{}');
        return relation;
      });
    } catch (error) {
      console.error('Error getting race relations:', error);
      throw error;
    }
  }

  /**
   * Initialize character with racial starting equipment
   */
  async grantStartingEquipment(characterId, raceId) {
    try {
      const equipment = await this.getStartingEquipmentForRace(raceId);
      
      // This would integrate with an inventory system
      // For now, we'll just log what would be granted
      console.log(`Granting starting equipment to character ${characterId}:`, 
        equipment.map(item => item.item_name));
      
      return equipment;
    } catch (error) {
      console.error('Error granting starting equipment:', error);
      throw error;
    }
  }

  /**
   * Assign racial quests to a new character
   */
  async assignRacialQuests(characterId, raceId, zoneName) {
    try {
      const quests = await this.getRacialQuestsForZone(raceId, zoneName);
      
      for (const quest of quests) {
        await this.db.query(
          `INSERT INTO character_racial_quests (character_id, quest_id, status)
           VALUES ($1, $2, 'available') ON CONFLICT DO NOTHING`,
          [characterId, quest.id]
        );
      }
      
      return quests;
    } catch (error) {
      console.error('Error assigning racial quests:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive starting zone information
   */
  async getCompleteStartingZoneInfo(raceId) {
    try {
      const zone = await this.getStartingZoneForRace(raceId);
      if (!zone) return null;

      const [npcs, equipment, quests, relations] = await Promise.all([
        this.getNPCsInZone(zone.zone_name),
        this.getStartingEquipmentForRace(raceId),
        this.getRacialQuestsForZone(raceId, zone.zone_name),
        this.getRaceRelations(raceId)
      ]);

      return {
        zone,
        npcs,
        equipment,
        quests,
        relations
      };
    } catch (error) {
      console.error('Error getting complete starting zone info:', error);
      throw error;
    }
  }

  /**
   * Interact with an NPC
   */
  async interactWithNPC(npcId, interactionType = 'greeting') {
    try {
      const result = await this.db.query(
        `SELECT * FROM racial_npcs WHERE id = $1`,
        [npcId]
      );
      
      if (result.rows.length === 0) {
        return { error: 'NPC not found' };
      }
      
      const npc = result.rows[0];
      npc.dialogue_options = JSON.parse(npc.dialogue_options || '{}');
      npc.services = JSON.parse(npc.services || '[]');
      
      const dialogue = npc.dialogue_options[interactionType] || 
                     npc.dialogue_options.greeting || 
                     'The NPC looks at you silently.';
      
      return {
        npc: npc,
        dialogue: dialogue,
        services: npc.services
      };
    } catch (error) {
      console.error('Error interacting with NPC:', error);
      throw error;
    }
  }

  /**
   * Get cultural information for immersive descriptions
   */
  async getCulturalContext(zoneName) {
    try {
      const result = await this.db.query(
        `SELECT cultural_flavor, special_features 
         FROM starting_zones 
         WHERE zone_name = $1`,
        [zoneName]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const context = result.rows[0];
      context.special_features = JSON.parse(context.special_features || '[]');
      
      return context;
    } catch (error) {
      console.error('Error getting cultural context:', error);
      throw error;
    }
  }

  /**
   * Calculate relation bonus for trading or interactions
   */
  calculateRelationBonus(relationStrength) {
    if (relationStrength >= 75) return 1.25; // 25% bonus for strong allies
    if (relationStrength >= 50) return 1.15; // 15% bonus for allies
    if (relationStrength >= 25) return 1.05; // 5% bonus for friendly
    if (relationStrength >= 0) return 1.0;   // No bonus for neutral
    if (relationStrength >= -25) return 0.95; // 5% penalty for unfriendly
    if (relationStrength >= -50) return 0.85; // 15% penalty for hostile
    return 0.75; // 25% penalty for very hostile
  }
}

module.exports = new StartingZonesService();