'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useCharacterData } from '@/lib/hooks/useCharacterData';
import { getUsedBooks, checkBookSpecial } from '@/lib/utils/books';
import Generate from '@/lib/generators/character';
import CardRenderer from '@/lib/utils/cardRenderer';
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
  // Load JSON data
  const { data, loading, error } = useCharacterData();

  // Character state
  const [character, setCharacter] = useState({});
  const [prevCharacters, setPrevCharacters] = useState([]);

  // Configuration state
  const [characterType, setCharacterType] = useState('either');
  const [cardType, setCardType] = useState('personality'); // personality, characteristics, or plaintext
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
   * Render canvas when character or card type changes
   */
  useEffect(() => {
    if (!data || !character.Race || !canvasRef.current || cardType === 'plaintext') return;

    CardRenderer.render(canvasRef.current, character, characterType, usedBooks, cardType, uploadedImage);
  }, [character, cardType, data, characterType, uploadedImage, usedBooks]);

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

    context.character = {};
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

  // Show loading state
  if (loading) {
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
  if (error) {
    return (
      <div className="char-gen-body">
        <div className="dnd-container">
          <div className="dnd-content">
            <h1 style={{ textAlign: 'center', color: 'darkred' }}>Error Loading Data</h1>
            <p style={{ textAlign: 'center' }}>{error}</p>
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


          {/* Main Action Buttons and Canvas */}
          <Card className="text-center space-y-4 py-4">
            <div className="flex gap-2 justify-center">
              <Button onClick={handleGenerateCharacter} size="lg">
                Generate Character
              </Button>
              <Button size="lg">
                Randomize Card
              </Button>
            </div>

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

            <div id="cardcontainer" style={{ display: cardType === 'plaintext' ? 'none' : 'block', justifyItems: 'center'}}>
              <canvas ref={canvasRef} id="canvas" width="612" height="792" className="dnd-canvas"></canvas>
              <div>
                <a id="sourcelink" href="">
                  Character Art Source
                </a>
                <br />
              </div>
            </div>
            <div id="plaintext" style={{ display: cardType === 'plaintext' ? 'block' : 'none' }}>
              <textarea
                rows="50"
                cols="40"
                id="textarea"
                readOnly
                className="dnd-textarea"
                value={character.Name ? `${character.Name}\n\nRace: ${character.Race?.name || 'Unknown'}\nClass: ${character.Class?.name || 'Unknown'}\nBackground: ${character.Background?.name || 'Unknown'}\nGender: ${character.Gender || 'Unknown'}` : ''}
              ></textarea>
            </div>
            <br />
          </Card>

          {/* Configuration Options */}
          <Card className="row radio-row text-center space-y-4 py-4 mt-4">
            <div className="col-12 col-sm-6 col-lg-3 text-left">
              <b>Show:</b>
              <RadioGroup value={cardType} onValueChange={setCardType} className="mt-2">
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="personality" id="personality-radio" />
                  <Label htmlFor="personality-radio" className="cursor-pointer">
                    Personality
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="characteristics" id="characteristics-radio" />
                  <Label htmlFor="characteristics-radio" className="cursor-pointer">
                    Characteristics
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="empty" id="empty-radio" />
                  <Label htmlFor="empty-radio" className="cursor-pointer">
                    Empty Card
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="plaintext" id="plaintext-radio" />
                  <Label htmlFor="plaintext-radio" className="cursor-pointer">
                    Plain Text
                  </Label>
                </div>
              </RadioGroup>
              <br />
            </div>
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
          </Card>


          {/* Lock Buttons */}
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

          {/* Character Info Summary */}
          <h2 id="name">{character.Name || 'Character'}</h2>
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
          </ul>



          {/* Gender and Name Input Section */}
          <Card className="p-4 mt-4 text-left">
            <div className="npc-show row">
              <div className="col-12 col-sm-6 mb-3">
                <div className="flex items-center justify-center gap-2">
                  <Button variant="secondary" size="icon" onClick={() => toggleLock('traits')}>
                    {locks.traits ? <LockKeyholeIcon/> : <LockKeyholeOpenIcon/>}
                  </Button>
                  <Button type="button" variant="secondary">
                    Generate Description
                  </Button>
                </div>
              </div>
              <div className="col-12 col-sm-6 mb-3">
                <div className="flex items-center justify-center gap-2">
                  <Button variant="secondary" size="icon" onClick={() => toggleLock('occupation')}>
                    {locks.occupation ? <LockKeyholeIcon/> : <LockKeyholeOpenIcon/>}
                  </Button>
                  <Button type="button" variant="secondary">
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

          {/* Character Details Columns */}
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


          {/* Life Section */}
          <Card className="mb-4 mt-4 p-4">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="m-0">Life:</h3>
              <Button variant="secondary" size="icon" onClick={() => toggleLock('life')}>
                {locks.life ? <LockKeyholeIcon/> : <LockKeyholeOpenIcon/>}
              </Button>
              <Button type="button" variant="secondary">
                Generate
              </Button>
            </div>
            <ul id="lifesection" style={{ minHeight: '45rem' }}>
              {renderObjectProperties(character.Life, 'life')}
            </ul>
          </Card>
          {/* Footer */}
          <div className="footer">
          </div>
        </div>
      </div>
    </div>
  );
}
