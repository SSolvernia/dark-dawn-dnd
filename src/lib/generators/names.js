/**
 * Name generation module
 * Handles race-specific name generation
 * Ported from original char-gen-script.js
 */

import Random from '../utils/random';
import Content from './content';

const Names = {
  /**
   * Get a name based on race and gender
   * @param {string} raceName - Race name
   * @param {string} gender - Gender ("Male", "Female", or "Nonbinary or Unknown")
   * @param {Object} context - Context object with data, character, etc.
   * @returns {string} Generated name
   */
  Get: function (raceName, gender, context) {
    const { data, character, ethnicityOption } = context;
    const names = data.names;

    switch (raceName) {
      case 'Aarakocra':
      case 'Changeling':
      case 'Grung':
      case 'Kenku':
      case 'Kobold':
      case 'Lizardfolk':
      case 'Locathah':
      case 'Shifter':
      case 'Tortle':
      case 'Verdan':
      case 'Warforged':
        return Random.Array(names[raceName]);

      case 'Bugbear':
      case 'Goblin':
      case 'Hobgoblin':
        return this.GetGendered(names['Goblinoid'], gender);

      case 'Centaur':
      case 'Minotaur':
      case 'Orc':
      case 'Leonin':
      case 'Loxodon':
      case 'Vedalken':
        return this.GetGendered(names[raceName], gender);

      case 'Aasimar':
      case 'Dhampir':
      case 'Genasi':
      case 'Hexblood':
      case 'Reborn':
        return this.GetHuman(this.GetHumanEthnicity(context), gender, context);

      case 'Dragonborn':
        return this.FirstnameLastname(names.Dragonborn, 'Clan', gender);

      case 'Dwarf':
        if (this.GetSubrace(character) == 'Duergar')
          return (
            this.GetGendered(names.Dwarf, gender) +
            ' ' +
            Random.Array(names.Dwarf['Clan (Duergar)'])
          );
        return this.FirstnameLastname(names.Dwarf, 'Clan', gender);

      case 'Elf':
        if (this.GetSubrace(character) == 'Drow')
          return this.FirstnameLastname(names.Drow, 'Family', gender);
        if (this.GetSubrace(character) == 'Shadar-kai')
          return this.GetGendered(names['Shadar-kai'], gender);
        // Get age from character if available
        let elfAge = character.age || 100;
        return elfAge < 80 + Random.Num(40)
          ? Random.Array(names.Elf.Child) + ' ' + Random.Array(names.Elf.Family)
          : this.FirstnameLastname(names.Elf, 'Family', gender);

      case 'Firbolg':
        return this.GetGendered(names.Elf, gender);

      case 'Gith':
        return this.GetSubrace(character) == 'Githyanki'
          ? this.GetGendered(names.Githyanki, gender)
          : this.GetGendered(names.Githzerai, gender);

      case 'Gnome':
        if (this.GetSubrace(character) == 'Deep Gnome')
          return this.FirstnameLastname(names['Deep Gnome'], 'Clan', gender);
        let numNames = 4 + Random.Num(4);
        let gnomeNames = [];
        while (gnomeNames.length < numNames) {
          let item;
          if (gender == 'Male' || gender == 'Female') item = Random.Array(names.Gnome[gender]);
          else item = Random.Array(names.Gnome[this.RandomGender()]);
          if (!gnomeNames.includes(item)) gnomeNames.push(item);
        }
        let firstNames = gnomeNames.join(' ');
        return (
          firstNames +
          ' "' +
          Random.Array(names.Gnome.Nickname) +
          '" ' +
          Random.Array(names.Gnome.Clan)
        );

      case 'Goliath':
        return (
          Random.Array(names.Goliath.Birth) +
          ' "' +
          Random.Array(names.Goliath.Nickname) +
          '" ' +
          Random.Array(names.Goliath.Clan)
        );

      case 'Halfling':
        return this.FirstnameLastname(names.Halfling, 'Family', gender);

      case 'Half-Elf':
        let hElfRand = Random.Num(6),
          elfSubrace = this.GetSubrace(character),
          elfNameArray = elfSubrace == 'Drow' ? names.Drow : names.Elf;
        if (hElfRand < 2)
          return (
            this.HumanFirst(this.GetHumanEthnicity(context), gender, context) +
            ' ' +
            Random.Array(elfNameArray.Family)
          );
        if (hElfRand < 4)
          return (
            this.GetGendered(elfNameArray, gender) +
            this.HumanLast(this.GetHumanEthnicity(context), context)
          );
        if (hElfRand < 5) return this.GetHuman(this.GetHumanEthnicity(context), gender, context);
        return this.FirstnameLastname(elfNameArray, 'Family', gender);

      case 'Half-Orc':
        let hOrcRand = Random.Num(4);
        return hOrcRand < 1
          ? this.GetGendered(names.Orc, gender)
          : hOrcRand < 2
          ? this.GetGendered(names.Orc, gender) + this.HumanLast(this.GetHumanEthnicity(context), context)
          : this.GetHuman(this.GetHumanEthnicity(context), gender, context);

      case 'Human':
        return this.GetHuman(context.mcEthnicity, gender, context);

      case 'Kalashtar':
        return Random.Array(names['Kalashtar/Quori']);

      case 'Leonin':
        return this.FirstnameLastname(names.Leonin, 'Pride', gender);

      case 'Satyr':
        return (
          this.GetGendered(names.Satyr, gender) +
          ' "' +
          Random.Array(names.Satyr.Nicknames) +
          '"'
        );

      case 'Simic Hybrid':
        let raceNames = Random.Array([names.Human, names.Elf, names.Vedalken]);
        return raceNames == names.Human
          ? this.GetHuman(Content.GetRandomEthnicity(context), gender, context)
          : this.GetGendered(raceNames, gender);

      case 'Tabaxi':
        return Random.Array(names.Tabaxi.Name) + ' ' + Random.Array(names.Tabaxi.Clan);

      case 'Triton':
        return this.FirstnameLastname(names.Triton, 'Surname', gender);

      case 'Tiefling':
        if (Random.Num(5) < 2) return this.GetHuman(this.GetHumanEthnicity(context), gender, context);
        let lastName = this.HumanLast(this.GetHumanEthnicity(context), context);
        const names_ref = data.names;
        return gender == 'Male' || gender == 'Female'
          ? Random.Num(3) == 0
            ? this.GetGendered(names_ref.Infernal, gender) + lastName
            : Random.Array(names_ref.Virtue) + lastName
          : Random.Num(3) > 0
          ? Random.Array(names_ref.Virtue) + lastName
          : this.GetGendered(names_ref.Infernal, gender) + lastName;

      case 'Yuan-Ti Pureblood':
        return Random.Array(names['Yuan-Ti']);
    }
  },

  /**
   * Get shortened version of character name
   * @param {Object} character - Character object
   * @returns {string} Shortened name
   */
  Shortened: function (character) {
    if (
      character.Race.name == 'Gnome' &&
      character.Race.content[0].content[0].content != 'Deep Gnome'
    ) {
      let nameArr = character.Name.split(' '),
        firstName = nameArr[Random.Num(nameArr.length - 2)];
      return firstName + ' ' + nameArr[nameArr.length - 2] + ' ' + nameArr[nameArr.length - 1];
    } else if (character.Race.name == 'Tabaxi') {
      let nicknameIndex = character.Name.indexOf('"');
      return character.Name.substring(nicknameIndex);
    }
    return character.Name;
  },

  /**
   * Get random gender
   * @returns {string} "Male" or "Female"
   */
  RandomGender: () => Random.Array(['Male', 'Female']),

  /**
   * Get character's subrace
   * @param {Object} character - Character object
   * @returns {string|undefined} Subrace name
   */
  GetSubrace: function (character) {
    let race = character.Race?.content;
    if (!race) return undefined;
    for (let index = 0; index < race.length; index++) {
      if (race[index].name == 'Subraces and Variants') {
        let subrace = race[index].content;
        for (let index2 = 0; index2 < subrace.length; index2++) {
          if (subrace[index2].name == 'Subrace') return subrace[index2].content;
        }
      }
    }
  },

  /**
   * Return first and last name
   * @param {Object} names - Names object
   * @param {string} lastnameType - Last name property name
   * @param {string} gender - Gender
   * @returns {string} Full name
   */
  FirstnameLastname: function (names, lastnameType, gender) {
    return this.GetGendered(names, gender) + ' ' + Random.Array(names[lastnameType]);
  },

  /**
   * Get gendered name or random if nonbinary
   * @param {Object} names - Names object
   * @param {string} gender - Gender
   * @returns {string} Name
   */
  GetGendered: function (names, gender) {
    return Random.Array(
      names[gender == 'Male' || gender == 'Female' ? gender : this.RandomGender()]
    );
  },

  /**
   * Get full human name
   * @param {string} ethnicity - Ethnicity name
   * @param {string} gender - Gender
   * @param {Object} context - Context object
   * @returns {string} Full name
   */
  GetHuman: function (ethnicity, gender, context) {
    let lastName = this.HumanLast(ethnicity, context);
    return this.HumanFirst(ethnicity, gender, context) + (lastName != null ? lastName : '');
  },

  /**
   * Get human first name
   * @param {string} ethnicity - Ethnicity name
   * @param {string} gender - Gender
   * @param {Object} context - Context object
   * @returns {string} First name
   */
  HumanFirst: function (ethnicity, gender, context) {
    const { data, ethnicityOption } = context;
    const names = data.names;

    // Handle undefined or Unknown ethnicity
    if (!ethnicity || ethnicity === 'Unknown') {
      ethnicity = Content.GetRandomEthnicity(context);
    }

    return ethnicityOption == 'standard'
      ? this.GetGendered(
          ethnicity == 'Tethyrian' ? names.Human.Chondathan : names.Human[ethnicity],
          gender
        )
      : this.GetGendered(names['Human (Real)'][ethnicity], gender);
  },

  /**
   * Get human last name
   * @param {string} ethnicity - Ethnicity name
   * @param {Object} context - Context object
   * @returns {string} Last name with leading space or empty string
   */
  HumanLast: function (ethnicity, context) {
    const { data, ethnicityOption } = context;
    const names = data.names;

    // Handle undefined or Unknown ethnicity
    if (!ethnicity || ethnicity === 'Unknown') {
      ethnicity = Content.GetRandomEthnicity(context);
    }

    return ethnicityOption == 'standard'
      ? ethnicity == 'Bedine'
        ? ' ' + Random.Array(names.Human.Bedine.Tribe)
        : ethnicity == 'Tethyrian'
        ? ' ' + Random.Array(names.Human.Chondathan.Surname)
        : ethnicity == 'Tuigan' || ethnicity == 'Ulutiun'
        ? ''
        : ' ' + Random.Array(names.Human[ethnicity].Surname)
      : '';
  },

  /**
   * Get character's human ethnicity
   * @param {Object} context - Context object
   * @returns {string} Ethnicity name
   */
  GetHumanEthnicity: (context) =>
    !context.mcEthnicity || context.mcEthnicity == 'Unknown'
      ? Content.GetRandomEthnicity(context)
      : context.mcEthnicity,
};

export default Names;
