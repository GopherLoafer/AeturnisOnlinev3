/**
 * Admin Race Management Routes
 * Phase 2.6: Comprehensive administrative tools for race management and balance
 */

const express = require('express');
const router = express.Router();
const adminRaceManagementService = require('../services/adminRaceManagementService');
const { requireAdmin } = require('../middleware/auth');

// All routes require admin access
router.use(requireAdmin);

/**
 * Get race statistics dashboard
 */
router.get('/race-statistics', async (req, res) => {
  try {
    const statistics = await adminRaceManagementService.getRaceStatistics();
    const populationData = await adminRaceManagementService.getPopulationMonitoring();
    const recommendations = await adminRaceManagementService.getRaceBalanceRecommendations();

    res.render('admin/race-statistics', {
      title: 'Race Statistics Dashboard',
      statistics,
      populationData,
      recommendations,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading race statistics:', error);
    res.status(500).render('error', { 
      title: 'Error', 
      message: 'Failed to load race statistics dashboard' 
    });
  }
});

/**
 * API: Get race statistics as JSON
 */
router.get('/api/race-statistics', async (req, res) => {
  try {
    const races = await adminRaceManagementService.getRaceStatistics();
    res.json({ races });
  } catch (error) {
    console.error('Error getting race statistics:', error);
    res.status(500).json({ error: 'Failed to get race statistics' });
  }
});

/**
 * API: Get population monitoring data
 */
router.get('/api/population-monitoring', async (req, res) => {
  try {
    const populationData = await adminRaceManagementService.getPopulationMonitoring();
    const raceStats = await adminRaceManagementService.getRaceStatistics();
    
    // Format data for frontend
    const response = {
      totalCharacters: populationData.totalCharacters || 0,
      activePlayers24h: populationData.activePlayers24h || 0,
      newRegistrations: populationData.newRegistrations || 0,
      averageLevel: populationData.averageLevel || 0,
      charactersChange: populationData.charactersChange || 0,
      activeChange: populationData.activeChange || 0,
      registrationsChange: populationData.registrationsChange || 0,
      levelChange: populationData.levelChange || 0,
      retentionRate: populationData.retentionRate || 0,
      avgSessionTime: populationData.avgSessionTime || 0,
      characterRatio: populationData.characterRatio || 0,
      balanceHealth: populationData.balanceHealth || 0,
      raceDistribution: raceStats.map(race => ({
        race_name: race.name,
        count: race.character_count || 0,
        active_24h: race.active_24h || 0,
        avg_level: race.average_level || 0
      })),
      levelDistribution: populationData.levelDistribution || []
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error getting population monitoring:', error);
    res.status(500).json({ error: 'Failed to get population monitoring data' });
  }
});

/**
 * Racial balance adjustment form
 */
router.get('/balance-adjustment', async (req, res) => {
  try {
    const statistics = await adminRaceManagementService.getRaceStatistics();
    const recommendations = await adminRaceManagementService.getRaceBalanceRecommendations();

    res.render('admin/race-balance', {
      title: 'Racial Balance Adjustment',
      statistics,
      recommendations,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading balance adjustment page:', error);
    res.status(500).render('error', { 
      title: 'Error', 
      message: 'Failed to load balance adjustment page' 
    });
  }
});

/**
 * API: Apply racial balance adjustment
 */
router.post('/api/balance-adjustment', async (req, res) => {
  try {
    const { raceId, adjustments, reason } = req.body;

    if (!raceId || !adjustments) {
      return res.status(400).json({ error: 'Race ID and adjustments are required' });
    }

    const result = await adminRaceManagementService.applyRacialBalanceAdjustment(
      raceId, 
      adjustments, 
      req.session.user.id, 
      reason || 'Admin adjustment'
    );

    res.json(result);
  } catch (error) {
    console.error('Error applying balance adjustment:', error);
    res.status(500).json({ error: 'Failed to apply balance adjustment' });
  }
});

/**
 * Race change tools
 */
router.get('/race-change', async (req, res) => {
  try {
    const statistics = await adminRaceManagementService.getRaceStatistics();

    res.render('admin/race-change', {
      title: 'Race Change Tools',
      statistics,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading race change page:', error);
    res.status(500).render('error', { 
      title: 'Error', 
      message: 'Failed to load race change page' 
    });
  }
});

/**
 * API: Change character race
 */
router.post('/api/race-change', async (req, res) => {
  try {
    const { characterId, newRaceId, reason } = req.body;

    if (!characterId || !newRaceId) {
      return res.status(400).json({ error: 'Character ID and new race ID are required' });
    }

    const result = await adminRaceManagementService.changeCharacterRace(
      characterId, 
      newRaceId, 
      req.session.user.id, 
      reason || 'Admin race change'
    );

    res.json(result);
  } catch (error) {
    console.error('Error changing character race:', error);
    res.status(500).json({ error: 'Failed to change character race' });
  }
});

/**
 * Racial events management
 */
router.get('/racial-events', async (req, res) => {
  try {
    const statistics = await adminRaceManagementService.getRaceStatistics();
    const activeEvents = await adminRaceManagementService.getActiveRacialEvents();

    res.render('admin/racial-events', {
      title: 'Racial Events Management',
      statistics,
      activeEvents,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading racial events page:', error);
    res.status(500).render('error', { 
      title: 'Error', 
      message: 'Failed to load racial events page' 
    });
  }
});

/**
 * API: Create racial event
 */
router.post('/api/racial-events', async (req, res) => {
  try {
    const eventData = req.body;

    // Validate required fields
    if (!eventData.name || !eventData.event_type || !eventData.start_time || !eventData.end_time) {
      return res.status(400).json({ error: 'Name, event type, start time, and end time are required' });
    }

    const result = await adminRaceManagementService.createRacialEvent(
      eventData, 
      req.session.user.id
    );

    res.json(result);
  } catch (error) {
    console.error('Error creating racial event:', error);
    res.status(500).json({ error: 'Failed to create racial event' });
  }
});

/**
 * API: Get active racial events
 */
router.get('/api/racial-events', async (req, res) => {
  try {
    const activeEvents = await adminRaceManagementService.getActiveRacialEvents();
    res.json(activeEvents || []);
  } catch (error) {
    console.error('Error getting racial events:', error);
    res.json([]);
  }
});

/**
 * Race-specific rewards management
 */
router.get('/race-rewards', async (req, res) => {
  try {
    const statistics = await adminRaceManagementService.getRaceStatistics();

    res.render('admin/race-rewards', {
      title: 'Race-Specific Rewards',
      statistics,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading race rewards page:', error);
    res.status(500).render('error', { 
      title: 'Error', 
      message: 'Failed to load race rewards page' 
    });
  }
});

/**
 * API: Create race-specific reward
 */
router.post('/api/race-rewards', async (req, res) => {
  try {
    const rewardData = req.body;

    // Validate required fields
    if (!rewardData.race_id || !rewardData.reward_name || !rewardData.reward_type) {
      return res.status(400).json({ error: 'Race ID, reward name, and reward type are required' });
    }

    const result = await adminRaceManagementService.createRaceSpecificReward(
      rewardData, 
      req.session.user.id
    );

    res.json(result);
  } catch (error) {
    console.error('Error creating race-specific reward:', error);
    res.status(500).json({ error: 'Failed to create race-specific reward' });
  }
});

/**
 * API: Get balance recommendations
 */
router.get('/api/balance-recommendations', async (req, res) => {
  try {
    const recommendations = await adminRaceManagementService.getRaceBalanceRecommendations();
    res.json(recommendations || []);
  } catch (error) {
    console.error('Error getting balance recommendations:', error);
    res.json([]);
  }
});

/**
 * Population monitoring dashboard
 */
router.get('/population-monitoring', async (req, res) => {
  try {
    const populationData = await adminRaceManagementService.getPopulationMonitoring();
    const statistics = await adminRaceManagementService.getRaceStatistics();

    res.render('admin/population-monitoring', {
      title: 'Population Monitoring',
      populationData,
      statistics,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading population monitoring page:', error);
    res.status(500).render('error', { 
      title: 'Error', 
      message: 'Failed to load population monitoring page' 
    });
  }
});

/**
 * Debug endpoint to test service functionality
 */
router.get('/api/debug', async (req, res) => {
  try {
    const raceStats = await adminRaceManagementService.getRaceStatistics();
    const populationData = await adminRaceManagementService.getPopulationMonitoring();
    const recommendations = await adminRaceManagementService.getRaceBalanceRecommendations();
    
    res.json({
      debug: true,
      raceStats: raceStats.length,
      populationDataKeys: Object.keys(populationData || {}),
      recommendationsCount: recommendations ? recommendations.length : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      debug: true,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;