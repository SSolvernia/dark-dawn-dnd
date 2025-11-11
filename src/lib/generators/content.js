/**
 * Content processing module
 * Handles recursive content generation with special cases
 * Ported from original char-gen-script.js
 */

import Random from '../utils/random';

// Helper to check if object is empty
function isEmptyObject(obj) {
  if (!obj || typeof obj !== 'object') return true;
  return Object.keys(obj).length === 0;
}

const Content = {
  /**
   * Recursively process content objects
   * @param {*} item - Content item to process
   * @param {Object} context - Context object with character, data, usedBooks, etc.
   * @returns {*} Processed content
   */
  Get: function (item, context) {
    if (item == null) return null;
    if (typeof item == 'object') {
      if (Array.isArray(item)) return this.Get(Random.Array(item), context);
      else {
        if (item.hasOwnProperty('_special')) {
          let specialItem = this.Special(item, context);
          if (isEmptyObject(specialItem)) return null;
          return specialItem;
        }
        let properties = [];
        for (let propertyName in item) {
          let content = this.Get(item[propertyName], context);
          if (content != null)
            properties.push({
              name: propertyName,
              content: content,
            });
        }
        return properties;
      }
    }
    return item;
  },

  /**
   * Get a random property from an object
   * @param {Object} item - Object to select from
   * @param {string} dropdownVal - Selected value or "Random"
   * @param {Object} context - Context object
   * @returns {Object} Selected property with name and content
   */
  GetRandom: function (item, dropdownVal = 'Random', context) {
    if (dropdownVal != 'Random')
      return {
        name: dropdownVal,
        content: this.Special(item[dropdownVal], context),
      };
    let propsArr = [],
      randomProp;
    for (let propName in item) {
      if (
        item[propName].hasOwnProperty('_special') &&
        this.CheckBookSpecial(item[propName]._special, context.usedBooks)
      )
        propsArr.push(propName);
    }
    randomProp = Random.Array(propsArr);
    return {
      name: randomProp,
      content: this.Special(item[randomProp], context),
    };
  },

  /**
   * Handle special cases (indicated by _special keyword)
   * @param {Object} item - Item with _special property
   * @param {Object} context - Context object
   * @returns {*} Processed special item
   */
  Special: function (item, context) {
    // Clone the item, remove special from the clone, and apply every special in order
    let newItem = Object.assign({}, item),
      cases = item._special.split(' ');
    delete newItem._special;
    for (let caseIndex = 0; caseIndex < cases.length; caseIndex++)
      newItem = this.ApplySpecial(cases[caseIndex], newItem, context);
    if (newItem == null || isEmptyObject(newItem)) return null;
    return this.Get(newItem, context);
  },

  /**
   * Apply one special case to an object
   * @param {string} special - Special case identifier
   * @param {Object} specialItem - Item to apply special to
   * @param {Object} context - Context object with data, character, usedBooks
   * @returns {*} Transformed item
   */
  ApplySpecial: function (special, specialItem, context) {
    if (specialItem == null || typeof specialItem != 'object') return specialItem;
    let splitSpecial = special.split('-');
    const { character, data, usedBooks, ethnicityOption } = context;

    switch (splitSpecial[0]) {
      case 'book': // Remove this item if we don't have the necessary book
        return this.CheckBookString(splitSpecial[1], usedBooks) ? specialItem : null;

      case 'booksort': // Merge arrays from applicable books
        return this.BookSort(specialItem, usedBooks);

      case 'characteristics': // Output height, weight, appearance, etc
        return this.GetCharacteristics(specialItem);

      case 'gendersort': // Get property according to gender
        return character.Gender == 'Male'
          ? specialItem.Male
          : character.Gender == 'Female'
          ? specialItem.Female
          : Random.Array([specialItem.Male, specialItem.Female]);

      case 'halfethnicity': // Get human ethnicity for half-humans
        context.mcEthnicity = Random.Num(5) > 0 ? this.GetRandomEthnicity(context) : 'Unknown';
        return context.mcEthnicity;

      case 'humanethnicity': // Get human ethnicity for full-humans
        context.mcEthnicity = this.GetRandomEthnicity(context);
        return context.mcEthnicity;

      case 'subracesort': // Handle subrace selection
        let SubracePropName =
            splitSpecial.length > 1 ? splitSpecial[1].split('_').join(' ') : 'Subrace',
          subracesAndVariants = specialItem['Subraces and Variants'],
          newSubVar = {},
          subraceString;

        for (let propertyName in subracesAndVariants) {
          if (propertyName == SubracePropName) {
            subraceString = Array.isArray(subracesAndVariants[propertyName])
              ? Random.Array(subracesAndVariants[SubracePropName])
              : this.BookSort(subracesAndVariants[SubracePropName], usedBooks);
            newSubVar[propertyName] = subraceString;
          } else newSubVar[propertyName] = subracesAndVariants[propertyName];
        }
        return {
          'Subraces and Variants': newSubVar,
          'Physical Characteristics': specialItem['Physical Characteristics'][subraceString],
        };

      case 'dragonbornvarianttype': // Wildemount dragonborn variants
        if (!usedBooks.includes('EGtW')) return null;
        return Random.Array(specialItem._array);

      case 'dragonmarkvariant': // Eberron dragonmarks
        if (!usedBooks.includes('EBR') || Random.Num(2) == 0) return null;
        return Random.Array(specialItem._array);

      case 'tieflingappearance': // Tieflings have weird appearances
        if (Random.Num(3) == 0) return null;
        return Random.ArrayMultiple(specialItem._array, Random.DiceRoll('1d4') + 1);

      case 'tieflingvarianttype': // Tieflings variants
        if (!usedBooks.includes('SCAG')) return null;
        return Random.Array(specialItem._array);

      case 'monstrousorigin': // Monster origins
        return Random.Array(data.other.monstrousOrigins);

      case 'backgroundtraits': // SCAG backgrounds
        let backgroundCopy = data.backgrounds[splitSpecial[1].split('_').join(' ')];
        return {
          Trait: backgroundCopy.Trait,
          Ideal: backgroundCopy.Ideal,
          Bond: backgroundCopy.Bond,
          Flaw: backgroundCopy.Flaw,
        };

      case 'ravnicacontacts': // Ravnica Backgrounds
        let guildName = specialItem['_name'],
          ravnicaContacts = {};
        ravnicaContacts[guildName + ' Ally'] = Random.Array(specialItem['_guild']);
        ravnicaContacts[guildName + ' Rival'] = Random.Array(specialItem['_guild']);
        let nonGuildContact = Random.Array(specialItem['_nonguild']);
        if (nonGuildContact == '_reroll') {
          nonGuildContact = Random.Array(specialItem['_guild']);
          ravnicaContacts['Additional ' + guildName + ' Contact'] = nonGuildContact;
        } else ravnicaContacts['Non-' + guildName + ' Contact'] = nonGuildContact;
        return ravnicaContacts;

      case 'dimircontacts': // Ravnica Backgrounds, House Dimir
        let dimirContacts = {},
          secondaryGuild = Random.Array(specialItem._guilds),
          otherGuildContacts =
            data.backgrounds[secondaryGuild.background]['Contacts']['_guild'];
        dimirContacts['Dimir Ally'] = Random.Array(specialItem['_dimircontact']);
        dimirContacts['Secondary Guild'] = secondaryGuild.name;
        dimirContacts['Secondary Guild Ally'] = Random.Array(otherGuildContacts);
        dimirContacts['Secondary Guild Rival'] = Random.Array(otherGuildContacts);
        return dimirContacts;
    }
    return specialItem;
  },

  /**
   * Merge arrays from applicable books
   * @param {Object} specialItem - Object with book-specific arrays
   * @param {Array} usedBooks - List of selected books
   * @returns {*} Random element from merged arrays
   */
  BookSort: function (specialItem, usedBooks) {
    if (specialItem.hasOwnProperty('_special')) delete specialItem._special;
    let contentArr = [];
    for (let bookName in specialItem) {
      if (this.CheckBookString(bookName, usedBooks))
        contentArr = contentArr.concat(specialItem[bookName]);
    }
    return Random.Array(contentArr);
  },

  /**
   * Compute age, height, weight, and other physical characteristics
   * @param {Object} item - Characteristics data
   * @returns {Object} Computed characteristics
   */
  GetCharacteristics: function (item) {
    let chaObj = {},
      age = Random.Num(item.maxage - item.minage) + item.minage;
    age += age == 1 ? ' year' : ' years';
    chaObj.Age = age;

    let heightmod = Random.DiceRoll(item.heightmod),
      intHeight = item.baseheight + heightmod;
    chaObj.Height = Math.floor(intHeight / 12) + "'" + (intHeight % 12) + '"';
    chaObj.Weight = item.baseweight + heightmod * Random.DiceRoll(item.weightmod) + ' lbs.';
    let otherObj = item._other;

    if (otherObj == undefined) return chaObj;
    for (let otherName in otherObj) chaObj[otherName] = otherObj[otherName];
    return chaObj;
  },

  /**
   * Get random ethnicity based on settings
   * @param {Object} context - Context with data, usedBooks, ethnicityOption
   * @returns {string} Ethnicity name
   */
  GetRandomEthnicity: function (context) {
    const { data, usedBooks, ethnicityOption } = context;
    return ethnicityOption == 'standard'
      ? usedBooks.includes('SCAG')
        ? Random.Array(
            data.races.Human['Subraces and Variants'].Ethnicity.PHB.concat(
              data.races.Human['Subraces and Variants'].Ethnicity.SCAG
            )
          )
        : Random.Array(data.races.Human['Subraces and Variants'].Ethnicity.PHB)
      : Random.Array(data.races.Human['Subraces and Variants'].Ethnicity.Real);
  },

  /**
   * Check if a special string includes any of the used books
   * @param {string} specialString - Special string with book references
   * @param {Array} usedBooks - List of used books
   * @returns {boolean} True if book is available
   */
  CheckBookSpecial: function (specialString, usedBooks) {
    let splitSpecial = specialString.split(' ');
    for (let specialIndex = 0; specialIndex < splitSpecial.length; specialIndex++) {
      if (splitSpecial[specialIndex].slice(0, 5) == 'book-')
        return this.CheckBookString(splitSpecial[specialIndex].slice(5), usedBooks);
    }
    return false;
  },

  /**
   * Check if a book string matches any used book
   * @param {string} bookString - Book identifier(s)
   * @param {Array} usedBooks - List of used books
   * @returns {boolean} True if book is available
   */
  CheckBookString: function (bookString, usedBooks) {
    for (let index = 0; index < usedBooks.length; index++) {
      if (bookString.includes(usedBooks[index])) return true;
    }
    return false;
  },
};

export default Content;
