
/**
 * Affinity System Service
 * Handles weapon and magic affinity progression with usage-based tracking
 */

const { query } = require('./database');

class AffinityService {
  constructor() {
    // Weapon types with progression rates
    this.weaponTypes = {
      'sword': { baseGain: 0.05, maxAffinity: 100 },
      'axe': { baseGain: 0.05, maxAffinity: 100 },
      'mace': { baseGain: 0.05, maxAffinity: 100 },
      'dagger': { baseGain: 0.06, maxAffinity: 100 },
      'staff': { baseGain: 0.04, maxAffinity: 100 },
      'bow': { baseGain: 0.04, maxAffinity: 100 },
      'unarmed': { baseGain: 0.07, maxAffinity: 100 }
    };

    // Magic schools with progression rates
    this.magicSchools = {
      'fire': { baseGain: 0.03, maxAffinity: 100 },
      'ice': { baseGain: 0.03, maxAffinity: 100 },
      'lightning': { baseGain: 0.03, maxAffinity: 100 },
      'earth': { baseGain: 0.03, maxAffinity: 100 },
      'holy': { baseGain: 0.025, maxAffinity: 100 },
      'dark': { baseGain: 0.025, maxAffinity: 100 },
      'arcane': { baseGain: 0.02, maxAffinity: 100 },
      'nature': { baseGain: 0.035, maxAffinity: 100 }
    };

    // Affinity thresholds for bonuses
    this.thresholds = {
      novice: { min: 0, max: 25, damageBonus: 1.0, specialChance: 0 },
      apprentice: { min: 26, max: 50, damageBonus: 1.1, specialChance: 5 },
      journeyman: { min: 51, max: 75, damageBonus: 1.25, specialChance: 15 },
      expert: { min: 76, max: 99, damageBonus: 1.4, specialChance: 25 },
      master: { min: 100, max: 100, damageBonus: 1.6, specialChance: 40 }
    };
  }

  /**
   * Get character's weapon affinities
   */
  async getWeaponAffinities(characterId) {
    try {
      const result = await query(
        'SELECT weapon_type, affinity_percentage FROM weapon_affinities WHERE character_id = $1',
        [characterId]
      );
      
      const affinities = {};
      for (const weaponType of Object.keys(this.weaponTypes)) {
        const existing = result.rows.find(row => row.weapon_type === weaponType);
        affinities[weaponType] = existing ? parseFloat(existing.affinity_percentage) : 0;
      }
      
      return affinities;
    } catch (error) {
      console.error('Error getting weapon affinities:', error);
      throw error;
    }
  }

  /**
   * Get character's magic affinities
   */
  async getMagicAffinities(characterId) {
    try {
      const result = await query(
        'SELECT magic_school, affinity_percentage FROM magic_affinities WHERE character_id = $1',
        [characterId]
      );
      
      const affinities = {};
      for (const magicSchool of Object.keys(this.magicSchools)) {
        const existing = result.rows.find(row => row.magic_school === magicSchool);
        affinities[magicSchool] = existing ? parseFloat(existing.affinity_percentage) : 0;
      }
      
      return affinities;
    } catch (error) {
      console.error('Error getting magic affinities:', error);
      throw error;
    }
  }

