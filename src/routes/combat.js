/**
 * Combat Routes
 * Phase 3.1: Turn-Based Combat with Spam Prevention
 */

const express = require('express');
const router = express.Router();
const combatService = require('../services/combatService');
const { requireAuth, requireCharacter } = require('../middleware/auth');

// All combat routes require authentication and character selection
router.use(requireAuth);
router.use(requireCharacter);

/**
 * Get current combat status
 */
router.get('/status', async (req, res) => {
  try {
    const characterId = req.character.id;
    const activeCombat = await combatService.getActiveCombat(characterId);
    
    if (!activeCombat) {
      return res.json({ inCombat: false });
    }

    // Get combat log
    const combatLog = await combatService.getCombatLog(activeCombat.id, 5);

    res.json({
      inCombat: true,
      session: activeCombat,
      combatLog: combatLog.reverse() // Show oldest first
    });
  } catch (error) {
    console.error('Error getting combat status:', error);
    res.status(500).json({ error: 'Failed to get combat status' });
  }
});

/**
 * Start combat with a target
 */
router.post('/start', async (req, res) => {
  try {
    const characterId = req.session.character.id;
    const { targetId, targetType } = req.body;

    if (!targetId || !targetType) {
      return res.status(400).json({ error: 'Target ID and type required' });
    }

    // Check cooldown
    const cooldownCheck = await combatService.checkCooldown(characterId);
    if (!cooldownCheck.canAct) {
      return res.status(429).json({
        error: cooldownCheck.message,
        cooldown: cooldownCheck
      });
    }

    // Start combat
    const session = await combatService.startCombat(characterId, targetId, targetType);

    // Update cooldown
    await combatService.updateCooldown(characterId);

    res.json({
      success: true,
      session,
      message: 'Combat started!'
    });
  } catch (error) {
    console.error('Error starting combat:', error);
    res.status(500).json({ error: error.message || 'Failed to start combat' });
  }
});

/**
 * Perform a combat action
 */
router.post('/action', async (req, res) => {
  try {
    const characterId = req.session.character.id;
    const { sessionId, actionType, actionData = {} } = req.body;

    if (!sessionId || !actionType) {
      return res.status(400).json({ error: 'Session ID and action type required' });
    }

    // Check cooldown
    const cooldownCheck = await combatService.checkCooldown(characterId);
    if (!cooldownCheck.canAct) {
      return res.status(429).json({
        error: cooldownCheck.message,
        cooldown: cooldownCheck,
        remainingTime: cooldownCheck.remainingCooldown || cooldownCheck.remainingLock
      });
    }

    // Perform action
    const result = await combatService.performCombatAction(characterId, sessionId, actionType, actionData);

    // Update cooldown
    const cooldownUpdate = await combatService.updateCooldown(characterId);

    // Get updated combat status
    const activeCombat = await combatService.getActiveCombat(characterId);

    // If combat is still active, trigger monster action
    if (activeCombat && activeCombat.session_status === 'active' && activeCombat.defender_type === 'monster') {
      setTimeout(async () => {
        try {
          await combatService.performMonsterAction(sessionId, activeCombat.monster_id);
        } catch (error) {
          console.error('Error performing monster action:', error);
        }
      }, 1000); // 1 second delay for monster response
    }

    res.json({
      success: true,
      result,
      cooldownUntil: cooldownUpdate.cooldownUntil,
      combatStatus: activeCombat
    });
  } catch (error) {
    console.error('Error performing combat action:', error);
    res.status(500).json({ error: error.message || 'Failed to perform action' });
  }
});

/**
 * Get available monsters in current zone
 */
router.get('/monsters', async (req, res) => {
  try {
    const characterZone = req.character.location_zone;
    
    // Get spawned monsters in the zone
    const result = await req.app.locals.db.query(
      `SELECT ms.*, m.name, m.level, m.description, m.element_type
       FROM monster_spawns ms
       JOIN monsters m ON ms.monster_id = m.id
       WHERE ms.location_zone = $1 AND ms.status = 'alive'
       ORDER BY m.level`,
      [characterZone]
    );

    res.json({
      zone: characterZone,
      monsters: result.rows
    });
  } catch (error) {
    console.error('Error getting monsters:', error);
    res.status(500).json({ error: 'Failed to get monsters' });
  }
});

/**
 * Get cooldown status
 */
router.get('/cooldown', async (req, res) => {
  try {
    const characterId = req.session.character.id;
    const cooldownCheck = await combatService.checkCooldown(characterId);

    res.json({
      canAct: cooldownCheck.canAct,
      cooldown: cooldownCheck,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error checking cooldown:', error);
    res.status(500).json({ error: 'Failed to check cooldown' });
  }
});

module.exports = router;