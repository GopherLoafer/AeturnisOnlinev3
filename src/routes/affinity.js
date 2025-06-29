
/**
 * Affinity System Routes
 * Handles affinity progression, viewing, and training
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const affinityService = require('../affinityService');

// Get character affinities
router.get('/character/:characterId', requireAuth, async (req, res) => {
  try {
    const { characterId } = req.params;
    
    // Verify character ownership
    const { query } = require('../database');
    const characterCheck = await query(
      'SELECT user_id FROM characters WHERE id = $1',
      [characterId]
    );
    
    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    
    if (characterCheck.rows[0].user_id !== req.session.userId) {
      return res.status(403).json({ success: false, error: 'Not your character' });
    }

    const weaponAffinities = await affinityService.getWeaponAffinities(characterId);
    const magicAffinities = await affinityService.getMagicAffinities(characterId);

    res.json({
      success: true,
      data: {
        weapons: weaponAffinities,
        magic: magicAffinities
      }
    });

  } catch (error) {
    console.error('Error getting character affinities:', error);
    res.status(500).json({ success: false, error: 'Failed to get affinities' });
  }
});

// Get detailed affinity report
router.get('/report/:characterId', requireAuth, async (req, res) => {
  try {
    const { characterId } = req.params;
    
    // Verify character ownership
    const { query } = require('../database');
    const characterCheck = await query(
      'SELECT user_id FROM characters WHERE id = $1',
      [characterId]
    );
    
    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    
    if (characterCheck.rows[0].user_id !== req.session.userId) {
      return res.status(403).json({ success: false, error: 'Not your character' });
    }

    const report = await affinityService.getDetailedAffinityReport(characterId);

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error getting affinity report:', error);
    res.status(500).json({ success: false, error: 'Failed to get affinity report' });
  }
});

// Train weapon affinity
router.post('/train/weapon', requireAuth, async (req, res) => {
  try {
    const { characterId, weaponType, intensity = 1.0 } = req.body;
    
    // Verify character ownership
    const { query } = require('../database');
    const characterCheck = await query(
      'SELECT user_id FROM characters WHERE id = $1',
      [characterId]
    );
    
    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    
    if (characterCheck.rows[0].user_id !== req.session.userId) {
      return res.status(403).json({ success: false, error: 'Not your character' });
    }

    const result = await affinityService.awardWeaponAffinity(characterId, weaponType, intensity);

    res.json({
      success: true,
      data: result,
      message: `${weaponType} affinity increased by ${result.gainAmount.toFixed(3)}%!`
    });

  } catch (error) {
    console.error('Error training weapon affinity:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to train weapon affinity' });
  }
});

// Train magic affinity
router.post('/train/magic', requireAuth, async (req, res) => {
  try {
    const { characterId, magicSchool, complexity = 1.0 } = req.body;
    
    // Verify character ownership
    const { query } = require('../database');
    const characterCheck = await query(
      'SELECT user_id FROM characters WHERE id = $1',
      [characterId]
    );
    
    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    
    if (characterCheck.rows[0].user_id !== req.session.userId) {
      return res.status(403).json({ success: false, error: 'Not your character' });
    }

    const result = await affinityService.awardMagicAffinity(characterId, magicSchool, complexity);

    res.json({
      success: true,
      data: result,
      message: `${magicSchool} magic affinity increased by ${result.gainAmount.toFixed(3)}%!`
    });

  } catch (error) {
    console.error('Error training magic affinity:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to train magic affinity' });
  }
});

// Get available skills for affinity level
router.get('/skills/:characterId/:weaponType', requireAuth, async (req, res) => {
  try {
    const { characterId, weaponType } = req.params;
    
    // Verify character ownership
    const { query } = require('../database');
    const characterCheck = await query(
      'SELECT user_id FROM characters WHERE id = $1',
      [characterId]
    );
    
    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    
    if (characterCheck.rows[0].user_id !== req.session.userId) {
      return res.status(403).json({ success: false, error: 'Not your character' });
    }

    const weaponAffinities = await affinityService.getWeaponAffinities(characterId);
    const affinity = weaponAffinities[weaponType] || 0;
    const skills = affinityService.getAvailableSkills(weaponType, affinity);

    res.json({
      success: true,
      data: {
        weaponType,
        affinity,
        availableSkills: skills
      }
    });

  } catch (error) {
    console.error('Error getting available skills:', error);
    res.status(500).json({ success: false, error: 'Failed to get available skills' });
  }
});

module.exports = router;