  /**
   * Award weapon affinity for usage
   */
  async awardWeaponAffinity(characterId, weaponType, usageIntensity = 1.0) {
    try {
      if (!this.weaponTypes[weaponType]) {
        throw new Error(`Invalid weapon type: ${weaponType}`);
      }

      // Get character race for bonuses
      const raceResult = await query(
        'SELECT race FROM characters WHERE id = $1',
        [characterId]
      );
      
      if (raceResult.rows.length === 0) {
        throw new Error('Character not found');
      }

      const race = raceResult.rows[0].race;
      
      // Calculate gain with racial bonuses
      let baseGain = this.weaponTypes[weaponType].baseGain * usageIntensity;
      
      // Apply racial bonuses
      if (race === 'dwarf') {
        baseGain *= 1.2; // +20% weapon affinity gain
      }
      
      // Get current affinity
      const currentResult = await query(
        'SELECT affinity_percentage FROM weapon_affinities WHERE character_id = $1 AND weapon_type = $2',
        [characterId, weaponType]
      );

      let currentAffinity = 0;
      if (currentResult.rows.length > 0) {
        currentAffinity = parseFloat(currentResult.rows[0].affinity_percentage);
      }

      // Calculate diminishing returns as affinity increases
      const diminishingFactor = Math.max(0.1, 1 - (currentAffinity / 150));
      const finalGain = baseGain * diminishingFactor;
      
      // Calculate new affinity (capped at 100)
      const newAffinity = Math.min(100, currentAffinity + finalGain);

      // Update or insert affinity
      if (currentResult.rows.length > 0) {
        await query(
          'UPDATE weapon_affinities SET affinity_percentage = $1, last_used = NOW() WHERE character_id = $2 AND weapon_type = $3',
          [newAffinity, characterId, weaponType]
        );
      } else {
        await query(
          'INSERT INTO weapon_affinities (character_id, weapon_type, affinity_percentage, last_used) VALUES ($1, $2, $3, NOW())',
          [characterId, weaponType, newAffinity]
        );
      }

      return {
        weaponType,
        previousAffinity: currentAffinity,
        newAffinity: newAffinity,
        gainAmount: finalGain,
        tier: this.getAffinityTier(newAffinity)
      };

    } catch (error) {
      console.error('Error awarding weapon affinity:', error);
      throw error;
    }
  }

  /**
   * Award magic affinity for spell casting
   */
  async awardMagicAffinity(characterId, magicSchool, spellComplexity = 1.0) {
    try {
      if (!this.magicSchools[magicSchool]) {
        throw new Error(`Invalid magic school: ${magicSchool}`);
      }

      // Get character race for bonuses
      const raceResult = await query(
        'SELECT race FROM characters WHERE id = $1',
        [characterId]
      );
      
      if (raceResult.rows.length === 0) {
        throw new Error('Character not found');
      }

      const race = raceResult.rows[0].race;
      
      // Calculate gain with racial bonuses
      let baseGain = this.magicSchools[magicSchool].baseGain * spellComplexity;
      
      // Apply racial bonuses
      if (race === 'elf') {
        baseGain *= 1.2; // +20% magic affinity gain
      } else if (race === 'dark_elf') {
        if (magicSchool === 'dark') {
          baseGain *= 1.5; // +50% dark magic affinity
        } else {
          baseGain *= 1.1; // +10% other magic
        }
      } else if (race === 'undead' && magicSchool === 'dark') {
        baseGain *= 1.5; // +50% dark magic affinity
      }
      
      // Get current affinity
      const currentResult = await query(
        'SELECT affinity_percentage FROM magic_affinities WHERE character_id = $1 AND magic_school = $2',
        [characterId, magicSchool]
      );

      let currentAffinity = 0;
      if (currentResult.rows.length > 0) {
        currentAffinity = parseFloat(currentResult.rows[0].affinity_percentage);
      }

      // Calculate diminishing returns
      const diminishingFactor = Math.max(0.1, 1 - (currentAffinity / 150));
      const finalGain = baseGain * diminishingFactor;
      
      // Calculate new affinity (capped at 100)
      const newAffinity = Math.min(100, currentAffinity + finalGain);

      // Update or insert affinity
      if (currentResult.rows.length > 0) {
        await query(
          'UPDATE magic_affinities SET affinity_percentage = $1, last_used = NOW() WHERE character_id = $2 AND magic_school = $3',
          [newAffinity, characterId, magicSchool]
        );
      } else {
        await query(
          'INSERT INTO magic_affinities (character_id, magic_school, affinity_percentage, last_used) VALUES ($1, $2, $3, NOW())',
          [characterId, magicSchool, newAffinity]
        );
      }

      return {
        magicSchool,
        previousAffinity: currentAffinity,
        newAffinity: newAffinity,
        gainAmount: finalGain,
        tier: this.getAffinityTier(newAffinity)
      };

    } catch (error) {
      console.error('Error awarding magic affinity:', error);
      throw error;
    }
  }

