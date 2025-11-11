/**
 * Life Events generation module
 * Handles alignment, origin, siblings, life events, and trinkets
 * Ported from original char-gen-script.js
 */

import Random from '../utils/random';
import Names from './names';
import NPC from './npc';

/**
 * Get weighted random race name
 * @param {Object} races - Races data
 * @param {Object} other - Other data with raceWeights
 * @param {Array} usedBooks - List of used books
 * @param {number} pow - Power to apply to weights
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
    if (race._special.includes('PHB') || !checkBookSpecial(race._special, usedBooks))
      continue;
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

const Life = {
  /**
   * Generate complete life events and origin
   * @param {Object} context - Context with data, character, usedBooks
   * @returns {Object} Life object
   */
  Get: function (context) {
    const { data, character } = context;
    const life = data.life;

    let newLife = {};
    newLife.Alignment = this.Alignment();
    newLife.Origin = {};

    // Birthplace (or "Built" for Warforged)
    if (character.Race.name === 'Warforged') {
      newLife.Origin.Built = Random.Array(life.origins.Birthplace);
    } else {
      newLife.Origin.Birthplace = Random.Array(life.origins.Birthplace);
    }

    // Parents (race-specific)
    const parents = life.origins.Parents[character.Race.name];
    if (parents !== undefined) {
      newLife.Origin.Parents = Random.Array(parents);
    }

    // Raised by
    const raisedBy = this.RaisedBy();
    newLife.Origin['Raised By'] = raisedBy;
    if (raisedBy !== 'Mother and father') {
      newLife.Origin['Absent Parent(s)'] = this.AbsentParent();
    }

    // Lifestyle and home
    const lifestyle = this.Lifestyle();
    newLife.Origin['Family Lifestyle'] = lifestyle[0];
    newLife.Origin['Childhood Home'] = this.Home(lifestyle[1]);
    newLife.Origin['Childhood Memories'] = this.Memories();

    // Siblings
    newLife.Origin.Siblings = this.Siblings(newLife.Origin.Parents, context);

    // Life events
    newLife['Life Events'] = this.LifeEvents(context);

    // Trinket
    newLife.Trinket = Random.Array(life.trinkets);

    return newLife;
  },

  /**
   * Generate 3-5 unique life events
   * @param {Object} context - Context with data, character, usedBooks
   * @returns {Object} Life events object
   */
  LifeEvents: function (context) {
    const { data, character, usedBooks } = context;
    const life = data.life;
    const lifeEvents = {};
    const numEvents = 3 + Random.Num(3); // 3-5 events

    for (let eventNum = 0; eventNum < numEvents; eventNum++) {
      let newEventType = '';

      // Keep rolling until we get a unique event type
      do {
        const randomEventNum = Random.Num(100);
        if (randomEventNum === 99) {
          newEventType = 'Weird Stuff';
        } else {
          newEventType = life.eventTables['Life Events'][Math.floor(randomEventNum / 5)];
        }
      } while (lifeEvents.hasOwnProperty(newEventType));

      let newEvent = '';

      // Generate event based on type
      switch (newEventType) {
        case 'Marriage':
          let spouseRace;
          if (Random.Num(3) < 2) {
            // 67% chance: same race
            spouseRace = character.Race.name;
          } else {
            // 33% chance: different race
            spouseRace = getRaceWeighted(data.races, data.other, usedBooks);
          }
          newEvent =
            'You fell in love or got married to a(n) ' +
            spouseRace.toLowerCase() +
            ' ' +
            NPC.GetOccupation(true, () => this.ClassWeighted(usedBooks)).toLowerCase() +
            '.';
          break;

        case 'Friend':
          newEvent =
            'You made a friend of a(n) ' +
            getRaceWeighted(data.races, data.other, usedBooks).toLowerCase() +
            ' ' +
            this.ClassWeighted(usedBooks).toLowerCase() +
            '.';
          break;

        case 'Enemy':
          newEvent =
            'You made an enemy of a(n) ' +
            getRaceWeighted(data.races, data.other, usedBooks).toLowerCase() +
            ' ' +
            this.ClassWeighted(usedBooks).toLowerCase() +
            '. Roll a d6. An odd number indicates you are to blame for the rift, and an even number indicates you are blameless.';
          break;

        case 'Job':
          newEvent =
            'You spent time working in a job related to your background. Start the game with an extra 2d6 gp.';
          break;

        case 'Someone Important':
          newEvent =
            'You met an important ' +
            getRaceWeighted(data.races, data.other, usedBooks).toLowerCase() +
            ', who is ' +
            this.Relationship().toLowerCase() +
            ' towards you.';
          break;

        case 'Adventure':
          const rand = Random.Num(100);
          newEvent =
            rand === 99
              ? life.eventTables.Adventure[10]
              : life.eventTables.Adventure[Math.floor(rand / 10)];
          break;

        case 'Crime':
          newEvent =
            Random.Array(life.eventTables.Crime) +
            '. ' +
            Random.Array(life.eventTables.Punishment);
          break;

        default:
          newEvent = Random.Array(life.eventTables[newEventType]);
          break;
      }

      lifeEvents[newEventType] = newEvent;
    }

    return lifeEvents;
  },

  /**
   * Determine siblings (0-2)
   * @param {string} parents - Parents description
   * @param {Object} context - Context with data, character, usedBooks
   * @returns {Object|null} Siblings object or null
   */
  Siblings: function (parents, context) {
    const { data, character } = context;
    const numSiblings = Random.Num(3); // 0, 1, or 2
    if (numSiblings === 0) return null;

    const siblings = {};

    for (let sibNum = 0; sibNum < numSiblings; sibNum++) {
      const newSib = {};
      const race = this.SiblingRace(parents, character);

      if (race !== 'Warforged') {
        newSib.Gender = Random.Array(data.other.genders);
      }

      newSib.Race = race;

      // Generate unique name (not same as character's name)
      let newSibName = this.SiblingName(newSib, character, context);
      while (newSibName === character.Name.substring(0, newSibName.length)) {
        newSibName = this.SiblingName(newSib, character, context);
      }

      newSib.Alignment = this.Alignment();
      newSib.Occupation = NPC.GetOccupation(true, () => this.ClassWeighted(context.usedBooks));
      newSib.Status = this.Status();
      newSib.Relationship = this.Relationship();

      // Birth order
      const birthOrderRoll = Random.DiceRoll('2d6');
      let birthOrder;
      if (race === 'Warforged') {
        birthOrder =
          birthOrderRoll < 3 ? 'Simultaneous' : birthOrderRoll < 8 ? 'Older' : 'Younger';
        newSib['Order of Construction'] = birthOrder;
      } else {
        birthOrder =
          birthOrderRoll < 3
            ? 'Twin, triplet, or quadruplet'
            : birthOrderRoll < 8
            ? 'Older'
            : 'Younger';
        newSib['Birth Order'] = birthOrder;
      }

      siblings[newSibName] = newSib;
    }

    return siblings;
  },

  /**
   * Determine sibling's race (handles mixed-race heritage)
   * @param {string} parents - Parents description
   * @param {Object} character - Character object
   * @returns {string} Race name
   */
  SiblingRace: function (parents, character) {
    switch (character.Race.name) {
      case 'Half-Elf':
        if (parents === 'One parent was an elf and the other was a half-elf.') {
          return Random.Array(['Elf', 'Half-Elf']);
        }
        if (parents === 'One parent was a human and the other was a half-elf.') {
          return Random.Array(['Human', 'Half-Elf']);
        }
        return 'Half-Elf';

      case 'Half-Orc':
        if (parents === 'One parent was an orc and the other was a half-orc.') {
          return Random.Array(['Orc', 'Half-Orc']);
        }
        if (parents === 'One parent was an human and the other was a half-orc.') {
          return Random.Array(['Human', 'Half-Orc']);
        }
        return 'Half-Orc';

      case 'Tiefling':
        if (
          parents ===
          'Both parents were humans, their infernal heritage dormant until you came along.'
        ) {
          return Random.Array(['Human', 'Human', 'Human', 'Tiefling']);
        }
        if (parents === 'One parent was a tiefling and the other was a human.') {
          return Random.Array(['Human', 'Tiefling']);
        }
        return 'Tiefling';

      case 'Genasi':
        if (parents === 'One parent was a genasi and the other was a human.') {
          return Random.Array(['Human', 'Genasi']);
        }
        if (
          parents ===
          'Both parents were humans, their elemental heritage dormant until you came along.'
        ) {
          return Random.Array(['Human', 'Human', 'Human', 'Genasi']);
        }
        return 'Genasi';

      case 'Aasimar':
        if (
          parents ===
          'Both parents were humans, their celestial heritage dormant until you came along.'
        ) {
          return 'Human';
        }
        return Random.Array(['Human', 'Aasimar']);

      default:
        return character.Race.name;
    }
  },

  /**
   * Get sibling's name (shortened version)
   * @param {Object} sibling - Sibling object with Race and Gender
   * @param {Object} character - Character object
   * @param {Object} context - Context object
   * @returns {string} Sibling name
   */
  SiblingName: function (sibling, character, context) {
    const { data } = context;
    const names = data.names;
    const siblingRace = sibling.Race;

    let name;

    // Special case: Tabaxi only use first name
    if (siblingRace === 'Tabaxi') {
      return Random.Array(names.Tabaxi.Name);
    }

    // Human siblings of non-human characters use human ethnicity
    if (siblingRace === 'Human' && character.Race.name !== 'Human') {
      name = Names.GetHuman(
        context.mcEthnicity || Names.GetHumanEthnicity(context),
        sibling.Gender,
        context
      );
    } else {
      name = Names.Get(sibling.Race, sibling.Gender, context);
    }

    // Remove last name (everything after last space)
    const lastSpace = name.lastIndexOf(' ');
    return lastSpace < 0 ? name : name.substring(0, lastSpace);
  },

  /**
   * Random alignment with weighted distribution
   * @returns {string} Alignment
   */
  Alignment: function () {
    const roll = Random.DiceRoll('3d6');
    if (roll < 4) return Random.Array(['Chaotic Evil', 'Chaotic Neutral']);
    if (roll < 6) return 'Lawful Evil';
    if (roll < 9) return 'Neutral Evil';
    if (roll < 13) return 'Neutral';
    if (roll < 16) return 'Neutral Good';
    if (roll < 17) return 'Lawful Good';
    if (roll < 18) return 'Lawful Neutral';
    return Random.Array(['Chaotic Good', 'Chaotic Neutral']);
  },

  /**
   * Random class with weighted distribution
   * @param {Array} usedBooks - List of used books
   * @returns {string} Class name
   */
  ClassWeighted: function (usedBooks) {
    const rand = Random.Num(115);
    if (rand < 7) return 'Barbarian';
    if (rand < 14) return 'Bard';
    if (rand < 29) return 'Cleric';
    if (rand < 36) return 'Druid';
    if (rand < 52) return 'Fighter';
    if (rand < 58) return 'Monk';
    if (rand < 64) return 'Paladin';
    if (rand < 70) return 'Ranger';
    if (rand < 84) return 'Rogue';
    if (rand < 89) return 'Sorcerer';
    if (rand < 94) return 'Warlock';
    if (rand < 100) return 'Wizard';
    if (rand < 105) return usedBooks.includes('EBR') ? 'Artificer' : this.ClassWeighted(usedBooks);
    if (rand < 110)
      return usedBooks.includes('Other') ? 'Blood Hunter' : this.ClassWeighted(usedBooks);
    return usedBooks.includes('UA') ? 'Mystic' : this.ClassWeighted(usedBooks);
  },

  /**
   * Random status with weighted distribution
   * @returns {string} Status description
   */
  Status: function () {
    const roll = Random.DiceRoll('3d6');
    if (roll < 4) return 'Dead (roll on the Cause of Death table)';
    if (roll < 6) return 'Missing or unknown';
    if (roll < 9)
      return 'Alive, but doing poorly due to injury, financial trouble, or relationship difficulties';
    if (roll < 13) return 'Alive and well';
    if (roll < 16) return 'Alive and quite successful';
    if (roll < 18) return 'Alive and infamous';
    return 'Alive and famous';
  },

  /**
   * Random "raised by" with weighted distribution
   * @returns {string} Raised by description
   */
  RaisedBy: function () {
    const rand = Random.Num(100);
    if (rand < 1) return 'Nobody';
    if (rand < 2) return 'Institution, such as an asylum';
    if (rand < 3) return 'Temple';
    if (rand < 5) return 'Orphanage';
    if (rand < 7) return 'Guardian';
    if (rand < 15)
      return 'Paternal or maternal aunt, uncle, or both : or extended family such as a tribe or clan';
    if (rand < 25) return 'Paternal or maternal grandparent(s)';
    if (rand < 35) return 'Adoptive family (same or different race)';
    if (rand < 55) return 'Single father or stepfather';
    if (rand < 75) return 'Single mother or stepmother';
    return 'Mother and father';
  },

  /**
   * Random absent parent reason
   * @returns {string} Reason description
   */
  AbsentParent: function () {
    const rand = Random.Num(4);
    if (rand < 1) return 'Your parent(s) died';
    if (rand < 2) return 'Your parent(s) was/were imprisoned, enslaved, or otherwise taken away';
    if (rand < 3) return 'Your parent(s) abandoned you';
    return 'Your parent(s) disappeared to an unknown fate';
  },

  /**
   * Random lifestyle with modifier for home determination
   * @returns {Array} [lifestyle name, modifier]
   */
  Lifestyle: function () {
    const roll = Random.DiceRoll('3d6');
    if (roll < 4) return ['Wretched', -40];
    if (roll < 6) return ['Squalid', -20];
    if (roll < 9) return ['Poor', -10];
    if (roll < 13) return ['Modest', 0];
    if (roll < 16) return ['Comfortable', 10];
    if (roll < 18) return ['Wealthy', 20];
    return ['Aristocratic', 40];
  },

  /**
   * Random childhood home based on lifestyle modifier
   * @param {number} lifeMod - Lifestyle modifier (-40 to +40)
   * @returns {string} Home description
   */
  Home: function (lifeMod) {
    const rand = Random.Num(100) + lifeMod;
    if (rand < 0) return 'On the streets';
    if (rand < 20) return 'Rundown shack';
    if (rand < 30) return 'No permanent residence, you moved around a lot';
    if (rand < 40) return 'Encampment of village in the wilderness';
    if (rand < 50) return 'Apartment in a rundown neighborhood';
    if (rand < 70) return 'Small house';
    if (rand < 90) return 'Large house';
    if (rand < 110) return 'Mansion';
    return 'Palace or Castle';
  },

  /**
   * Random childhood memories
   * @returns {string} Memory description
   */
  Memories: function () {
    const roll = Random.DiceRoll('3d6') + Random.Num(5) - 1;
    if (roll < 4)
      return 'I am still haunted by my childhood, when I was treated badly by my peers';
    if (roll < 6) return 'I spent most of my childhood alone, with no close friends';
    if (roll < 9)
      return 'Others saw me as being different or strange, and so I had few companions';
    if (roll < 13) return 'I had a few close friends and lived an ordinary childhood.';
    if (roll < 16) return 'I had several friends, and my childhood was generally a happy one.';
    if (roll < 18)
      return 'I always found it easy to make friends, and I loved being around people.';
    return 'Everyone knew who I was, and I had friends everywhere I went.';
  },

  /**
   * Random relationship attitude
   * @returns {string} Relationship description
   */
  Relationship: function () {
    const roll = Random.DiceRoll('3d4');
    if (roll < 5) return 'Hostile';
    if (roll < 11) return 'Friendly';
    return 'Indifferent';
  },
};

export default Life;
