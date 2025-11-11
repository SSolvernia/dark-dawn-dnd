/**
 * Character generation module
 * Main functions for generating character components
 * Ported from original char-gen-script.js
 */

import Random from '../utils/random';
import Content from './content';
import Names from './names';
import NPC from './npc';
import Life from './life';

/**
 * Determine race based on weighted probabilities
 * @param {Object} races - Races data
 * @param {Object} other - Other data with raceWeights
 * @param {Array} usedBooks - List of used books
 * @param {number} pow - Power to apply to weights (1, 1.5, or 2)
 * @returns {string} Race name
 */
function getRaceWeighted(races, other, usedBooks, pow = 1) {
  let raceWeightList = {},
    totalWeight = 0;

  // Add weighted races
  for (let raceName in other.raceWeights) {
    let weight = Math.pow(other.raceWeights[raceName], pow);
    raceWeightList[raceName] = weight;
    totalWeight += weight;
  }

  // Add unweighted races from non-PHB books
  for (let raceName in races) {
    let race = races[raceName];
    if (race._special.includes('PHB') || !checkBookSpecial(race._special, usedBooks)) continue;
    raceWeightList[raceName] = 1;
    totalWeight += 1;
  }

  // Pick random race based on weights
  let rand = Random.Num(totalWeight);
  for (let race in raceWeightList) {
    rand -= raceWeightList[race];
    if (rand <= 0) return race;
  }
}

/**
 * Check if special string includes any used book
 * @param {string} specialString - Special string
 * @param {Array} usedBooks - Used books array
 * @returns {boolean} True if book is available
 */
function checkBookSpecial(specialString, usedBooks) {
  let splitSpecial = specialString.split(' ');
  for (let specialIndex = 0; specialIndex < splitSpecial.length; specialIndex++) {
    if (splitSpecial[specialIndex].slice(0, 5) == 'book-')
      return checkBookString(splitSpecial[specialIndex].slice(5), usedBooks);
  }
  return false;
}

/**
 * Check if book string matches any used book
 * @param {string} bookString - Book identifier(s)
 * @param {Array} usedBooks - Used books array
 * @returns {boolean} True if book is available
 */
function checkBookString(bookString, usedBooks) {
  for (let index = 0; index < usedBooks.length; index++) {
    if (bookString.includes(usedBooks[index])) return true;
  }
  return false;
}

const Generate = {
  /**
   * Generate race
   * @param {Object} context - Context with data, locks, options
   * @returns {Object} Race object
   */
  Race: function (context) {
    const { data, locks, raceMode, raceMenuValue, ethnicityOption } = context;

    if (locks.race) return context.character.Race;

    // Set ethnicity option in context
    context.ethnicityOption = ethnicityOption;

    // Determine race selection
    let raceSelection;
    if (raceMenuValue && raceMenuValue !== 'Random') {
      raceSelection = raceMenuValue;
    } else {
      // Apply race mode
      if (raceMode === 'weighted') {
        raceSelection = getRaceWeighted(data.races, data.other, context.usedBooks, 1);
      } else if (raceMode === 'weighted15') {
        raceSelection = getRaceWeighted(data.races, data.other, context.usedBooks, 1.5);
      } else if (raceMode === 'weighted20') {
        raceSelection = getRaceWeighted(data.races, data.other, context.usedBooks, 2);
      } else {
        raceSelection = 'Random';
      }
    }

    return Content.GetRandom(data.races, raceSelection, context);
  },

  /**
   * Generate gender
   * @param {Object} context - Context with data, locks, genderMenuValue
   * @returns {string} Gender
   */
  Gender: function (context) {
    const { data, locks, genderMenuValue } = context;

    if (locks.gender) return context.character.Gender;

    return genderMenuValue === 'Random'
      ? Random.Array(data.other.genders)
      : genderMenuValue;
  },

  /**
   * Generate name
   * @param {Object} context - Context with character, nameInputValue
   * @returns {Object} Name object with Name and ShortName
   */
  Name: function (context) {
    const { character, nameInputValue, locks } = context;

    if (locks.name) return { Name: character.Name, ShortName: character.ShortName };

    if (nameInputValue && nameInputValue.trim().length > 0) {
      return {
        Name: nameInputValue.trim(),
        ShortName: nameInputValue.trim(),
      };
    }

    const name = Names.Get(character.Race.name, character.Gender, context);
    return {
      Name: name,
      ShortName: Names.Shortened({ ...character, Name: name }),
    };
  },

  /**
   * Generate class
   * @param {Object} context - Context with data, locks, classMenuValue
   * @returns {Object} Class object
   */
  Class: function (context) {
    const { data, locks, classMenuValue } = context;

    if (locks.class) return context.character.Class;

    return Content.GetRandom(data.classes, classMenuValue || 'Random', context);
  },

  /**
   * Generate background
   * @param {Object} context - Context with data, locks, backgroundMenuValue
   * @returns {Object} Background object
   */
  Background: function (context) {
    const { data, locks, backgroundMenuValue } = context;

    if (locks.background) return context.character.Background;

    return Content.GetRandom(data.backgrounds, backgroundMenuValue || 'Random', context);
  },

  /**
   * Generate all character components
   * @param {Object} context - Context with all data and options
   * @returns {Object} Complete character object
   */
  All: function (context) {
    const character = {};

    // Generate in order
    character.Race = this.Race(context);
    context.character = character;

    character.Gender = this.Gender(context);
    const nameObj = this.Name(context);
    character.Name = nameObj.Name;
    character.ShortName = nameObj.ShortName;

    character.Class = this.Class(context);
    character.Background = this.Background(context);

    // Generate NPC traits, occupation, and Life events
    character.Occupation = NPC.GetOccupation(false);
    character.NPCTraits = NPC.GetTraits(context.data);
    character.Life = Life.Get(context);

    return character;
  },
};

export default Generate;
