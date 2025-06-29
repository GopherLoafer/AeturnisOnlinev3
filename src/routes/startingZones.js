/**
 * Starting Zones Routes
 * Phase 2.5: Handles race-specific starting area functionality
 */

const express = require('express');
const router = express.Router();
const startingZonesService = require('../services/startingZonesService');
const db = require('../database');

/**
 * Get starting zone information for current character
 */
router.get('/api/starting-zones/current', async (req, res) => {
  try {
    if (!req.session.characterId) {
      return res.status(401).json({ error: 'No character selected' });
    }

    // Get character's race and zone
    const characterResult = await db.query(`
      SELECT c.*, r.id as race_id, r.name as race_name
      FROM characters c
      JOIN races r ON c.race_id = r.id
      WHERE c.id = $1
    `, [req.session.characterId]);

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const character = characterResult.rows[0];
    const zoneInfo = await startingZonesService.getCompleteStartingZoneInfo(character.race_id);

    res.json({
      character: {
        name: character.name,
        race: character.race_name,
        zone: character.location_zone
      },
      zoneInfo
    });

  } catch (error) {
    console.error('Error getting current starting zone:', error);
    res.status(500).json({ error: 'Failed to get starting zone information' });
  }
});

/**
 * Get NPCs in current zone
 */
router.get('/api/starting-zones/npcs', async (req, res) => {
  try {
    if (!req.session.characterId) {
      return res.status(401).json({ error: 'No character selected' });
    }

    const characterResult = await db.query(`
      SELECT location_zone FROM characters WHERE id = $1
    `, [req.session.characterId]);

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const zoneName = characterResult.rows[0].location_zone;
    const npcs = await startingZonesService.getNPCsInZone(zoneName);

    res.json({ npcs });

  } catch (error) {
    console.error('Error getting zone NPCs:', error);
    res.status(500).json({ error: 'Failed to get NPCs' });
  }
});

/**
 * Interact with an NPC
 */
router.post('/api/starting-zones/interact-npc', async (req, res) => {
  try {
    if (!req.session.characterId) {
      return res.status(401).json({ error: 'No character selected' });
    }

    const { npcId, interactionType = 'greeting' } = req.body;

    if (!npcId) {
      return res.status(400).json({ error: 'NPC ID required' });
    }

    const interaction = await startingZonesService.interactWithNPC(npcId, interactionType);

    res.json(interaction);

  } catch (error) {
    console.error('Error interacting with NPC:', error);
    res.status(500).json({ error: 'Failed to interact with NPC' });
  }
});

/**
 * Get racial quests for character
 */
router.get('/api/starting-zones/racial-quests', async (req, res) => {
  try {
    if (!req.session.characterId) {
      return res.status(401).json({ error: 'No character selected' });
    }

    // Get character's race and assigned racial quests
    const result = await db.query(`
      SELECT rq.*, crq.status, crq.progress, crq.started_at, crq.completed_at
      FROM racial_quests rq
      LEFT JOIN character_racial_quests crq ON rq.id = crq.quest_id AND crq.character_id = $1
      JOIN characters c ON c.race_id = rq.race_id
      WHERE c.id = $1
      ORDER BY rq.order_in_chain, rq.quest_name
    `, [req.session.characterId]);

    const quests = result.rows.map(quest => {
      quest.objectives = JSON.parse(quest.objectives || '[]');
      quest.rewards = JSON.parse(quest.rewards || '{}');
      quest.progress = JSON.parse(quest.progress || '{}');
      return quest;
    });

    res.json({ quests });

  } catch (error) {
    console.error('Error getting racial quests:', error);
    res.status(500).json({ error: 'Failed to get racial quests' });
  }
});

/**
 * Get race relations for diplomatic context
 */
router.get('/api/starting-zones/race-relations', async (req, res) => {
  try {
    if (!req.session.characterId) {
      return res.status(401).json({ error: 'No character selected' });
    }

    const characterResult = await db.query(`
      SELECT race_id FROM characters WHERE id = $1
    `, [req.session.characterId]);

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const raceId = characterResult.rows[0].race_id;
    const relations = await startingZonesService.getRaceRelations(raceId);

    res.json({ relations });

  } catch (error) {
    console.error('Error getting race relations:', error);
    res.status(500).json({ error: 'Failed to get race relations' });
  }
});

/**
 * Get cultural context for zone
 */
router.get('/api/starting-zones/cultural-context', async (req, res) => {
  try {
    if (!req.session.characterId) {
      return res.status(401).json({ error: 'No character selected' });
    }

    const characterResult = await db.query(`
      SELECT location_zone FROM characters WHERE id = $1
    `, [req.session.characterId]);

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const zoneName = characterResult.rows[0].location_zone;
    const context = await startingZonesService.getCulturalContext(zoneName);

    res.json({ context });

  } catch (error) {
    console.error('Error getting cultural context:', error);
    res.status(500).json({ error: 'Failed to get cultural context' });
  }
});

/**
 * Admin route: Get all starting zones
 */
router.get('/api/admin/starting-zones', async (req, res) => {
  try {
    // Check admin privileges
    if (!req.session.user || !req.session.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await db.query(`
      SELECT sz.*, r.name as race_name
      FROM starting_zones sz
      JOIN races r ON sz.race_id = r.id
      ORDER BY r.name
    `);

    const zones = result.rows.map(zone => {
      zone.special_features = JSON.parse(zone.special_features || '[]');
      return zone;
    });

    res.json({ zones });

  } catch (error) {
    console.error('Error getting all starting zones:', error);
    res.status(500).json({ error: 'Failed to get starting zones' });
  }
});

module.exports = router;