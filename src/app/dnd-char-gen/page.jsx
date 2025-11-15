'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useCharacterData } from '@/lib/hooks/useCharacterData';
import { useDarkDawnData } from '@/lib/hooks/useDarkDawnData';
import { getUsedBooks, checkBookSpecial } from '@/lib/utils/books';
import Generate from '@/lib/generators/character';
import DarkDawnGenerate from '@/lib/generators/darkdawn';
import Life from '@/lib/generators/life';
import NPC from '@/lib/generators/npc';
import CardRenderer from '@/lib/utils/cardRenderer';
import { exportDarkDawnToPDF } from '@/lib/utils/pdfExporter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LockKeyholeIcon } from '@/components/ui/icons/lucide-lock-keyhole';
import { LockKeyholeOpenIcon } from '@/components/ui/icons/lucide-lock-keyhole-open';
import './dnd-char-gen.css';

/**
 * Recursively render nested character data structure
 * Converts {name, content} structure into nested lists
 * @param {Object|Array} item - Item with content array
 * @param {number} key - React key for list items
 * @returns {JSX.Element} Rendered list items
 */
function renderContent(item, key = 0) {
  if (!item) return null;

  // If item has content array (standard structure)
  if (item.content && Array.isArray(item.content)) {
    return item.content.map((subItem, index) => renderContentItem(subItem, `${key}-${index}`));
  }

  // If item is the content array itself
  if (Array.isArray(item)) {
    return item.map((subItem, index) => renderContentItem(subItem, `${key}-${index}`));
  }

  return null;
}

/**
 * Render a single content item
 * @param {Object} item - Item with name and content
 * @param {string} key - React key
 * @returns {JSX.Element} Rendered list item
 */
function renderContentItem(item, key) {
  if (!item || !item.name) return null;

  const content = item.content;

  // If content is a simple value (string, number)
  if (typeof content !== 'object' || content === null) {
    return (
      <li key={key}>
        <b>{item.name}</b>: {content}
      </li>
    );
  }

  // If content is an object/array (nested structure)
  return (
    <li key={key}>
      <b>{item.name}</b>:
      <ul>{renderContent(content, key)}</ul>
    </li>
  );
}

/**
 * Render simple object properties (for NPCTraits, Life.Origin, etc.)
 * @param {Object} obj - Object to render
 * @param {string} keyPrefix - Prefix for React keys
 * @returns {JSX.Element[]} Array of list items
 */
function renderObjectProperties(obj, keyPrefix = '') {
  if (!obj || typeof obj !== 'object') return null;

  return Object.entries(obj).map(([name, value], index) => {
    const key = `${keyPrefix}-${index}`;

    // Handle nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return (
        <li key={key}>
          <b>{name}</b>:
          <ul>{renderObjectProperties(value, key)}</ul>
        </li>
      );
    }

    // Handle simple values
    return (
      <li key={key}>
        <b>{name}</b>: {value !== null && value !== undefined ? String(value) : ''}
      </li>
    );
  });
}

