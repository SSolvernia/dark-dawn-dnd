/**
 * Card rendering utilities for D&D character cards
 * Ported from original card-script.js
 */

const padding = 20;
const paddingx2 = 40;
const lineHeight = 25;
const textWidthMax = 612 - paddingx2;
const maxLines = 11;
const lineCheck = maxLines + 1;
const labelFont = 'bold 16px Tahoma';
const descriptionFont = '16px Tahoma';

const subclassesCard = {
  Barbarian: 'Primal Path',
  Bard: 'Bard College',
  Cleric: 'Divine Domain',
  Druid: 'Druid Circle',
  Fighter: 'Martial Archetype',
  Monk: 'Monastic Tradition',
  Paladin: 'Sacred Oath',
  Ranger: 'Ranger Archetype',
  Rogue: 'Roguish Archetype',
  Sorcerer: 'Sorcerous Origin',
  Warlock: 'Otherworldly Patron',
  Wizard: 'Arcane Tradition',
  Artificer: 'Artificer Specialty',
  Mystic: 'Mystic Order',
  'Blood Hunter': 'Blood Hunter Order',
};

import Random from './random';

const CardRenderer = {
  /**
   * Main render function - draws the complete card
   */
  render: function (canvas, character, characterType, usedBooks, cardType = 'personality', uploadedImage = null) {
    if (!canvas || !character) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';

    // Use solid color backgrounds based on class
    const bgColor = this.getClassColor(character.Class?.name || 'Fighter');

    // Draw background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, bgColor);
    gradient.addColorStop(1, this.darkenColor(bgColor, 0.3));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If there's an uploaded image, use it
    if (uploadedImage) {
      const img = new Image();
      img.onload = () => {
        // Calculate dimensions to fit the portrait area while maintaining aspect ratio
        const portraitWidth = canvas.width - paddingx2;
        const portraitHeight = canvas.height / 2 - paddingx2;

        const imgAspect = img.width / img.height;
        const portraitAspect = portraitWidth / portraitHeight;

        let drawWidth, drawHeight, drawX, drawY;

        if (imgAspect > portraitAspect) {
          // Image is wider - fit to width
          drawWidth = portraitWidth;
          drawHeight = portraitWidth / imgAspect;
          drawX = padding;
          drawY = padding + (portraitHeight - drawHeight) / 2;
        } else {
          // Image is taller - fit to height
          drawHeight = portraitHeight;
          drawWidth = portraitHeight * imgAspect;
          drawX = padding + (portraitWidth - drawWidth) / 2;
          drawY = padding;
        }

        // Draw the uploaded image
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        // Draw border around portrait area
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding, padding, portraitWidth, portraitHeight);
      };
      img.src = uploadedImage;
    } else {
      // Draw character portrait placeholder with class-themed color
      const portraitColor = this.getClassAccentColor(character.Class?.name || 'Fighter');
      const portraitGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 4, 50,
        canvas.width / 2, canvas.height / 4, 250
      );
      portraitGradient.addColorStop(0, portraitColor);
      portraitGradient.addColorStop(1, this.darkenColor(portraitColor, 0.4));

      ctx.fillStyle = portraitGradient;
      ctx.fillRect(padding, padding, canvas.width - paddingx2, canvas.height / 2 - paddingx2);

      // Draw border around portrait area
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(padding, padding, canvas.width - paddingx2, canvas.height / 2 - paddingx2);

      // Add race/class icon text in portrait area
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = 'bold 48px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText(
        (character.Race?.name || 'Unknown').charAt(0).toUpperCase(),
        canvas.width / 2,
        canvas.height / 4 + 20
      );
    }

    // Reset fill style for text
    ctx.fillStyle = 'black';

    // Draw the card text
    this.makeCardText(canvas, ctx, character, characterType, usedBooks, cardType);
  },

  /**
   * Get background color based on class
   */
  getClassColor: function (className) {
    const colors = {
      Barbarian: '#c25b4a',
      Bard: '#ab7ac5',
      Cleric: '#f0d77d',
      Druid: '#7fb67f',
      Fighter: '#8b6f47',
      Monk: '#d4a76a',
      Paladin: '#daa520',
      Ranger: '#6b8e23',
      Rogue: '#696969',
      Sorcerer: '#9370db',
      Warlock: '#8b4789',
      Wizard: '#4682b4',
      Artificer: '#cd853f',
      'Blood Hunter': '#8b0000',
      Mystic: '#9932cc',
    };
    return colors[className] || '#d4c5a0';
  },

  /**
   * Get accent color for class (for portrait area)
   */
  getClassAccentColor: function (className) {
    const colors = {
      Barbarian: '#e07b5f',
      Bard: '#c89bdf',
      Cleric: '#fff3b0',
      Druid: '#9fd09f',
      Fighter: '#b08968',
      Monk: '#f0c98a',
      Paladin: '#ffd700',
      Ranger: '#90b458',
      Rogue: '#909090',
      Sorcerer: '#b495f5',
      Warlock: '#b567b9',
      Wizard: '#6ca0dc',
      Artificer: '#e8a75f',
      'Blood Hunter': '#b22222',
      Mystic: '#ba55d3',
    };
    return colors[className] || '#e8d4b0';
  },

  /**
   * Darken a hex color
   */
  darkenColor: function (hex, amount) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const r = Math.max(0, Math.floor(rgb.r * (1 - amount)));
    const g = Math.max(0, Math.floor(rgb.g * (1 - amount)));
    const b = Math.max(0, Math.floor(rgb.b * (1 - amount)));

    return `rgb(${r}, ${g}, ${b})`;
  },

  /**
   * Convert hex to RGB
   */
  hexToRgb: function (hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  },

  /**
   * Draw text on the card
   */
  makeCardText: function (canvas, ctx, character, characterType, usedBooks, cardType) {
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Name
    ctx.textAlign = 'center';
    let text = character.ShortName || character.Name || 'Unknown';
    let fontSize = 40;
    ctx.font = 'bold ' + fontSize + 'px Georgia';
    while (ctx.measureText(text).width > textWidthMax) {
      fontSize--;
      ctx.font = 'bold ' + fontSize + 'px Georgia';
    }
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + padding);

    // Description
    ctx.font = descriptionFont;
    let yPos = canvas.height / 2 + 50;

    // Description line 1
    const stringBuffer = [];
    stringBuffer.push(this.getRaceName(character, usedBooks));
    if (characterType === 'npc') {
      stringBuffer.push(character.Occupation || 'Unknown');
    } else {
      stringBuffer.push(this.getClassName(character));
      stringBuffer.push(this.getBackgroundName(character));
    }

    text = stringBuffer.join(' - ');
    fontSize = 16;
    while (ctx.measureText(text).width > textWidthMax) {
      fontSize--;
      ctx.font = fontSize + 'px Tahoma';
    }

    ctx.fillText(text, canvas.width / 2, yPos);
    yPos += lineHeight;
    ctx.font = descriptionFont;

    // Description line 2
    const stringBuffer2 = [];
    const genderText = character.Race?.name === 'Warforged' ? '' : character.Gender || '';
    const physChar = this.findTraitByName(character.Race?.content, 'Physical Characteristics');

    stringBuffer2.push(this.getVariantTraits(character, usedBooks));
    stringBuffer2.push(genderText);
    if (physChar) {
      if (genderText.length > 0) stringBuffer2.push(' - ');
      stringBuffer2.push(this.findTraitByName(physChar, 'Age') || '');
    }

    ctx.fillText(stringBuffer2.join(''), canvas.width / 2, yPos);
    yPos += lineHeight;

    // The rest of the text
    ctx.textAlign = 'left';
    if (cardType === 'personality') {
      this.setPersonalityCard(ctx, yPos, character, characterType);
    } else if (cardType === 'characteristics') {
      this.setCharacteristicsCard(ctx, yPos, character);
    }
    // Empty card type shows no additional text
  },

  /**
   * Draw personality card
   */
  setPersonalityCard: function (ctx, yPos, character, characterType) {
    const traitArr = this.getTraitsArray(ctx, this.getPersonalityCardData(character, characterType)).slice(0);

    if (characterType === 'either') {
      const occupationTrait = this.getTraitsArrayObject(ctx, {
        name: 'Occupation',
        content: character.Occupation || 'Unknown',
      });
      traitArr.unshift(occupationTrait);
    }

    // Pick which traits we use
    let usedLines = 0;
    const usedTraitIndices = [];
    const usedTraits = [];

    while (usedTraitIndices.length < traitArr.length) {
      const index = Random.Num(traitArr.length);
      if (usedTraitIndices.indexOf(index) < 0) {
        const traitLength = traitArr[index].description.length;
        if (usedLines + traitLength > maxLines) {
          break;
        } else {
          usedTraitIndices.push(index);
          usedLines += traitLength;
        }
      }
    }

    usedTraitIndices.sort((a, b) => a - b);
    for (let index = 0; index < usedTraitIndices.length; index++) {
      usedTraits.push(traitArr[usedTraitIndices[index]]);
    }

    // Bottom-justify it
    yPos += lineHeight * (lineCheck - usedLines);

    // Print
    this.printDescription(ctx, usedTraits, yPos);
  },

  /**
   * Get personality card data
   */
  getPersonalityCardData: function (character, characterType) {
    const allTraits = [];
    const backgroundArr = character.Background?.content || [];
    const raceArr = character.Race?.content || [];
    const npcTraits = character.NPCTraits || {};
    const lifeArr = character.Life?.content || [];

    if (characterType !== 'npc') {
      for (let index = 0; index < backgroundArr.length; index++) {
        const trait = backgroundArr[index];
        if (Array.isArray(trait.content)) {
          for (let subIndex = 0; subIndex < trait.content.length; subIndex++) {
            allTraits.push(trait.content[subIndex]);
          }
        } else {
          allTraits.push(trait);
        }
      }
    }

    if (character.Race?.name === 'Aasimar') {
      const guideName = this.findTraitByName(raceArr, 'Guide Name');
      const guideNature = this.findTraitByName(raceArr, 'Guide Nature');
      const content = guideName + ' (' + guideNature + ')';
      allTraits.push({ name: 'Guide', content: content });
    } else {
      for (let index = 0; index < raceArr.length; index++) {
        const trait = raceArr[index];
        if (
          trait.name !== 'name' &&
          trait.name !== 'Subraces and Variants' &&
          trait.name !== 'Racial Traits' &&
          trait.name !== 'Physical Characteristics'
        ) {
          allTraits.push(trait);
        }
      }
    }

    if (characterType !== 'npc') {
      const classPersonalityArr = this.findTraitByName(character.Class?.content, 'Personality');
      if (classPersonalityArr) {
        for (let index = 0; index < classPersonalityArr.length; index++) {
          const trait = classPersonalityArr[index];
          if (trait != null && trait.content != null) {
            allTraits.push(trait);
          }
        }
      }
    }

    if (characterType !== 'pc') {
      // NPCTraits is a plain object, not a {name, content} structure
      for (const traitName in npcTraits) {
        allTraits.push({ name: traitName, content: npcTraits[traitName] });
      }
    }

    const trinket = this.findTraitByName(lifeArr, 'Trinket');
    if (trinket) {
      allTraits.push({ name: 'Trinket', content: trinket });
    }

    return allTraits;
  },

  /**
   * Draw characteristics card
   */
  setCharacteristicsCard: function (ctx, yPos, character) {
    const data = this.getCharacteristicsCardData(character);
    this.printDescription(ctx, this.getTraitsArray(ctx, data), yPos + lineHeight);
  },

  /**
   * Get characteristics card data
   */
  getCharacteristicsCardData: function (character) {
    const allTraits = [];
    const physChar = this.findTraitByName(character.Race?.content, 'Physical Characteristics');
    if (physChar) {
      for (let index = 0; index < physChar.length; index++) {
        const trait = physChar[index];
        if (trait != null) {
          allTraits.push(trait);
        }
      }
    }
    return allTraits;
  },

  /**
   * Get traits array
   */
  getTraitsArray: function (ctx, source) {
    const traitArr = [];
    for (let index = 0; index < source.length; index++) {
      traitArr.push(this.getTraitsArrayObject(ctx, source[index]));
    }
    return traitArr;
  },

  /**
   * Get traits array object
   */
  getTraitsArrayObject: function (ctx, sourceItem) {
    ctx.font = labelFont;
    const labelText = sourceItem.name + ': ';
    const labelWidth = ctx.measureText(labelText).width;

    ctx.font = descriptionFont;
    const lineArr = this.multilineStringArray(ctx, String(sourceItem.content || ''), labelWidth);

    return {
      label: labelText,
      labelwidth: labelWidth,
      description: lineArr,
    };
  },

  /**
   * Split string into multiple lines
   */
  multilineStringArray: function (ctx, string, labelWidth) {
    const descriptionArr = string.split(' ');
    let currentLine = '';
    const lineArr = [];
    let lineWidth = labelWidth;

    for (let wordIndex = 0; wordIndex < descriptionArr.length; wordIndex++) {
      const word = descriptionArr[wordIndex];
      const wordSpace = ' ' + word;
      const wordSpaceWidth = ctx.measureText(wordSpace).width;

      if (lineWidth + wordSpaceWidth > textWidthMax) {
        lineArr.push(currentLine);
        currentLine = word;
        lineWidth = ctx.measureText(word).width;
      } else {
        currentLine += wordSpace;
        lineWidth += wordSpaceWidth;
      }
    }
    lineArr.push(currentLine);
    return lineArr;
  },

  /**
   * Print description to canvas
   */
  printDescription: function (ctx, traits, yPos) {
    for (let index = 0; index < traits.length; index++) {
      const trait = traits[index];

      // Make the label
      ctx.font = labelFont;
      ctx.fillText(trait.label, padding, yPos);

      // Make the description
      const lineArr = trait.description;
      ctx.font = descriptionFont;
      ctx.fillText(lineArr[0], padding + trait.labelwidth, yPos);
      yPos += lineHeight;

      for (let lineIndex = 1; lineIndex < lineArr.length; lineIndex++) {
        ctx.fillText(lineArr[lineIndex], padding, yPos);
        yPos += lineHeight;
      }
    }
  },

  /**
   * Helper functions
   */
  getRaceForImage: function (raceName) {
    const formatted = this.fileNameFormat(raceName);
    const mapping = {
      gnome: 'halfling',
      'half-elf': Random.Array(['elf', 'human']),
      'half-orc': 'orc',
      aasimar: 'human',
    };
    return mapping[formatted] || formatted;
  },

  getImageFileName: function (raceName, character) {
    const classNm = this.fileNameFormat(character.Class?.name || 'Fighter');
    let gender = character.Gender || 'Male';
    if (gender === 'Nonbinary or Unknown') {
      gender = Random.Array(['Male', 'Female']);
    }
    gender = this.fileNameFormat(gender);

    const genderedRaces = ['dwarf', 'elf', 'halfling', 'human', 'orc', 'tiefling'];
    const classOnlyRaces = ['aarakocra', 'dragonborn', 'goliath', 'firbolg', 'kenku', 'lizardfolk', 'tabaxi', 'triton', 'goblin', 'kobold'];
    const typeRaces = ['bugbear', 'hobgoblin', 'yuan-ti-pureblood', 'tortle', 'warforged'];
    const genderOnlyRaces = ['centaur', 'changeling', 'gith', 'kalashtar', 'leonin', 'minotaur', 'satyr', 'shifter'];

    if (genderedRaces.includes(raceName)) {
      return classNm + '-' + gender;
    }
    if (classOnlyRaces.includes(raceName)) {
      return classNm;
    }
    if (raceName === 'genasi') {
      const subrace = this.findTraitByName(
        this.findTraitByName(character.Race?.content, 'Subraces and Variants'),
        'Subrace'
      );
      return this.fileNameFormat((subrace || 'Air') + '-' + gender);
    }
    if (typeRaces.includes(raceName)) {
      return this.getFileNameByType(classNm);
    }
    if (genderOnlyRaces.includes(raceName)) {
      return gender;
    }
    return raceName;
  },

  getFileNameByType: function (classNm) {
    const trickyClasses = ['bard', 'rogue', 'artificer'];
    const holyClasses = ['cleric', 'paladin'];
    const wildClasses = ['druid', 'ranger'];
    const mageClasses = ['sorcerer', 'warlock', 'wizard', 'mystic'];

    if (trickyClasses.includes(classNm)) return 'tricky';
    if (holyClasses.includes(classNm)) return 'holy';
    if (wildClasses.includes(classNm)) return 'wild';
    if (mageClasses.includes(classNm)) return 'mage';
    return 'melee';
  },

  getRaceName: function (character, usedBooks) {
    const subvar = this.findTraitByName(character.Race?.content, 'Subraces and Variants');
    if (subvar != null) {
      const subrace = this.findTraitByName(subvar, 'Subrace');
      if (subrace != null) {
        if (character.Race.name === 'Tiefling' && subrace === 'Asmodeous Tiefling') {
          return 'Tiefling';
        }
        if (character.Race.name === 'Shifter') {
          return subrace + ' Shifter';
        }
        if (character.Race.name === 'Warforged') {
          return 'Warforged ' + subrace;
        }
        return subrace;
      }
      if (character.Race.name === 'Dragonborn' && usedBooks.includes('EGtW')) {
        const variant = this.findTraitByName(subvar, 'Variant');
        if (variant != null) {
          return variant + ' Dragonborn';
        }
      }
    }
    return character.Race?.name || 'Unknown';
  },

  getClassName: function (character) {
    const subclass = this.findTraitByName(
      character.Class?.content,
      subclassesCard[character.Class?.name]
    );
    return (character.Class?.name || 'Unknown') + (subclass ? ' (' + subclass + ')' : '');
  },

  getBackgroundName: function (character) {
    const variant = this.findTraitByName(character.Background?.content, 'Optional Variant');
    if (variant != null && Random.Num(2) === 1) {
      return character.Background?.name + ' (' + variant + ')';
    }
    return character.Background?.name || 'Unknown';
  },

  getVariantTraits: function (character, usedBooks) {
    const variantRaces = ['Dragonborn', 'Half-Elf', 'Human', 'Tiefling'];
    if (!variantRaces.includes(character.Race?.name)) {
      return '';
    }

    const subvar = this.findTraitByName(character.Race?.content, 'Subraces and Variants');

    if (character.Race.name === 'Dragonborn') {
      const ancestry = this.findTraitByName(subvar, 'Draconic Ancestry');
      return ancestry ? ancestry + ' Dragon Ancestry - ' : '';
    }
    if (character.Race.name === 'Half-Elf') {
      if (!usedBooks.includes('SCAG')) return '';
      const ancestry = this.findTraitByName(subvar, 'Elven Ancestry');
      return ancestry ? ancestry + ' Ancestry - ' : '';
    }
    if (character.Race.name === 'Human') {
      const ethnicity = this.findTraitByName(subvar, 'Ethnicity');
      return ethnicity ? ethnicity + ' - ' : '';
    }
    if (character.Race.name === 'Tiefling') {
      if (!usedBooks.includes('SCAG')) return '';
      const variant = this.findTraitByName(subvar, 'Variant');
      return variant ? variant + ' - ' : '';
    }

    return '';
  },

  findTraitByName: function (arr, name) {
    if (!arr || !Array.isArray(arr)) return null;
    for (let index = 0; index < arr.length; index++) {
      if (arr[index].name === name) {
        return arr[index].content;
      }
    }
    return null;
  },

  fileNameFormat: function (name) {
    if (!name) return '';
    return name.toLowerCase().split(' ').join('-');
  },

  /**
   * Render Dark Dawn character sheet card
   */
  renderDarkDawn: function (canvas, character, uploadedImage = null, displayMode = 'simple') {
    if (!canvas || !character) return;

    // Route to appropriate render function based on display mode
    if (displayMode === 'detailed') {
      return this.renderDarkDawnDetailed(canvas, character, uploadedImage);
    } else {
      return this.renderDarkDawnSimple(canvas, character, uploadedImage);
    }
  },

  /**
   * Render Dark Dawn character sheet card - Simple mode (names only)
   */
  renderDarkDawnSimple: function (canvas, character, uploadedImage = null) {
    if (!canvas || !character) return;

    const ctx = canvas.getContext('2d');
    const padding = 20;
    const paddingx2 = 40;
    const lineHeight = 28;

    // Use faction-based color or default
    const bgColor = this.getDarkDawnColor(character.Faction?.name || 'Default');

    // Draw background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, bgColor);
    gradient.addColorStop(1, this.darkenColor(bgColor, 0.3));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw portrait area
    const portraitHeight = canvas.height / 3;

    if (uploadedImage) {
      const img = new Image();
      img.onload = () => {
        const portraitWidth = canvas.width - paddingx2;
        const imgAspect = img.width / img.height;
        const portraitAspect = portraitWidth / portraitHeight;

        let drawWidth, drawHeight, drawX, drawY;

        if (imgAspect > portraitAspect) {
          drawWidth = portraitWidth;
          drawHeight = portraitWidth / imgAspect;
          drawX = padding;
          drawY = padding + (portraitHeight - drawHeight) / 2;
        } else {
          drawHeight = portraitHeight;
          drawWidth = portraitHeight * imgAspect;
          drawX = padding + (portraitWidth - drawWidth) / 2;
          drawY = padding;
        }

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding, padding, portraitWidth, portraitHeight);
      };
      img.src = uploadedImage;
    } else {
      // Draw placeholder portrait
      const portraitColor = this.getDarkDawnAccentColor(character.Faction?.name || 'Default');
      const portraitGradient = ctx.createRadialGradient(
        canvas.width / 2, portraitHeight / 2 + padding, 50,
        canvas.width / 2, portraitHeight / 2 + padding, 200
      );
      portraitGradient.addColorStop(0, portraitColor);
      portraitGradient.addColorStop(1, this.darkenColor(portraitColor, 0.4));

      ctx.fillStyle = portraitGradient;
      ctx.fillRect(padding, padding, canvas.width - paddingx2, portraitHeight);

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(padding, padding, canvas.width - paddingx2, portraitHeight);

      // Add initial in portrait
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = 'bold 48px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText(
        (character.Race?.name || 'Unknown').charAt(0).toUpperCase(),
        canvas.width / 2,
        portraitHeight / 2 + padding + 20
      );
    }

    // Draw character information
    let yPos = portraitHeight + paddingx2 + 10;

    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';

    // Name
    ctx.font = 'bold 24px Tahoma';
    ctx.fillText(character.Name || 'Unnamed Character', padding, yPos);
    yPos += lineHeight + 8;

    // Separator line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, yPos);
    ctx.lineTo(canvas.width - padding, yPos);
    ctx.stroke();
    yPos += 20;

    // Character attributes
    ctx.font = '18px Tahoma';
    const attributes = [
      { label: 'Race', value: character.Race?.name },
      { label: 'Class', value: character.Class?.name },
      { label: 'Faction', value: character.Faction?.name },
      { label: 'Deity', value: character.Deity?.name },
      { label: 'Special Ability', value: character.SpecialAbility?.name },
      { label: 'Faction Ability', value: character.FactionAbility?.name },
    ];

    const labelWidth = 140;

    attributes.forEach((attr) => {
      if (attr.value) {
        ctx.font = 'bold 16px Tahoma';
        const labelText = `${attr.label}:`;
        ctx.fillText(labelText, padding, yPos);

        ctx.font = '16px Tahoma';

        // Wrap text if needed using multilineStringArray
        const valueText = String(attr.value);
        const lines = this.multilineStringArray(ctx, valueText, labelWidth);

        // Draw first line next to label
        ctx.fillText(lines[0], padding + labelWidth, yPos);
        yPos += lineHeight;

        // Draw remaining lines (if any)
        for (let i = 1; i < lines.length; i++) {
          ctx.fillText(lines[i], padding, yPos);
          yPos += lineHeight;
        }
      }
    });
  },

  /**
   * Render Dark Dawn character sheet card - Detailed mode (names + descriptions)
   */
  renderDarkDawnDetailed: function (canvas, character, uploadedImage = null) {
    if (!canvas || !character) return;

    const ctx = canvas.getContext('2d');
    const padding = 20;
    const paddingx2 = 40;
    const lineHeight = 24;
    const sectionSpacing = 15;

    // Use faction-based color or default
    const bgColor = this.getDarkDawnColor(character.Faction?.name || 'Default');

    // Draw background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, bgColor);
    gradient.addColorStop(1, this.darkenColor(bgColor, 0.3));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw portrait area (smaller for detailed view)
    const portraitHeight = 200;

    if (uploadedImage) {
      const img = new Image();
      img.onload = () => {
        const portraitWidth = canvas.width - paddingx2;
        const imgAspect = img.width / img.height;
        const portraitAspect = portraitWidth / portraitHeight;

        let drawWidth, drawHeight, drawX, drawY;

        if (imgAspect > portraitAspect) {
          drawWidth = portraitWidth;
          drawHeight = portraitWidth / imgAspect;
          drawX = padding;
          drawY = padding + (portraitHeight - drawHeight) / 2;
        } else {
          drawHeight = portraitHeight;
          drawWidth = portraitHeight * imgAspect;
          drawX = padding + (portraitWidth - drawWidth) / 2;
          drawY = padding;
        }

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding, padding, portraitWidth, portraitHeight);
      };
      img.src = uploadedImage;
    } else {
      // Draw placeholder portrait
      const portraitColor = this.getDarkDawnAccentColor(character.Faction?.name || 'Default');
      const portraitGradient = ctx.createRadialGradient(
        canvas.width / 2, portraitHeight / 2 + padding, 40,
        canvas.width / 2, portraitHeight / 2 + padding, 150
      );
      portraitGradient.addColorStop(0, portraitColor);
      portraitGradient.addColorStop(1, this.darkenColor(portraitColor, 0.4));

      ctx.fillStyle = portraitGradient;
      ctx.fillRect(padding, padding, canvas.width - paddingx2, portraitHeight);

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(padding, padding, canvas.width - paddingx2, portraitHeight);

      // Add initial in portrait
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = 'bold 40px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText(
        (character.Race?.name || 'Unknown').charAt(0).toUpperCase(),
        canvas.width / 2,
        portraitHeight / 2 + padding + 15
      );
    }

    // Draw character information
    let yPos = portraitHeight + paddingx2;

    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';

    // Name
    ctx.font = 'bold 22px Tahoma';
    ctx.fillText(character.Name || 'Unnamed Character', padding, yPos);
    yPos += lineHeight + 8;

    // Separator line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, yPos);
    ctx.lineTo(canvas.width - padding, yPos);
    ctx.stroke();
    yPos += 15;

    // Helper function to render a field with description
    const renderField = (label, name, description) => {
      if (!name) return;

      // Label
      ctx.font = 'bold 15px Tahoma';
      ctx.fillText(`${label}:`, padding, yPos);
      yPos += lineHeight;

      // Name value
      ctx.font = '14px Tahoma';
      ctx.fillText(name, padding + 10, yPos);
      yPos += lineHeight;

      // Description (if available)
      if (description && description !== 'undefined') {
        ctx.font = 'italic 13px Tahoma';
        const lines = this.multilineStringArray(ctx, description, 10);

        lines.forEach(line => {
          ctx.fillText(line, padding + 10, yPos);
          yPos += lineHeight - 2;
        });
      }

      yPos += sectionSpacing;
    };

    // Render each field with its description
    renderField('Race', character.Race?.name, character.Race?.description);
    renderField('Class', character.Class?.name, character.Class?.description);
    renderField('Faction', character.Faction?.name, character.Faction?.description);
    renderField('Deity', character.Deity?.name, character.Deity?.description);
    renderField('Special Ability', character.SpecialAbility?.name, character.SpecialAbility?.description);
    renderField('Faction Ability', character.FactionAbility?.name, character.FactionAbility?.description);
  },

  /**
   * Get Dark Dawn faction colors
   */
  getDarkDawnColor: function (factionName) {
    const colors = {
      'The Guardians': '#4a7c9e',
      'Shadow Council': '#5a3d6b',
      'Arcane Order': '#7b3f8f',
      'Iron Legion': '#8b4545',
      'Default': '#5a5a5a',
    };
    return colors[factionName] || colors.Default;
  },

  /**
   * Get Dark Dawn accent colors
   */
  getDarkDawnAccentColor: function (factionName) {
    const colors = {
      'The Guardians': '#6fa3d4',
      'Shadow Council': '#8b6ba3',
      'Arcane Order': '#b366cc',
      'Iron Legion': '#c76b6b',
      'Default': '#808080',
    };
    return colors[factionName] || colors.Default;
  },
};

export default CardRenderer;
