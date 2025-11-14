/**
 * Dark Dawn character sheet generation module
 * Simple random selection from data pools
 */

import Random from '../utils/random';

const DarkDawnGenerate = {
  /**
   * Generate random race
   * @param {Object} races - Races data object
   * @param {Object} current - Current character
   * @param {boolean} locked - Whether race is locked
   * @returns {Object} Race object with name and description
   */
  Race: function (races, current, locked) {
    if (locked && current?.Race) return current.Race;

    const raceNames = Object.keys(races);
    const randomName = Random.Array(raceNames);
    return races[randomName];
  },

  /**
   * Generate random faction
   * @param {Object} factions - Factions data object
   * @param {Object} current - Current character
   * @param {boolean} locked - Whether faction is locked
   * @returns {Object} Faction object with name, description, and abilities
   */
  Faction: function (factions, current, locked) {
    if (locked && current?.Faction) return current.Faction;

    const factionNames = Object.keys(factions);
    const randomName = Random.Array(factionNames);
    return factions[randomName];
  },

  /**
   * Generate random faction ability (filtered by faction)
   * @param {Object} faction - Current faction object
   * @param {Object} current - Current character
   * @param {boolean} locked - Whether faction ability is locked
   * @returns {string} Faction ability name
   */
  FactionAbility: function (faction, current, locked) {
    if (locked && current?.FactionAbility) return current.FactionAbility;

    if (!faction || !faction.abilities || faction.abilities.length === 0) {
      return null;
    }

    return Random.Array(faction.abilities);
  },

  /**
   * Generate random deity
   * @param {Object} deities - Deities data object
   * @param {Object} current - Current character
   * @param {boolean} locked - Whether deity is locked
   * @returns {Object} Deity object with name, domain, and description
   */
  Deity: function (deities, current, locked) {
    if (locked && current?.Deity) return current.Deity;

    const deityNames = Object.keys(deities);
    const randomName = Random.Array(deityNames);
    return deities[randomName];
  },

  /**
   * Generate random class
   * @param {Object} classes - Classes data object
   * @param {Object} current - Current character
   * @param {boolean} locked - Whether class is locked
   * @returns {Object} Class object with name and description
   */
  Class: function (classes, current, locked) {
    if (locked && current?.Class) return current.Class;

    const classNames = Object.keys(classes);
    const randomName = Random.Array(classNames);
    return classes[randomName];
  },

  /**
   * Generate random special ability
   * @param {Object} specialAbilities - Special abilities data object
   * @param {Object} current - Current character
   * @param {boolean} locked - Whether special ability is locked
   * @returns {Object} Special ability object with name and description
   */
  SpecialAbility: function (specialAbilities, current, locked) {
    if (locked && current?.SpecialAbility) return current.SpecialAbility;

    const abilityNames = Object.keys(specialAbilities);
    const randomName = Random.Array(abilityNames);
    return specialAbilities[randomName];
  },

  /**
   * Generate complete Dark Dawn character
   * @param {Object} data - All Dark Dawn data
   * @param {Object} locks - Lock states for each attribute
   * @param {Object} current - Current character state
   * @param {string} name - Character name (optional)
   * @returns {Object} Complete character object
   */
  All: function (data, locks = {}, current = {}, name = '') {
    const character = {};

    // Generate all attributes
    character.Race = this.Race(data.races, current, locks.race);
    character.Faction = this.Faction(data.factions, current, locks.faction);
    character.Class = this.Class(data.classes, current, locks.class);
    character.Deity = this.Deity(data.deities, current, locks.deity);
    character.SpecialAbility = this.SpecialAbility(data.specialAbilities, current, locks.specialAbility);

    // Faction ability depends on faction
    character.FactionAbility = this.FactionAbility(
      character.Faction,
      current,
      locks.factionAbility
    );

    // Name is optional
    if (locks.name && current.Name) {
      character.Name = current.Name;
    } else {
      character.Name = name || '';
    }

    return character;
  },
};

export default DarkDawnGenerate;
