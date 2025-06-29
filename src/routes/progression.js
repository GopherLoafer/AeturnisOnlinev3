// Progression Routes - API endpoints for infinite level progression
// Phase 2.2 Implementation

const express = require('express');
const LevelService = require('../levelService');
const { requireCharacter } = require('../middleware/auth');

const router = express.Router();
const levelService = new LevelService();

// Award experience (for admin testing and future combat/quest integration)
router.post('/award-experience', requireCharacter, async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Valid experience amount is required' 
            });
        }
        
        // Cap experience awards to prevent overflow (max 100 million per award)
        const MAX_EXPERIENCE_AWARD = 100000000;
        if (amount > MAX_EXPERIENCE_AWARD) {
            return res.status(400).json({ 
                success: false, 
                error: `Experience amount too large. Maximum allowed: ${MAX_EXPERIENCE_AWARD.toLocaleString()}` 
            });
        }

        const results = await levelService.awardExperience(req.session.characterId, parseInt(amount));
        
        res.json({
            success: true,
            ...results
        });
    } catch (error) {
        console.error('Award experience error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to award experience' 
        });
    }
});

// Get character progression information
router.get('/info', requireCharacter, async (req, res) => {
    try {
        const progressInfo = await levelService.getProgressionInfo(req.session.characterId);
        
        res.json({
            success: true,
            progression: progressInfo
        });
    } catch (error) {
        console.error('Progression info error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get progression info' 
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
            leaderboard
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get leaderboard' 
        });
    }
});

// Get milestone rewards for character
router.get('/milestones', requireCharacter, async (req, res) => {
    try {
        const milestones = await levelService.getMilestoneRewards(req.session.characterId);
        
        res.json({
            success: true,
            milestones
        });
    } catch (error) {
        console.error('Milestones error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get milestone rewards' 
        });
    }
});

// Simulate level up for testing (admin only for now)
router.post('/simulate-level-up', requireCharacter, async (req, res) => {
    try {
        // For testing purposes - award enough experience to level up
        const results = await levelService.awardExperience(req.session.characterId, 1000);
        
        res.json({
            success: true,
            message: 'Level up simulated successfully',
            ...results
        });
    } catch (error) {
        console.error('Simulate level up error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to simulate level up' 
        });
    }
});

module.exports = router;