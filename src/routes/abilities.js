const express = require('express');
const db = require('../database');
const { requireCharacter } = require('../middleware/auth');

const router = express.Router();

// Get character's available race abilities
router.get('/race-abilities/:characterId', requireCharacter, async (req, res) => {
  try {
    const characterId = req.character.id;
    
    // Get race abilities for this character's race
    const abilities = await db.query(`
      SELECT ra.*, 
             CASE WHEN cac.cooldown_expires > NOW() 
                  THEN EXTRACT(EPOCH FROM (cac.cooldown_expires - NOW()))::INTEGER 
                  ELSE 0 END as cooldown_remaining
      FROM race_abilities ra
      JOIN characters c ON c.race_id = ra.race_id
      LEFT JOIN character_ability_cooldowns cac ON cac.character_id = c.id AND cac.ability_name = ra.ability_name
      WHERE c.id = $1
      ORDER BY ra.ability_type, ra.ability_name
    `, [characterId]);

    res.json({
      success: true,
      abilities: abilities.rows
    });
  } catch (error) {
    console.error('Race abilities fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch abilities' });
  }
});

// Use a race ability
router.post('/use-ability', requireCharacter, async (req, res) => {
  const { abilityName } = req.body;
  const characterId = req.character.id;

  try {
    // Get ability details
    const abilityResult = await db.query(`
      SELECT ra.*
      FROM race_abilities ra
      JOIN characters c ON c.race_id = ra.race_id
      WHERE c.id = $1 AND ra.ability_name = $2 AND ra.ability_type = 'active'
    `, [characterId, abilityName]);

    if (abilityResult.rows.length === 0) {
      return res.json({ success: false, error: 'Ability not found or not usable' });
    }

    const ability = abilityResult.rows[0];

    // Check if ability is on cooldown
    const cooldownResult = await db.query(`
      SELECT cooldown_expires FROM character_ability_cooldowns 
      WHERE character_id = $1 AND ability_name = $2 AND cooldown_expires > NOW()
    `, [characterId, abilityName]);

    if (cooldownResult.rows.length > 0) {
      const remaining = Math.ceil((new Date(cooldownResult.rows[0].cooldown_expires) - new Date()) / 1000);
      return res.json({ 
        success: false, 
        error: `Ability on cooldown for ${remaining} seconds` 
      });
    }

    // Check mana cost
    if (ability.mana_cost > 0) {
      const characterResult = await db.query('SELECT mana_current FROM characters WHERE id = $1', [characterId]);
      const currentMana = characterResult.rows[0].mana_current;
      
      if (currentMana < ability.mana_cost) {
        return res.json({ success: false, error: 'Not enough mana' });
      }
    }

    // Execute ability effect
    const effectResult = await executeAbilityEffect(characterId, ability);
    
    // Set cooldown
    if (ability.cooldown_seconds > 0) {
      const cooldownExpires = new Date(Date.now() + (ability.cooldown_seconds * 1000));
      await db.query(`
        INSERT INTO character_ability_cooldowns (character_id, ability_name, cooldown_expires)
        VALUES ($1, $2, $3)
        ON CONFLICT (character_id, ability_name)
        DO UPDATE SET cooldown_expires = EXCLUDED.cooldown_expires
      `, [characterId, abilityName, cooldownExpires]);
    }

    // Deduct mana cost
    if (ability.mana_cost > 0) {
      await db.query(
        'UPDATE characters SET mana_current = mana_current - $1 WHERE id = $2',
        [ability.mana_cost, characterId]
      );
    }

    res.json({
      success: true,
      message: effectResult.message,
      effects: effectResult.effects,
      cooldown: ability.cooldown_seconds
    });

  } catch (error) {
    console.error('Ability use error:', error);
    res.status(500).json({ success: false, error: 'Failed to use ability' });
  }
});

// Execute ability effects based on ability type and data
async function executeAbilityEffect(characterId, ability) {
  const effectData = ability.effect_data;
  let message = `You use ${ability.ability_name.replace('_', ' ')}!`;
  let effects = [];

  try {
    switch (ability.ability_name) {
      case 'berserker_rage':
        // Orc rage - temporary damage bonus
        message = 'You enter a berserker rage! Your damage increases but your defense weakens.';
        effects.push({
          type: 'temporary_buff',
          stat: 'damage_multiplier',
          value: effectData.damage_bonus,
          duration: effectData.duration
        });
        effects.push({
          type: 'temporary_debuff',
          stat: 'defense_multiplier',
          value: -effectData.defense_penalty,
          duration: effectData.duration
        });
        break;

      case 'shadow_strike':
        // Dark Elf critical chance bonus
        message = 'You blend with the shadows, preparing a devastating strike.';
        effects.push({
          type: 'next_attack_bonus',
          stat: 'critical_chance',
          value: effectData.critical_bonus
        });
        break;

      case 'dragon_breath':
        // Dragonborn breath weapon - area damage
        message = 'You breathe draconic energy, dealing massive area damage!';
        effects.push({
          type: 'area_damage',
          damage_multiplier: effectData.damage_multiplier,
          area_effect: effectData.area_effect
        });
        break;

      case 'life_drain':
        // Undead life drain
        message = 'You drain life force from your enemies!';
        const healAmount = Math.floor(req.character.health_max * effectData.drain_percentage);
        await db.query(
          'UPDATE characters SET health_current = LEAST(health_max, health_current + $1) WHERE id = $2',
          [healAmount, characterId]
        );
        effects.push({
          type: 'heal',
          amount: healAmount
        });
        break;

      default:
        message = `You attempt to use ${ability.ability_name.replace('_', ' ')}, but nothing happens.`;
    }

    return { message, effects };
  } catch (error) {
    console.error('Ability effect execution error:', error);
    return { 
      message: 'The ability fizzles and fails to activate.', 
      effects: [] 
    };
  }
}

module.exports = router;