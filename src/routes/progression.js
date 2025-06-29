
// Progression Routes - API endpoints for infinite level progression and affinity system
// Phase 2.3 Implementation

const express = require('express');
const LevelService = require('../levelService');
const { requireCharacter } = require('../middleware/auth');

const router = express.Router();
const levelService = new LevelService();

// Award experience with enhanced error handling
router.post('/award-experience', requireCharacter, async (req, res) => {
    try {
        const { amount } = req.body;
        const characterId = req.session.characterId;

        // Validate experience amount
        const expAmount = parseInt(amount);
        if (isNaN(expAmount) || expAmount <= 0 || expAmount > 100000) {
            return res.status(400).json({
                success: false,
                error: 'Invalid experience amount. Must be between 1 and 100,000.'
            });
        }

        const result = await levelService.awardExperience(characterId, expAmount);
        
        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error awarding experience:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to award experience',
            details: error.message
        });
    }
});

// Get progression information
router.get('/info', requireCharacter, async (req, res) => {
    try {
        const characterId = req.session.characterId;
        const progressInfo = await levelService.getProgressionInfo(characterId);
        
        res.json({
            success: true,
            data: progressInfo
        });

    } catch (error) {
        console.error('Error getting progression info:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get progression information'
        });
    }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const leaderboard = await levelService.getLeaderboard(limit);
        
        res.json({
            success: true,
            data: leaderboard
        });

    } catch (error) {
        console.error('Error getting leaderboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get leaderboard'
        });
    }
});

// Get milestone rewards
router.get('/milestones', requireCharacter, async (req, res) => {
    try {
        const characterId = req.session.characterId;
        const milestones = await levelService.getMilestoneRewards(characterId);
        
        res.json({
            success: true,
            data: milestones
        });

    } catch (error) {
        console.error('Error getting milestones:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get milestone rewards'
        });
    }
});

// Phase 2.3: Award affinity experience
router.post('/award-affinity', requireCharacter, async (req, res) => {
    try {
        const { affinityType, category, amount = 1 } = req.body;
        const characterId = req.session.characterId;

        // Validate affinity parameters
        if (!affinityType || !category) {
            return res.status(400).json({
                success: false,
                error: 'Affinity type and category are required'
            });
        }

        if (!['weapons', 'magic'].includes(category)) {
            return res.status(400).json({
                success: false,
                error: 'Category must be "weapons" or "magic"'
            });
        }

        const result = await levelService.awardAffinityExperience(characterId, affinityType, category, amount);
        
        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error awarding affinity experience:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to award affinity experience'
        });
    }
});

// Phase 2.3: Get character affinities
router.get('/affinities', requireCharacter, async (req, res) => {
    try {
        const characterId = req.session.characterId;
        const affinities = await levelService.getCharacterAffinities(characterId);
        
        res.json({
            success: true,
            data: affinities
        });

    } catch (error) {
        console.error('Error getting affinities:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get character affinities'
        });
    }
});

// Phase 2.3: Get affinity system information
router.get('/affinity-info', (req, res) => {
    try {
        const affinityInfo = levelService.progression.affinitySystem;
        
        res.json({
            success: true,
            data: {
                weapons: Object.keys(affinityInfo.weapons),
                magic: Object.keys(affinityInfo.magic),
                bonusThresholds: affinityInfo.bonusThresholds,
                description: 'Affinity system tracks mastery in weapons and magic schools'
            }
        });

    } catch (error) {
        console.error('Error getting affinity info:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get affinity information'
        });
    }
});

module.exports = router;