  /**
   * Get affinity tier and bonuses
   */
  getAffinityTier(affinity) {
    for (const [tierName, tier] of Object.entries(this.thresholds)) {
      if (affinity >= tier.min && affinity <= tier.max) {
        return {
          name: tierName,
          damageBonus: tier.damageBonus,
          specialChance: tier.specialChance,
          tier: tier
        };
      }
    }
    return this.thresholds.novice;
  }

  /**
   * Calculate weapon damage bonus
   */
  calculateWeaponDamageBonus(affinity) {
    const tier = this.getAffinityTier(affinity);
    return tier.damageBonus;
  }

  /**
   * Calculate magic damage bonus and mana cost reduction
   */
  calculateMagicBonuses(affinity) {
    const damageBonus = 1 + (affinity / 100);
    const manaCostReduction = 1 - (affinity / 200); // Up to 50% reduction at 100%
    const tier = this.getAffinityTier(affinity);
    
    return {
      damageBonus,
      manaCostReduction,
      specialChance: tier.specialChance
    };
  }

  /**
   * Get available skills for affinity level
   */
  getAvailableSkills(weaponType, affinity) {
    const skills = [];
    
    if (affinity >= 25) {
      skills.push(`${weaponType}_basic_combo`);
    }
    if (affinity >= 50) {
      skills.push(`${weaponType}_power_attack`);
    }
    if (affinity >= 75) {
      skills.push(`${weaponType}_master_technique`);
    }
    if (affinity >= 100) {
      skills.push(`${weaponType}_legendary_skill`);
    }
    
    return skills;
  }

  /**
   * Prevent affinity decay (could be called periodically)
   */
  async preventAffinityDecay(characterId) {
    try {
      // For now, we'll implement this as a placeholder
      // In a full implementation, this would reduce affinities that haven't been used
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      // Weapons not used in a week lose 0.1% affinity
      await query(
        'UPDATE weapon_affinities SET affinity_percentage = GREATEST(0, affinity_percentage - 0.1) WHERE character_id = $1 AND last_used < $2',
        [characterId, lastWeek]
      );

      // Magic schools not used in a week lose 0.1% affinity
      await query(
        'UPDATE magic_affinities SET affinity_percentage = GREATEST(0, affinity_percentage - 0.1) WHERE character_id = $2 AND last_used < $2',
        [characterId, lastWeek]
      );

    } catch (error) {
      console.error('Error preventing affinity decay:', error);
      throw error;
    }
  }

  /**
   * Get detailed affinity report
   */
  async getDetailedAffinityReport(characterId) {
    try {
      const weaponAffinities = await this.getWeaponAffinities(characterId);
      const magicAffinities = await this.getMagicAffinities(characterId);

      const report = {
        weapons: {},
        magic: {},
        summary: {
          totalWeaponAffinities: Object.keys(weaponAffinities).length,
          totalMagicAffinities: Object.keys(magicAffinities).length,
          highestWeaponAffinity: Math.max(...Object.values(weaponAffinities)),
          highestMagicAffinity: Math.max(...Object.values(magicAffinities))
        }
      };

      // Process weapon affinities
      for (const [weaponType, affinity] of Object.entries(weaponAffinities)) {
        const tier = this.getAffinityTier(affinity);
        const skills = this.getAvailableSkills(weaponType, affinity);
        
        report.weapons[weaponType] = {
          affinity: affinity,
          tier: tier.name,
          damageBonus: tier.damageBonus,
          specialChance: tier.specialChance,
          availableSkills: skills
        };
      }

      // Process magic affinities
      for (const [magicSchool, affinity] of Object.entries(magicAffinities)) {
        const bonuses = this.calculateMagicBonuses(affinity);
        const tier = this.getAffinityTier(affinity);
        
        report.magic[magicSchool] = {
          affinity: affinity,
          tier: tier.name,
          damageBonus: bonuses.damageBonus,
          manaCostReduction: bonuses.manaCostReduction,
          specialChance: bonuses.specialChance
        };
      }

      return report;

    } catch (error) {
      console.error('Error generating affinity report:', error);
      throw error;
    }
  }
}

module.exports = new AffinityService();
