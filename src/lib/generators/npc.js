/**
 * NPC generation module
 * Handles NPC traits and occupation generation
 * Ported from original char-gen-script.js
 */

import Random from '../utils/random';

const NPC = {
  /**
   * Get random NPC traits as given in DMG
   * @param {Object} data - Data with npcs object
   * @returns {Object} NPC traits object
   */
  GetTraits: function (data) {
    const npcs = data.npcs;
    const newNPCTraits = {
      Appearance: Random.Array(npcs.appearances),
    };

    // Select high and low abilities (can't be the same)
    const highTraitNum = Random.Num(npcs.highAbilities.length);
    let lowTraitNum = Random.Num(npcs.lowAbilities.length - 1);

    // Low ability can't be the same as the high ability
    if (lowTraitNum >= highTraitNum) {
      lowTraitNum++;
    }

    newNPCTraits['High Ability'] = npcs.highAbilities[highTraitNum];
    newNPCTraits['Low Ability'] = npcs.lowAbilities[lowTraitNum];

    newNPCTraits.Talent = Random.Array(npcs.talents);
    newNPCTraits.Mannerism = Random.Array(npcs.mannerisms);
    newNPCTraits['Interaction Trait'] = Random.Array(npcs.interactionTraits);

    // Values: ideal + bond (10% chance of double bond)
    const ideal = Random.Array(npcs.ideals);
    let bond;
    const bond1 = Random.Num(10);
    if (bond1 < 9) {
      bond = npcs.bonds[bond1];
    } else {
      // 10% chance: combine two different bonds
      let bond1Index = Random.Num(9);
      let bond2Index = Random.Num(9);
      while (bond2Index === bond1Index) {
        bond2Index = Random.Num(9);
      }
      bond = npcs.bonds[bond1Index] + ', ' + npcs.bonds[bond2Index];
    }
    newNPCTraits.Values = ideal + ', ' + bond;

    newNPCTraits['Flaw or Secret'] = Random.Array(npcs.flawsAndSecrets);

    return newNPCTraits;
  },

  /**
   * Get random occupation with weighted probabilities
   * @param {boolean} allowAdventurer - Allow 1% chance of Adventurer
   * @param {Function} classWeightedFn - Function to get weighted class (for Adventurer)
   * @returns {string} Occupation name
   */
  GetOccupation: function (allowAdventurer = false, classWeightedFn = null) {
    const rand = Random.Num(allowAdventurer ? 100 : 99);

    if (rand < 5) return 'Academic';
    if (rand < 10) return 'Aristocrat';
    if (rand < 25) return 'Artisan or guild member';
    if (rand < 30) return 'Criminal';
    if (rand < 35) return 'Entertainer';
    if (rand < 37) return 'Exile, hermit, or refugee';
    if (rand < 42) return 'Explorer or wanderer';
    if (rand < 54) return 'Farmer or herder';
    if (rand < 59) return 'Hunter or trapper';
    if (rand < 74) return 'Laborer';
    if (rand < 79) return 'Merchant';
    if (rand < 84) return 'Politician or bureaucrat';
    if (rand < 89) return 'Priest';
    if (rand < 94) return 'Sailor';
    if (rand < 99) return 'Soldier';

    // 1% chance: Adventurer (only if allowed)
    const adventurerClass = classWeightedFn ? classWeightedFn() : 'Adventurer';
    return 'Adventurer (' + adventurerClass + ')';
  },
};

export default NPC;