export default function CharacterGeneratorPage() {
  // System selector
  const [gameSystem, setGameSystem] = useState('darkdawn'); // 'dnd' or 'darkdawn'

  // Load JSON data
  const { data, loading, error } = useCharacterData();
  const { data: ddData, loading: ddLoading, error: ddError } = useDarkDawnData();

  // Character state
  const [character, setCharacter] = useState({});
  const [prevCharacters, setPrevCharacters] = useState([]);

  // Dark Dawn character state
  const [ddCharacter, setDDCharacter] = useState({});

  // Configuration state
  const [characterType, setCharacterType] = useState('either');
  const [cardType, setCardType] = useState('summary'); // personality, characteristics, or plaintext
  const [uploadedImage, setUploadedImage] = useState(null); // Uploaded character image

  // Dropdown selections
  const [selectedGender, setSelectedGender] = useState('Random');
  const [selectedRace, setSelectedRace] = useState('Random');
  const [selectedClass, setSelectedClass] = useState('Random');
  const [selectedBackground, setSelectedBackground] = useState('Random');

  // Radio button selections
  const [raceRandomizer, setRaceRandomizer] = useState('normal');
  const [ethnicityType, setEthnicityType] = useState('standard');

  // Refs
  const canvasRef = useRef(null);

  // Lock state
  const [locks, setLocks] = useState({
    name: false,
    traits: false,
    occupation: false,
    gender: false,
    race: false,
    class: false,
    background: false,
    life: false,
  });

  // Dark Dawn states
  const [ddName, setDDName] = useState('');
  const [selectedDDRace, setSelectedDDRace] = useState('Random');
  const [selectedDDFaction, setSelectedDDFaction] = useState('Random');
  const [selectedDDFactionAbility, setSelectedDDFactionAbility] = useState('Random');
  const [selectedDDDeity, setSelectedDDDeity] = useState('Random');
  const [selectedDDClass, setSelectedDDClass] = useState('Random');
  const [selectedDDSpecialAbility, setSelectedDDSpecialAbility] = useState('Random');

  // Dark Dawn locks
  const [ddLocks, setDDLocks] = useState({
    name: false,
    race: false,
    faction: false,
    factionAbility: false,
    deity: false,
    class: false,
    specialAbility: false,
  });

  /**
   * Generate dropdown options based on available books
   * @param {Object} itemList - Object with items (races, classes, backgrounds)
   * @param {Array} usedBooks - List of selected books
   * @returns {Array} Array of option objects {value, label}
   */
  const getDropdownOptions = (itemList, usedBooks) => {
    if (!itemList) return [];

    const options = [{ value: 'Random', label: 'Random' }];

    for (let propertyName in itemList) {
      const item = itemList[propertyName];

      // Include item if:
      // 1. It's not an object (shouldn't happen but safety check)
      // 2. It doesn't have _special property
      // 3. It has _special and passes book check
      if (
        typeof item !== 'object' ||
        !item.hasOwnProperty('_special') ||
        checkBookSpecial(item._special, usedBooks)
      ) {
        options.push({ value: propertyName, label: propertyName });
      }
    }

    return options;
  };

  // Dropdown options computed from data
  const usedBooks = useMemo(() => {
    return data ? getUsedBooks(data.books) : [];
  }, [data]);

  const raceOptions = useMemo(() => {
    return data ? getDropdownOptions(data.races, usedBooks) : [];
  }, [data, usedBooks]);

  const classOptions = useMemo(() => {
    return data ? getDropdownOptions(data.classes, usedBooks) : [];
  }, [data, usedBooks]);

  const backgroundOptions = useMemo(() => {
    return data ? getDropdownOptions(data.backgrounds, usedBooks) : [];
  }, [data, usedBooks]);

  /**
   * Calculate canvas height dynamically based on game system and card type
   * Canvas height is memoized to avoid cascading renders
   */
  const canvasHeight = useMemo(() => {
    if (gameSystem === 'darkdawn' && (cardType === 'personality' || cardType === 'characteristics')) {
      return 1400; // Detailed mode for Dark Dawn needs more space
    }
    return 792; // Default height for simple mode or D&D
  }, [gameSystem, cardType]);

  /**
   * Render canvas when character or card type changes
   */
  useEffect(() => {
    if (cardType === 'plaintext' || cardType === 'summary') return;
    if (!canvasRef.current) return;

    // Render for Dark Dawn system
    if (gameSystem === 'darkdawn') {
      if (!ddData || !ddCharacter.Race) return;

      // Determine display mode based on cardType
      // 'personality' or 'characteristics' = detailed (names + descriptions)
      // 'empty' = simple (names only)
      const displayMode = (cardType === 'personality' || cardType === 'characteristics')
        ? 'detailed'
        : 'simple';

      CardRenderer.renderDarkDawn(canvasRef.current, ddCharacter, uploadedImage, displayMode);
      return;
    }

    // Render for D&D system
    if (!data || !character.Race) return;
    CardRenderer.render(canvasRef.current, character, characterType, usedBooks, cardType, uploadedImage);
  }, [gameSystem, character, ddCharacter, cardType, data, ddData, characterType, uploadedImage, usedBooks]);

  /**
   * Toggle lock state for a specific attribute
   * @param {string} lockKey - Key of the lock to toggle
   */
  const toggleLock = (lockKey) => {
    setLocks((prevLocks) => ({
      ...prevLocks,
      [lockKey]: !prevLocks[lockKey],
    }));
  };

  /**
   * Lock all attributes
   */
  const lockAll = () => {
    setLocks({
      name: true,
      traits: true,
      occupation: true,
      gender: true,
      race: true,
      class: true,
      background: true,
      life: true,
    });
  };

  /**
   * Unlock all attributes
   */
  const unlockAll = () => {
    setLocks({
      name: false,
      traits: false,
      occupation: false,
      gender: false,
      race: false,
      class: false,
      background: false,
      life: false,
    });
  };

  /**
   * Handle image upload
   */
  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Create FileReader to read the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Clear uploaded image
   */
  const handleClearImage = () => {
    setUploadedImage(null);
  };

  /**
   * Build context object for generation
   * @returns {Object} Context object
   */
  const buildContext = () => {
    if (!data) return null;

    // Use state values for ethnicity type (with fallback for 'both' option)
    const ethnicityOption = ethnicityType === 'both'
      ? Math.random() < 0.5 ? 'standard' : 'real'
      : ethnicityType;

    // Use state value for race mode
    const raceMode = raceRandomizer;

    // Use state values for dropdowns
    const raceMenuValue = selectedRace;
    const genderMenuValue = selectedGender;
    const classMenuValue = selectedClass;
    const backgroundMenuValue = selectedBackground;
    const nameInputValue = document.getElementById('name-input')?.value || '';

    return {
      data,
      character,
      usedBooks,
      locks,
      ethnicityOption,
      raceMode,
      raceMenuValue,
      genderMenuValue,
      classMenuValue,
      backgroundMenuValue,
      nameInputValue,
    };
  };

  /**
   * Handle character generation
   */
  const handleGenerateCharacter = () => {
    const context = buildContext();
    if (!context) return;

    // Validate that if race is locked, it has a value (required for Life generation)
    if (locks.race && !character.Race) {
      alert('Cannot generate: Race is locked but not yet generated. Please unlock Race or generate it first.');
      return;
    }

    // Pass existing character so locks can preserve values
    context.character = character;
    context.mcEthnicity = '';
    const newCharacter = Generate.All(context);
    setCharacter(newCharacter);
  };

  /**
   * Generate individual race
   */
  const handleGenerateRace = () => {
    const context = buildContext();
    if (!context) return;

    const newRace = Generate.Race(context);
    setCharacter({ ...character, Race: newRace });
  };

  /**
   * Generate individual class
   */
  const handleGenerateClass = () => {
    const context = buildContext();
    if (!context) return;

    const newClass = Generate.Class(context);
    setCharacter({ ...character, Class: newClass });
  };

  /**
   * Generate individual background
   */
  const handleGenerateBackground = () => {
    const context = buildContext();
    if (!context) return;

    const newBackground = Generate.Background(context);
    setCharacter({ ...character, Background: newBackground });
  };

  /**
   * Generate gender only
   */
  const handleGenerateGender = () => {
    const context = buildContext();
    if (!context) return;

    context.character = character;
    const gender = Generate.Gender(context);

    setCharacter({
      ...character,
      Gender: gender,
    });
  };

  /**
   * Generate name and gender
   */
  const handleGenerateName = () => {
    const context = buildContext();
    if (!context) return;

    if (!character.Race) {
      alert('Please generate a race first!');
      return;
    }

    context.character = character;
    const gender = Generate.Gender(context);
    const nameObj = Generate.Name({ ...context, character: { ...character, Gender: gender } });

    setCharacter({
      ...character,
      Gender: gender,
      Name: nameObj.Name,
      ShortName: nameObj.ShortName,
    });
  };

  /**
   * Generate life/backstory
   */
  const handleGenerateLife = () => {
    const context = buildContext();
    if (!context) return;

    if (!character.Race) {
      alert('Please generate a race first!');
      return;
    }

    context.character = character;
    const life = Life.Get(context);

    setCharacter({
      ...character,
      Life: life,
    });
  };

  /**
   * Generate NPC traits/description
   */
  const handleGenerateTraits = () => {
    const context = buildContext();
    if (!context) return;

    const traits = NPC.GetTraits(context.data);

    setCharacter({
      ...character,
      NPCTraits: traits,
    });
  };

  /**
   * Generate occupation
   */
  const handleGenerateOccupation = () => {
    const context = buildContext();
    if (!context) return;

    const occupation = NPC.GetOccupation(false);

    setCharacter({
      ...character,
      Occupation: occupation,
    });
  };

  /**
   * Convert object properties to plain text format
   * @param {Object} obj - Object to convert
   * @param {number} indent - Indentation level
   * @returns {string} Plain text representation
   */
  const objectToPlainText = (obj, indent = 0) => {
    if (!obj || typeof obj !== 'object') return '';

    let text = '';
    const indentation = '  '.repeat(indent);

    for (let key in obj) {
      const value = obj[key];

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        text += `${indentation}${key}:\n${objectToPlainText(value, indent + 1)}`;
      } else if (value !== null && value !== undefined) {
        text += `${indentation}${key}: ${value}\n`;
      }
    }

    return text;
  };

  /**
   * Build complete plain text representation of character
   * @returns {string} Complete character info as plain text
   */
  const buildPlainText = () => {
    // Dark Dawn character plain text
    if (gameSystem === 'darkdawn') {
      if (!ddCharacter.Name && !ddCharacter.Race) return '';

      let text = `${ddCharacter.Name || 'Unnamed Character'}\n\n`;

      if (ddCharacter.Race?.name) {
        text += `Race: ${ddCharacter.Race.name}\n`;
        if (ddCharacter.Race.description && ddCharacter.Race.description !== 'undefined') {
          text += `  Description: ${ddCharacter.Race.description}\n`;
        }
        text += '\n';
      }

      if (ddCharacter.Class?.name) {
        text += `Class: ${ddCharacter.Class.name}\n`;
        if (ddCharacter.Class.description && ddCharacter.Class.description !== 'undefined') {
          text += `  Description: ${ddCharacter.Class.description}\n`;
        }
        text += '\n';
      }

      if (ddCharacter.Faction?.name) {
        text += `Faction: ${ddCharacter.Faction.name}\n`;
        if (ddCharacter.Faction.description && ddCharacter.Faction.description !== 'undefined') {
          text += `  Description: ${ddCharacter.Faction.description}\n`;
        }
        text += '\n';
      }

      if (ddCharacter.Deity?.name) {
        text += `Deity: ${ddCharacter.Deity.name}\n`;
        if (ddCharacter.Deity.description && ddCharacter.Deity.description !== 'undefined') {
          text += `  Description: ${ddCharacter.Deity.description}\n`;
        }
        text += '\n';
      }

      if (ddCharacter.SpecialAbility?.name) {
        text += `Special Ability: ${ddCharacter.SpecialAbility.name}\n`;
        if (ddCharacter.SpecialAbility.description && ddCharacter.SpecialAbility.description !== 'undefined') {
          text += `  Description: ${ddCharacter.SpecialAbility.description}\n`;
        }
        text += '\n';
      }

      if (ddCharacter.FactionAbility?.name) {
        text += `Faction Ability: ${ddCharacter.FactionAbility.name}\n`;
        if (ddCharacter.FactionAbility.description && ddCharacter.FactionAbility.description !== 'undefined') {
          text += `  Description: ${ddCharacter.FactionAbility.description}\n`;
        }
        text += '\n';
      }

      return text;
    }

    // D&D character plain text
    if (!character.Name) return '';

    let text = `${character.Name}\n`;

    if (character.ShortName && character.ShortName !== character.Name) {
      text += `(${character.ShortName})\n`;
    }

    text += '\n';

    if (character.Race?.name) {
      text += `Race: ${character.Race.name}\n`;
    }

    const gender = character.Race?.name === 'Warforged' ? 'Genderless' : character.Gender;
    if (gender) {
      text += `Gender: ${gender}\n`;
    }

    if (character.Class?.name) {
      text += `Class: ${character.Class.name}\n`;
    }

    if (character.Background?.name) {
      text += `Background: ${character.Background.name}\n`;
    }

    if (character.Occupation) {
      text += `Occupation: ${character.Occupation}\n`;
    }

    if (character.NPCTraits && Object.keys(character.NPCTraits).length > 0) {
      text += '\nDescription:\n';
      text += objectToPlainText(character.NPCTraits, 1);
    }

    if (character.Life?.Origin && Object.keys(character.Life.Origin).length > 0) {
      text += '\nOrigin:\n';
      text += objectToPlainText(character.Life.Origin, 1);
    }

    if (character.Life && Object.keys(character.Life).length > 0) {
      text += '\nLife Events:\n';
      text += objectToPlainText(character.Life, 1);
    }

    return text;
  };

  // ===== DARK DAWN FUNCTIONS =====

  /**
   * Get dropdown options from Dark Dawn data
   * @param {Object} dataObject - Data object (races, factions, etc.)
   * @returns {Array} Array of option objects
   */
  const getDDDropdownOptions = (dataObject) => {
    if (!dataObject) return [{ value: 'Random', label: 'Random' }];

    const options = [{ value: 'Random', label: 'Random' }];
    Object.keys(dataObject).forEach((key) => {
      options.push({ value: key, label: key });
    });

    return options;
  };

  /**
   * Get faction ability options (filtered by selected faction)
   * @param {string} factionName - Selected faction name
   * @returns {Array} Array of faction ability options
   */
  const getFactionAbilityOptions = (factionName) => {
    if (!ddData?.factions || !factionName || factionName === 'Random') {
      return [{ value: 'Random', label: 'Random' }];
    }

    const faction = ddData.factions[factionName];
    if (!faction || !faction.abilities) {
      return [{ value: 'Random', label: 'Random' }];
    }

    const options = [{ value: 'Random', label: 'Random' }];
    faction.abilities.forEach((ability) => {
      options.push({ value: ability.name, label: ability.name });
    });

    return options;
  };

  /**
   * Toggle Dark Dawn lock
   * @param {string} lockKey - Key of the lock to toggle
   */
  const toggleDDLock = (lockKey) => {
    setDDLocks((prevLocks) => ({
      ...prevLocks,
      [lockKey]: !prevLocks[lockKey],
    }));
  };

  /**
   * Lock all Dark Dawn attributes
   */
  const lockAllDD = () => {
    setDDLocks({
      name: true,
      race: true,
      faction: true,
      factionAbility: true,
      deity: true,
      class: true,
      specialAbility: true,
    });
  };

  /**
   * Unlock all Dark Dawn attributes
   */
  const unlockAllDD = () => {
    setDDLocks({
      name: false,
      race: false,
      faction: false,
      factionAbility: false,
      deity: false,
      class: false,
      specialAbility: false,
    });
  };

  /**
   * Generate complete Dark Dawn character
   * Applies selections from dropdowns and respects locks
   */
  const handleGenerateDDCharacter = () => {
    if (!ddData) return;

    // Start with current character
    let newCharacter = { ...ddCharacter };

    // Apply name from input (if not locked)
    if (!ddLocks.name) {
      newCharacter.Name = ddName || '';
    }

    // Apply Race (if not locked)
    if (!ddLocks.race) {
      if (selectedDDRace !== 'Random') {
        newCharacter.Race = ddData.races[selectedDDRace];
      } else {
        newCharacter.Race = DarkDawnGenerate.Race(ddData.races, newCharacter, false);
      }
    }

    // Apply Class (if not locked)
    if (!ddLocks.class) {
      if (selectedDDClass !== 'Random') {
        newCharacter.Class = ddData.classes[selectedDDClass];
      } else {
        newCharacter.Class = DarkDawnGenerate.Class(ddData.classes, newCharacter, false);
      }
    }

    // Apply Faction (if not locked)
    if (!ddLocks.faction) {
      if (selectedDDFaction !== 'Random') {
        newCharacter.Faction = ddData.factions[selectedDDFaction];
      } else {
        newCharacter.Faction = DarkDawnGenerate.Faction(ddData.factions, newCharacter, false);
      }
    }

    // Apply Faction Ability (if not locked)
    if (!ddLocks.factionAbility) {
      const faction = newCharacter.Faction;
      if (faction) {
        if (selectedDDFactionAbility !== 'Random') {
          newCharacter.FactionAbility = faction.abilities.find(
            ability => ability.name === selectedDDFactionAbility
          );
        } else {
          newCharacter.FactionAbility = DarkDawnGenerate.FactionAbility(faction, newCharacter, false);
        }
      }
    }

    // Apply Deity (if not locked)
    if (!ddLocks.deity) {
      if (selectedDDDeity !== 'Random') {
        newCharacter.Deity = ddData.deities[selectedDDDeity];
      } else {
        newCharacter.Deity = DarkDawnGenerate.Deity(ddData.deities, newCharacter, false);
      }
    }

    // Apply Special Ability (if not locked)
    if (!ddLocks.specialAbility) {
      if (selectedDDSpecialAbility !== 'Random') {
        newCharacter.SpecialAbility = ddData.specialAbilities[selectedDDSpecialAbility];
      } else {
        newCharacter.SpecialAbility = DarkDawnGenerate.SpecialAbility(
          ddData.specialAbilities,
          newCharacter,
          false
        );
      }
    }

    setDDCharacter(newCharacter);

    // Sync dropdown selections with generated character
    if (newCharacter.Name) {
      setDDName(newCharacter.Name);
    }
    setSelectedDDRace(newCharacter.Race?.name || 'Random');
    setSelectedDDClass(newCharacter.Class?.name || 'Random');
    setSelectedDDFaction(newCharacter.Faction?.name || 'Random');
    setSelectedDDFactionAbility(newCharacter.FactionAbility?.name || 'Random');
    setSelectedDDDeity(newCharacter.Deity?.name || 'Random');
    setSelectedDDSpecialAbility(newCharacter.SpecialAbility?.name || 'Random');
  };

  /**
   * Generate individual Dark Dawn Race
   */
  const handleGenerateDDRace = () => {
    if (!ddData) return;

    let newRace;
    if (selectedDDRace !== 'Random') {
      // Use selected race from dropdown
      newRace = ddData.races[selectedDDRace];
    } else {
      // Generate random race
      newRace = DarkDawnGenerate.Race(ddData.races, ddCharacter, ddLocks.race);
    }
    setDDCharacter({ ...ddCharacter, Race: newRace });
  };

  /**
   * Generate individual Dark Dawn Faction
   */
  const handleGenerateDDFaction = () => {
    if (!ddData) return;

    let newFaction;
    if (selectedDDFaction !== 'Random') {
      // Use selected faction from dropdown
      newFaction = ddData.factions[selectedDDFaction];
    } else {
      // Generate random faction
      newFaction = DarkDawnGenerate.Faction(ddData.factions, ddCharacter, ddLocks.faction);
    }
    setDDCharacter({ ...ddCharacter, Faction: newFaction });

    // If faction ability was not locked, regenerate it for the new faction
    if (!ddLocks.factionAbility) {
      const newAbility = DarkDawnGenerate.FactionAbility(newFaction, ddCharacter, false);
      setDDCharacter((prev) => ({ ...prev, Faction: newFaction, FactionAbility: newAbility }));
      // Update the dropdown selection to match the generated ability
      setSelectedDDFactionAbility(newAbility?.name || 'Random');
    }
  };

  /**
   * Generate individual Dark Dawn Faction Ability
   */
  const handleGenerateDDFactionAbility = () => {
    // Determine faction from dropdown or current character
    const faction = selectedDDFaction !== 'Random'
      ? ddData?.factions[selectedDDFaction]
      : ddCharacter.Faction;

    if (!ddData || !faction) {
      alert('Please select or generate a Faction first!');
      return;
    }

    let newAbility;
    if (selectedDDFactionAbility !== 'Random') {
      // Use selected ability from dropdown - find the full object by name
      newAbility = faction.abilities.find(ability => ability.name === selectedDDFactionAbility);
    } else {
      // Generate random ability from faction
      newAbility = DarkDawnGenerate.FactionAbility(faction, ddCharacter, ddLocks.factionAbility);
      // Update the dropdown selection to match the generated ability
      setSelectedDDFactionAbility(newAbility?.name || 'Random');
    }
    setDDCharacter({ ...ddCharacter, FactionAbility: newAbility });
  };

  /**
   * Generate individual Dark Dawn Deity
   */
  const handleGenerateDDDeity = () => {
    if (!ddData) return;

    let newDeity;
    if (selectedDDDeity !== 'Random') {
      // Use selected deity from dropdown
      newDeity = ddData.deities[selectedDDDeity];
    } else {
      // Generate random deity
      newDeity = DarkDawnGenerate.Deity(ddData.deities, ddCharacter, ddLocks.deity);
    }
    setDDCharacter({ ...ddCharacter, Deity: newDeity });
  };

  /**
   * Generate individual Dark Dawn Class
   */
  const handleGenerateDDClass = () => {
    if (!ddData) return;

    let newClass;
    if (selectedDDClass !== 'Random') {
      // Use selected class from dropdown
      newClass = ddData.classes[selectedDDClass];
    } else {
      // Generate random class
      newClass = DarkDawnGenerate.Class(ddData.classes, ddCharacter, ddLocks.class);
    }
    setDDCharacter({ ...ddCharacter, Class: newClass });
  };

  /**
   * Generate individual Dark Dawn Special Ability
   */
  const handleGenerateDDSpecialAbility = () => {
    if (!ddData) return;

    let newAbility;
    if (selectedDDSpecialAbility !== 'Random') {
      // Use selected ability from dropdown
      newAbility = ddData.specialAbilities[selectedDDSpecialAbility];
    } else {
      // Generate random ability
      newAbility = DarkDawnGenerate.SpecialAbility(
        ddData.specialAbilities,
        ddCharacter,
        ddLocks.specialAbility
      );
    }
    setDDCharacter({ ...ddCharacter, SpecialAbility: newAbility });
  };

  /**
   * Apply name from input to character without regenerating other fields
   */
  const handleApplyDDName = () => {
    setDDCharacter({ ...ddCharacter, Name: ddName });
  };

  // Computed dropdown options for Dark Dawn
  const ddRaceOptions = useMemo(() => {
    return ddData ? getDDDropdownOptions(ddData.races) : [];
  }, [ddData]);

  const ddFactionOptions = useMemo(() => {
    return ddData ? getDDDropdownOptions(ddData.factions) : [];
  }, [ddData]);

  const ddDeityOptions = useMemo(() => {
    return ddData ? getDDDropdownOptions(ddData.deities) : [];
  }, [ddData]);

  const ddClassOptions = useMemo(() => {
    return ddData ? getDDDropdownOptions(ddData.classes) : [];
  }, [ddData]);

  const ddSpecialAbilityOptions = useMemo(() => {
    return ddData ? getDDDropdownOptions(ddData.specialAbilities) : [];
  }, [ddData]);

  const ddFactionAbilityOptions = useMemo(() => {
    // Use selected faction if not random, otherwise use current character faction
    const factionName =
      selectedDDFaction !== 'Random' ? selectedDDFaction : ddCharacter.Faction?.name;

    if (!ddData?.factions || !factionName || factionName === 'Random') {
      return [{ value: 'Random', label: 'Random' }];
    }

    const faction = ddData.factions[factionName];
    if (!faction || !faction.abilities) {
      return [{ value: 'Random', label: 'Random' }];
    }

    const options = [{ value: 'Random', label: 'Random' }];
    faction.abilities.forEach((ability) => {
      options.push({ value: ability.name, label: ability.name });
    });

    return options;
  }, [ddData, selectedDDFaction, ddCharacter.Faction]);

  // Show loading state
  if (loading || (gameSystem === 'darkdawn' && ddLoading)) {
    return (
      <div className="char-gen-body">
        <div className="dnd-container">
          <div className="dnd-content">
            <h1 style={{ textAlign: 'center' }}>Loading Data...</h1>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || (gameSystem === 'darkdawn' && ddError)) {
    return (
      <div className="char-gen-body">
        <div className="dnd-container">
          <div className="dnd-content">
            <h1 style={{ textAlign: 'center', color: 'darkred' }}>Error Loading Data</h1>
            <p style={{ textAlign: 'center' }}>{error || ddError}</p>
            <p style={{ textAlign: 'center' }}>
              Please ensure all JSON files are in the /public/data/ directory.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="char-gen-body">
      <div className="dnd-container">
        <div className={`dnd-content char-type-${characterType}`}>
          {/* Navigation Links */}
          <div style={{ textAlign: 'center' }}>
            <a href="/dnd-reference">PC Options Reference</a> - <b>Character Generator</b> -{' '}
            <a href="/dnd-magic-items">Magic Item Generator</a> -{' '}
            <a href="/dnd-statblock">Statblock Generator</a>
          </div>

          <br />

          <h1>Random Character Generator</h1>
          <br />

          {/* D&D System - Book Selection */}
          {gameSystem === 'dnd' && (
            <>
              <div>Select which books to use:</div>

              <br />

              {/* Book Selection Grid */}
              <div className="booklist row">
                <div className="col-12 col-md-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="PHBbox" disabled checked />
                    <Label htmlFor="PHBbox" className="font-bold cursor-pointer">
                      Player&apos;s Handbook <sup>(PHB)</sup>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="VGtMbox" defaultChecked />
                    <Label htmlFor="VGtMbox" className="font-bold cursor-pointer">
                      Volo&apos;s Guide to Monsters <sup>(VGtM)</sup>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="MRbox" defaultChecked />
                    <Label htmlFor="MRbox" className="font-bold cursor-pointer">
                      Volo&apos;s Guide Monstrous Races <sup>(MR)</sup>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="XGtEbox" defaultChecked />
                    <Label htmlFor="XGtEbox" className="font-bold cursor-pointer">
                      Xanathar&apos;s Guide to Everything <sup>(XGtE)</sup>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="MToFbox" defaultChecked />
                    <Label htmlFor="MToFbox" className="font-bold cursor-pointer">
                      Mordenkainen&apos;s Tome of Foes <sup>(MToF)</sup>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="TCoEbox" defaultChecked />
                    <Label htmlFor="TCoEbox" className="font-bold cursor-pointer">
                      Tasha&apos;s Cauldron of Everything <sup>(TCoE)</sup>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="EEbox" defaultChecked />
                    <Label htmlFor="EEbox" className="font-bold cursor-pointer">
                      Elemental Evil Player&apos;s Companion <sup>(EE)</sup>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="SCAGbox" defaultChecked />
                    <Label htmlFor="SCAGbox" className="font-bold cursor-pointer">
                      Sword Coast Adventurer&apos;s Guide <sup>(SCAG)</sup>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="DMGbox" />
                    <Label htmlFor="DMGbox" className="font-bold cursor-pointer">
                      Dungeon Master&apos;s Guide <sup>(DMG)</sup>
                    </Label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="Modbox" />
                    <Label htmlFor="Modbox" className="font-bold cursor-pointer">
                      Adventure Modules <sup>(Mod)</sup>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="EBRbox" />
                    <Label htmlFor="EBRbox" className="font-bold cursor-pointer">
                      Eberron: Rising from the Last War <sup>(EBR)</sup>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="EGtWbox" />
                    <Label htmlFor="EGtWbox" className="font-bold cursor-pointer">
                      Explorer&apos;s Guide to Wildemount <sup>(EGtW)</sup>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="GGtRbox" />
                    <Label htmlFor="GGtRbox" className="font-bold cursor-pointer">
                      Guildmaster&apos;s Guide to Ravnica <sup>(GGtR)</sup>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="MOoTbox" />
                    <Label htmlFor="MOoTbox" className="font-bold cursor-pointer">
                      Mythic Odysseys of Theros <sup>(MOoT)</sup>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="AIbox" />
                    <Label htmlFor="AIbox" className="font-bold cursor-pointer">
                      Acquisitions Incorporated <sup>(AI)</sup>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="Otherbox" />
                    <Label htmlFor="Otherbox" className="font-bold cursor-pointer">
                      Other Notable Content <sup>(Other)</sup>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="UAbox" />
                    <Label htmlFor="UAbox" className="font-bold cursor-pointer">
                      Unearthed Arcana <sup>(UA)</sup>
                    </Label>
                  </div>
                </div>
          </div>
            </>
          )}

          {/* Dark Dawn System - Character Sheet Builder */}
          {gameSystem === 'darkdawn' && (
            <>
              <Card className="p-4 mt-4">
                <h2 className="text-xl font-bold mb-4">Dark Dawn Character Sheet</h2>

                {/* Name Input */}
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="dd-name-input" className="font-bold w-32">
                      Name:
                    </Label>
                    <Input
                      id="dd-name-input"
                      type="text"
                      placeholder="Character Name"
                      className="w-[20rem]"
                      value={ddName}
                      onChange={(e) => setDDName(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleDDLock('name')}
                    >
                      {ddLocks.name ? <LockKeyholeIcon /> : <LockKeyholeOpenIcon />}
                    </Button>
                  </div>
                </div>

                {/* Race */}
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="dd-race-select" className="font-bold w-32">
                      Race:
                    </Label>
                    <Select value={selectedDDRace} onValueChange={setSelectedDDRace}>
                      <SelectTrigger className="w-[20rem]">
                        <SelectValue placeholder="Select race" />
                      </SelectTrigger>
                      <SelectContent>
                        {ddRaceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleDDLock('race')}
                    >
                      {ddLocks.race ? <LockKeyholeIcon /> : <LockKeyholeOpenIcon />}
                    </Button>
                  </div>
                </div>

                {/* Faction */}
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="dd-faction-select" className="font-bold w-32">
                      Faction:
                    </Label>
                    <Select value={selectedDDFaction} onValueChange={setSelectedDDFaction}>
                      <SelectTrigger className="w-[20rem]">
                        <SelectValue placeholder="Select faction" />
                      </SelectTrigger>
                      <SelectContent>
                        {ddFactionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleDDLock('faction')}
                    >
                      {ddLocks.faction ? <LockKeyholeIcon /> : <LockKeyholeOpenIcon />}
                    </Button>
                  </div>
                </div>

                {/* Faction Ability */}
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="dd-faction-ability-select" className="font-bold w-32">
                      Faction Ability:
                    </Label>
                    <Select
                      value={selectedDDFactionAbility}
                      onValueChange={setSelectedDDFactionAbility}
                    >
                      <SelectTrigger className="w-[20rem]">
                        <SelectValue placeholder="Select faction ability" />
                      </SelectTrigger>
                      <SelectContent>
                        {ddFactionAbilityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleDDLock('factionAbility')}
                    >
                      {ddLocks.factionAbility ? <LockKeyholeIcon /> : <LockKeyholeOpenIcon />}
                    </Button>
                  </div>
                </div>

                {/* Deity */}
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="dd-deity-select" className="font-bold w-32">
                      Deity:
                    </Label>
                    <Select value={selectedDDDeity} onValueChange={setSelectedDDDeity}>
                      <SelectTrigger className="w-[20rem]">
                        <SelectValue placeholder="Select deity" />
                      </SelectTrigger>
                      <SelectContent>
                        {ddDeityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleDDLock('deity')}
                    >
                      {ddLocks.deity ? <LockKeyholeIcon /> : <LockKeyholeOpenIcon />}
                    </Button>
                  </div>
                </div>

                {/* Class */}
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="dd-class-select" className="font-bold w-32">
                      Class:
                    </Label>
                    <Select value={selectedDDClass} onValueChange={setSelectedDDClass}>
                      <SelectTrigger className="w-[20rem]">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {ddClassOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleDDLock('class')}
                    >
                      {ddLocks.class ? <LockKeyholeIcon /> : <LockKeyholeOpenIcon />}
                    </Button>
                  </div>
                </div>

                {/* Special Ability */}
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="dd-special-ability-select" className="font-bold w-32">
                      Special Ability:
                    </Label>
                    <Select
                      value={selectedDDSpecialAbility}
                      onValueChange={setSelectedDDSpecialAbility}
                    >
                      <SelectTrigger className="w-[20rem]">
                        <SelectValue placeholder="Select special ability" />
                      </SelectTrigger>
                      <SelectContent>
                        {ddSpecialAbilityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleDDLock('specialAbility')}
                    >
                      {ddLocks.specialAbility ? <LockKeyholeIcon /> : <LockKeyholeOpenIcon />}
                    </Button>
                  </div>
                </div>

                {/* Lock/Unlock All Buttons */}
                <div className="flex gap-2 justify-center mt-6">
                  <Button variant="secondary" onClick={lockAllDD}>
                    <LockKeyholeIcon /> Lock All
                  </Button>
                  <Button variant="secondary" onClick={unlockAllDD}>
                    <LockKeyholeOpenIcon /> Unlock All
                  </Button>
                  <Button variant="default" size="lg" onClick={handleGenerateDDCharacter}>
                    Generate Character
                  </Button>
                </div>
              </Card>
            </>
          )}

          {/* Configuration Options */}
          <Card className="row radio-row text-center space-y-4 py-4 mt-4">
            <div className="col-12 col-sm-6 col-lg-3 text-left">
              <b>Game System:</b>
              <RadioGroup value={gameSystem} onValueChange={setGameSystem} className="mt-2">
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="dnd" id="dnd-radio" />
                  <Label htmlFor="dnd-radio" className="cursor-pointer">
                    D&D 5e
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="darkdawn" id="darkdawn-radio" />
                  <Label htmlFor="darkdawn-radio" className="cursor-pointer">
                    Dark Dawn
                  </Label>
                </div>
              </RadioGroup>
              <br />
            </div>
            <div className="col-12 col-sm-6 col-lg-3 text-left">
              <b>Show:</b>
              <RadioGroup value={cardType} onValueChange={setCardType} className="mt-2">
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="personality" id="personality-radio" />
                  <Label htmlFor="personality-radio" className="cursor-pointer">
                    {gameSystem === 'darkdawn' ? 'Detailed Canvas' : 'Personality'}
                  </Label>
                </div>
                {gameSystem === 'dnd' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="characteristics" id="characteristics-radio" />
                    <Label htmlFor="characteristics-radio" className="cursor-pointer">
                      Characteristics
                    </Label>
                  </div>
                )}
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="empty" id="empty-radio" />
                  <Label htmlFor="empty-radio" className="cursor-pointer">
                    {gameSystem === 'darkdawn' ? 'Simple Canvas' : 'Empty Card'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="plaintext" id="plaintext-radio" />
                  <Label htmlFor="plaintext-radio" className="cursor-pointer">
                    Plain Text
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="summary" id="summary-radio" />
                  <Label htmlFor="summary-radio" className="cursor-pointer">
                    Summary
                  </Label>
                </div>
              </RadioGroup>
              <br />
            </div>
            {gameSystem === 'dnd' && (
              <>
                <div className="col-12 col-sm-6 col-lg-3 text-left">
                  <b>Character Type:</b>
                  <RadioGroup value={characterType} onValueChange={setCharacterType} className="mt-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="either" id="either-radio" />
                      <Label htmlFor="either-radio" className="cursor-pointer">
                        Either
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="pc" id="pc-radio" />
                      <Label htmlFor="pc-radio" className="cursor-pointer">
                        Adventurer
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="npc" id="npc-radio" />
                      <Label htmlFor="npc-radio" className="cursor-pointer">
                        Civilian
                      </Label>
                    </div>
                  </RadioGroup>
                  <br />
                </div>
                <div className="col-12 col-sm-6 col-lg-3 text-left">
                  <b>Race Randomizer:</b>
                  <RadioGroup value={raceRandomizer} onValueChange={setRaceRandomizer} className="mt-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="normal" id="normal-radio" />
                      <Label htmlFor="normal-radio" className="cursor-pointer">
                        Normal
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="weighted" id="weighted-radio" />
                      <Label htmlFor="weighted-radio" className="cursor-pointer">
                        Weighted
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="weighted15" id="15x-weighted-radio" />
                      <Label htmlFor="15x-weighted-radio" className="cursor-pointer">
                        Weighted x1.5
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="weighted20" id="20x-weighted-radio" />
                      <Label htmlFor="20x-weighted-radio" className="cursor-pointer">
                        Weighted x2
                      </Label>
                    </div>
                  </RadioGroup>
                  <br />
                </div>
                <div className="col-12 col-sm-6 col-lg-3 text-left">
                  <b>Human Ethnicities:</b>
                  <RadioGroup value={ethnicityType} onValueChange={setEthnicityType} className="mt-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="standard" id="standard-radio" />
                      <Label htmlFor="standard-radio" className="cursor-pointer">
                        Standard
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="real" id="real-radio" />
                      <Label htmlFor="real-radio" className="cursor-pointer">
                        Real
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="both" id="both-radio" />
                      <Label htmlFor="both-radio" className="cursor-pointer">
                        Both
                      </Label>
                    </div>
                  </RadioGroup>
                  <br />
                </div>
              </>
            )}
          </Card>


          {/* Lock Buttons */}
          {gameSystem === 'dnd' && (
            <>
              <Card className="text-center flex items-center justify-around p-3 mt-4">
                <Button
                  variant="secondary"
                  onClick={lockAll}
                >
                  <LockKeyholeIcon/> All
                </Button>
                <Button
                  variant="secondary"
                  onClick={unlockAll}
                >
                  <LockKeyholeOpenIcon/> All
                </Button>
                <Button variant="secondary" size="lg" onClick={handleGenerateCharacter}>
                  Generate Character
                </Button>
              </Card>
              <br />
            </>
          )}

          {/* Gender and Name Input Section */}
          {gameSystem === 'dnd' && (
            <Card className="p-4 mt-4 text-left">
              <div className="npc-show row">
                <div className="col-12 col-sm-6 mb-3">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => toggleLock('traits')}>
                      {locks.traits ? <LockKeyholeIcon/> : <LockKeyholeOpenIcon/>}
                    </Button>
                    <Button type="button" variant="secondary" onClick={handleGenerateTraits}>
                      Generate Description
                    </Button>
                  </div>
                </div>
                <div className="col-12 col-sm-6 mb-3">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => toggleLock('occupation')}>
                      {locks.occupation ? <LockKeyholeIcon/> : <LockKeyholeOpenIcon/>}
                    </Button>
                    <Button type="button" variant="secondary" onClick={handleGenerateOccupation}>
                      Generate Occupation
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 mb-4">
                <div className="flex flex-col items-left gap-3">
                  <Label htmlFor="name-input">
                    <b>Name</b>
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="name-input"
                      type="text"
                      placeholder="Random"
                      className="w-[20rem]"
                    />
                    <Button type="button" variant="secondary" onClick={handleGenerateName}>
                      Generate
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                  <Label htmlFor="gendermenu">
                    <b>Gender</b>
                  </Label>
                  <div className="flex gap-2">
                    <Select value={selectedGender} onValueChange={setSelectedGender}>
                      <SelectTrigger id="gendermenu" className="w-[200px]">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Random">Random</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Nonbinary or Unknown">Nonbinary or Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="secondary" onClick={handleGenerateGender}>
                      Generate
                    </Button>
                  </div>
              </div>
              <br />
              <h3>
                Gender:{' '}
                <span id="genderheader">
                  {character.Race?.name === 'Warforged' ? 'Genderless' : character.Gender || ''}
                </span>
              </h3>
            </Card>
          )}

          {/* Character Details Columns */}
          {gameSystem === 'dnd' && (
            <Card id="character-columns" className="row mt-4 py-4">
            <div className="col-12 col-lg-4 pc-show" id="class-section">
              <div className="flex flex-col items-left gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="classmenu"><b>Class</b></Label>
                  <Button variant="secondary" size="icon" onClick={() => toggleLock('class')}>
                    {locks.class ? <LockKeyholeIcon/> : <LockKeyholeOpenIcon/>}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger id="classmenu" className="w-[200px]">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="secondary" onClick={handleGenerateClass}>
                    Generate
                  </Button>
                </div>
              </div>
              <h3>
                Class: <span id="classheader">{character.Class?.name || ''}</span>
              </h3>
              <ul id="classsection">{renderContent(character.Class, 'class')}</ul>
              <br />
            </div>
            <div
              className={characterType === 'npc' ? 'col-12' : 'col-12 col-lg-4'}
              id="race-section"
            >
              <div className="flex flex-col items-left gap-3">
                <div className="flex items-left gap-2">
                  <Label htmlFor="racemenu"><b>Race</b></Label>
                  <Button variant="secondary" size="icon" onClick={() => toggleLock('race')}>
                    {locks.race ? <LockKeyholeIcon/> : <LockKeyholeOpenIcon/>}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedRace} onValueChange={setSelectedRace}>
                    <SelectTrigger id="racemenu" className="w-[200px]">
                      <SelectValue placeholder="Select race" />
                    </SelectTrigger>
                    <SelectContent>
                      {raceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="secondary" onClick={handleGenerateRace}>
                    Generate
                  </Button>
                </div>
              </div>
              <h3>
                Race: <span id="raceheader">{character.Race?.name || ''}</span>
              </h3>
              <ul id="racesection">{renderContent(character.Race, 'race')}</ul>
              <br />
            </div>
            <div className="col-12 col-lg-4 pc-show" id="background-section">
              <div className="flex flex-col items-left gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="backgroundmenu"><b>Background</b></Label>
                  <Button variant="secondary" size="icon" onClick={() => toggleLock('background')}>
                    {locks.background ? <LockKeyholeIcon/> : <LockKeyholeOpenIcon/>}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedBackground} onValueChange={setSelectedBackground}>
                    <SelectTrigger id="backgroundmenu" className="w-[200px]">
                      <SelectValue placeholder="Select background" />
                    </SelectTrigger>
                    <SelectContent>
                      {backgroundOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="secondary" onClick={handleGenerateBackground}>
                    Generate
                  </Button>
                </div>
              </div>
              <h3>
                Background: <span id="backgroundheader">{character.Background?.name || ''}</span>
              </h3>
              <ul id="backgroundsection">{renderContent(character.Background, 'background')}</ul>
              <br />
            </div>
          </Card>
          )}


          {/* Life Section */}
          {gameSystem === 'dnd' && (
            <Card className="mb-4 mt-4 p-4">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="m-0">Life:</h3>
                <Button variant="outline" size="icon" onClick={() => toggleLock('life')}>
                  {locks.life ? <LockKeyholeIcon/> : <LockKeyholeOpenIcon/>}
                </Button>
                <Button type="button" variant="secondary" onClick={handleGenerateLife}>
                  Generate
                </Button>
              </div>
              <ul id="lifesection" style={{ minHeight: '45rem' }}>
                {renderObjectProperties(character.Life, 'life')}
              </ul>
            </Card>
          )}

          {/* Main Action Buttons and Canvas */}
          <Card className="text-center space-y-4 py-4 mt-4">
            {gameSystem === 'dnd' && (
              <div className="flex gap-2 justify-center">
                <Button onClick={handleGenerateCharacter} size="lg">
                  Generate Character
                </Button>
                <Button size="lg">
                  Randomize Card
                </Button>
              </div>
            )}

            {/* Image Upload Section */}
            <Card className="max-w-md mx-auto bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base">Character Portrait</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="file"
                  accept="image/*"
                  placeholder="Choose File"
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
                {uploadedImage && (
                  <div className="space-y-2">
                    <Button
                      variant="destructive"
                      onClick={handleClearImage}
                      className="w-full"
                    >
                      Clear Image
                    </Button>
                    <p className="text-sm text-muted-foreground">Image uploaded successfully</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div id="cardcontainer" style={{
              display: (
                cardType === 'plaintext' ||
                cardType === 'summary' ||
                (gameSystem === 'darkdawn' && !ddCharacter.Race) ||
                (gameSystem === 'dnd' && !character.Race)
              ) ? 'none' : 'block',
              justifyItems: 'center'
            }}>
              <canvas ref={canvasRef} id="canvas" width="612" height={canvasHeight} className="dnd-canvas"></canvas>
              <div>
                <a id="sourcelink" href="">
                  Character Art Source
                </a>
                <br />
                {/* Export to PDF Button - Only for Dark Dawn Simple Canvas */}
                {gameSystem === 'darkdawn' && cardType === 'empty' && ddCharacter.Race && (
                  <div className="flex justify-center mt-4">
                    <Button onClick={() => exportDarkDawnToPDF(ddCharacter)} variant="default">
                      Export to PDF
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div id="plaintext" style={{ display: cardType === 'plaintext' ? 'block' : 'none' }}>
              <textarea
                rows="50"
                cols="40"
                id="textarea"
                readOnly
                className="dnd-textarea"
                value={buildPlainText()}
              ></textarea>
            </div>
            <div id="summary" style={{ display: cardType === 'summary' ? 'block' : 'none' }}>
              <Card className="p-4 max-w-2xl mx-auto text-left">
                {/* Dark Dawn Character Summary */}
                {gameSystem === 'darkdawn' && (
                  <>
                    <h2 id="name" className="mb-4">{ddCharacter.Name || 'Unnamed Character'}</h2>
                    <div className="space-y-3">
                      {ddCharacter.Race?.name && (
                        <details className="border rounded-lg p-3">
                          <summary className="cursor-pointer font-bold">
                            Race: {ddCharacter.Race.name}
                          </summary>
                          {ddCharacter.Race.description && ddCharacter.Race.description !== 'undefined' && (
                            <p className="text-sm text-muted-foreground mt-2 ml-4">
                              {ddCharacter.Race.description}
                            </p>
                          )}
                        </details>
                      )}
                      {ddCharacter.Class?.name && (
                        <details className="border rounded-lg p-3">
                          <summary className="cursor-pointer font-bold">
                            Class: {ddCharacter.Class.name}
                          </summary>
                          {ddCharacter.Class.description && ddCharacter.Class.description !== 'undefined' && (
                            <p className="text-sm text-muted-foreground mt-2 ml-4">
                              {ddCharacter.Class.description}
                            </p>
                          )}
                        </details>
                      )}
                      {ddCharacter.Faction?.name && (
                        <details className="border rounded-lg p-3">
                          <summary className="cursor-pointer font-bold">
                            Faction: {ddCharacter.Faction.name}
                          </summary>
                          {ddCharacter.Faction.description && ddCharacter.Faction.description !== 'undefined' && (
                            <p className="text-sm text-muted-foreground mt-2 ml-4">
                              {ddCharacter.Faction.description}
                            </p>
                          )}
                        </details>
                      )}
                      {ddCharacter.Deity?.name && (
                        <details className="border rounded-lg p-3">
                          <summary className="cursor-pointer font-bold">
                            Deity: {ddCharacter.Deity.name}
                          </summary>
                          {ddCharacter.Deity.description && ddCharacter.Deity.description !== 'undefined' && (
                            <p className="text-sm text-muted-foreground mt-2 ml-4">
                              {ddCharacter.Deity.description}
                            </p>
                          )}
                        </details>
                      )}
                      {ddCharacter.SpecialAbility?.name && (
                        <details className="border rounded-lg p-3">
                          <summary className="cursor-pointer font-bold">
                            Special Ability: {ddCharacter.SpecialAbility.name}
                          </summary>
                          {ddCharacter.SpecialAbility.description && ddCharacter.SpecialAbility.description !== 'undefined' && (
                            <p className="text-sm text-muted-foreground mt-2 ml-4">
                              {ddCharacter.SpecialAbility.description}
                            </p>
                          )}
                        </details>
                      )}
                      {ddCharacter.FactionAbility?.name && (
                        <details className="border rounded-lg p-3">
                          <summary className="cursor-pointer font-bold">
                            Faction Ability: {ddCharacter.FactionAbility.name}
                          </summary>
                          {ddCharacter.FactionAbility.description && ddCharacter.FactionAbility.description !== 'undefined' && (
                            <p className="text-sm text-muted-foreground mt-2 ml-4">
                              {ddCharacter.FactionAbility.description}
                            </p>
                          )}
                        </details>
                      )}
                    </div>
                  </>
                )}

                {/* D&D Character Summary */}
                {gameSystem === 'dnd' && (
                  <>
                    <h2 id="name">{character.Name || 'Character'}</h2>
                    {character.ShortName && character.ShortName !== character.Name && (
                      <p className="text-muted-foreground mb-2">({character.ShortName})</p>
                    )}
                    <ul>
                      <li>
                        <b>Race:</b> <span id="race">{character.Race?.name || ''}</span>
                      </li>
                      <li>
                        <b>Gender:</b>{' '}
                        <span id="gender">
                          {character.Race?.name === 'Warforged' ? 'Genderless' : character.Gender || ''}
                        </span>
                      </li>
                      <li className="pc-show">
                        <b>Class:</b> <span id="class">{character.Class?.name || ''}</span>
                      </li>
                      <li className="pc-show">
                        <b>Background:</b> <span id="background">{character.Background?.name || ''}</span>
                      </li>
                      <li className="npc-show">
                        <b>Occupation:</b> <span id="occupation">{character.Occupation || ''}</span>
                      </li>
                      <li className="npc-show">
                        <b>Description:</b>
                        <ul id="npc-traits-section">{renderObjectProperties(character.NPCTraits, 'npc')}</ul>
                      </li>
                      {character.Life?.Origin && (
                        <li>
                          <b>Origin:</b>
                          <ul>{renderObjectProperties(character.Life.Origin, 'origin')}</ul>
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </Card>
            </div>
            <br />
          </Card>

          {/* Footer */}
          <div className="footer">
          </div>
        </div>
      </div>
    </div>
  );
}
