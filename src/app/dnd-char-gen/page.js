'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useCharacterData } from '@/lib/hooks/useCharacterData';
import { getUsedBooks, checkBookSpecial } from '@/lib/utils/books';
import Generate from '@/lib/generators/character';
import CardRenderer from '@/lib/utils/cardRenderer';
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

    const ethnicityOption = document.getElementById('standard-radio')?.checked
      ? 'standard'
      : document.getElementById('real-radio')?.checked
      ? 'real'
      : Math.random() < 0.5
      ? 'standard'
      : 'real';

    let raceMode = 'normal';
    if (document.getElementById('weighted-radio')?.checked) raceMode = 'weighted';
    else if (document.getElementById('15x-weighted-radio')?.checked) raceMode = 'weighted15';
    else if (document.getElementById('20x-weighted-radio')?.checked) raceMode = 'weighted20';

    const raceMenuValue = document.getElementById('racemenu')?.value || 'Random';
    const genderMenuValue = document.getElementById('gendermenu')?.value || 'Random';
    const classMenuValue = document.getElementById('classmenu')?.value || 'Random';
    const backgroundMenuValue = document.getElementById('backgroundmenu')?.value || 'Random';
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
            <h1 style={{ textAlign: 'center' }}>Loading D&D Data...</h1>
            <p style={{ textAlign: 'center' }}>Please wait while we load the character generator data.</p>
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

          <h1>D&amp;D 5e Random Character Generator</h1>
          <br />
          <div>Select which books to use:</div>

          <br />

          {/* Book Selection Grid */}
          <div className="booklist row">
            <div className="col-12 col-md-6">
              <div>
                <label>
                  <b>
                    <input id="PHBbox" type="checkbox" disabled checked readOnly />{' '}
                    Player&apos;s Handbook <sup>(PHB)</sup>
                  </b>
                </label>
              </div>
              <div>
                <label>
                  <b>
                    <input id="VGtMbox" type="checkbox" defaultChecked />{' '}
                    Volo&apos;s Guide to Monsters <sup>(VGtM)</sup>
                  </b>
                </label>
              </div>
              <div>
                <label>
                  <b>
                    <input id="MRbox" type="checkbox" defaultChecked />{' '}
                    Volo&apos;s Guide Monstrous Races <sup>(MR)</sup>
                  </b>
                </label>
              </div>
              <div>
                <label>
                  <b>
                    <input id="XGtEbox" type="checkbox" defaultChecked />{' '}
                    Xanathar&apos;s Guide to Everything <sup>(XGtE)</sup>
                  </b>
                </label>
              </div>
              <div>
                <label>
                  <b>
                    <input id="MToFbox" type="checkbox" defaultChecked />{' '}
                    Mordenkainen&apos;s Tome of Foes <sup>(MToF)</sup>
                  </b>
                </label>
              </div>
              <div>
                <label>
                  <b>
                    <input id="TCoEbox" type="checkbox" defaultChecked />{' '}
                    Tasha&apos;s Cauldron of Everything <sup>(TCoE)</sup>
                  </b>
                </label>
              </div>
              <div>
                <label>
                  <b>
                    <input id="EEbox" type="checkbox" defaultChecked />{' '}
                    Elemental Evil Player&apos;s Companion <sup>(EE)</sup>
                  </b>
                </label>
              </div>
              <div>
                <label>
                  <b>
                    <input id="SCAGbox" type="checkbox" defaultChecked />{' '}
                    Sword Coast Adventurer&apos;s Guide <sup>(SCAG)</sup>
                  </b>
                </label>
              </div>
              <div>
                <label>
                  <b>
                    <input id="DMGbox" type="checkbox" /> Dungeon Master&apos;s Guide{' '}
                    <sup>(DMG)</sup>
                  </b>
                </label>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div>
                <label>
                  <b>
                    <input id="Modbox" type="checkbox" /> Adventure Modules <sup>(Mod)</sup>
                  </b>
                </label>
              </div>
              <div>
                <label>
                  <b>
                    <input id="EBRbox" type="checkbox" /> Eberron: Rising from the Last War{' '}
                    <sup>(EBR)</sup>
                  </b>
                </label>
              </div>
              <div>
                <label>
                  <b>
                    <input id="EGtWbox" type="checkbox" /> Explorer&apos;s Guide to Wildemount{' '}
                    <sup>(EGtW)</sup>
                  </b>
                </label>
              </div>
              <div>
                <label>
                  <b>
                    <input id="GGtRbox" type="checkbox" /> Guildmaster&apos;s Guide to Ravnica{' '}
                    <sup>(GGtR)</sup>
                  </b>
                </label>
              </div>
              <div>
                <label>
                  <b>
                    <input id="MOoTbox" type="checkbox" /> Mythic Odysseys of Theros{' '}
                    <sup>(MOoT)</sup>
                  </b>
                </label>
              </div>
              <div>
                <label>
                  <b>
                    <input id="AIbox" type="checkbox" /> Acquisitions Incorporated{' '}
                    <sup>(AI)</sup>
                  </b>
                </label>
              </div>
              <div>
                <label>
                  <b>
                    <input id="Otherbox" type="checkbox" /> Other Notable Content{' '}
                    <sup>(Other)</sup>
                  </b>
                </label>
              </div>
              <div>
                <label>
                  <b>
                    <input id="UAbox" type="checkbox" /> Unearthed Arcana <sup>(UA)</sup>
                  </b>
                </label>
              </div>
            </div>
          </div>

          <hr />

          {/* Main Action Buttons and Canvas */}
          <div style={{ textAlign: 'center' }}>
            <button type="button" className="dnd-button" onClick={handleGenerateCharacter}>
              Generate Character
            </button>
            <button type="button" className="dnd-button">
              Randomize Card
            </button>
            <br />
            <br />

            {/* Image Upload Section */}
            <div style={{ marginBottom: '20px' }}>
              <label className="dnd-label">
                <b>Character Portrait:</b>
                <br />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="dnd-input"
                  style={{ width: 'auto', marginTop: '5px' }}
                />
              </label>
              {uploadedImage && (
                <>
                  <br />
                  <button
                    type="button"
                    className="dnd-button"
                    onClick={handleClearImage}
                    style={{ marginTop: '5px' }}
                  >
                    Clear Image
                  </button>
                  <br />
                  <small style={{ color: '#666' }}>Image uploaded successfully</small>
                </>
              )}
            </div>

            <div id="cardcontainer" style={{ display: cardType === 'plaintext' ? 'none' : 'block' }}>
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
          </div>

          <hr />

          {/* Configuration Options */}
          <div className="row radio-row">
            <div className="col-12 col-sm-6 col-lg-3">
              <b>Show:</b>
              <div>
                <label>
                  <input
                    id="personality-radio"
                    type="radio"
                    name="show-button"
                    value="personality"
                    checked={cardType === 'personality'}
                    onChange={(e) => setCardType(e.target.value)}
                  />{' '}
                  Personality{' '}
                </label>
              </div>
              <div>
                <label>
                  <input
                    id="characteristics-radio"
                    type="radio"
                    name="show-button"
                    value="characteristics"
                    checked={cardType === 'characteristics'}
                    onChange={(e) => setCardType(e.target.value)}
                  />{' '}
                  Characteristics{' '}
                </label>
              </div>
              <div>
                <label>
                  <input
                    id="empty-radio"
                    type="radio"
                    name="show-button"
                    value="empty"
                    checked={cardType === 'empty'}
                    onChange={(e) => setCardType(e.target.value)}
                  />{' '}
                  Empty Card{' '}
                </label>
              </div>
              <div>
                <label>
                  <input
                    id="plaintext-radio"
                    type="radio"
                    name="show-button"
                    value="plaintext"
                    checked={cardType === 'plaintext'}
                    onChange={(e) => setCardType(e.target.value)}
                  />{' '}
                  Plain Text{' '}
                </label>
              </div>
              <br />
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <b>Character Type:</b>
              <div>
                <label>
                  <input
                    id="either-radio"
                    type="radio"
                    name="character-type-button"
                    value="either"
                    checked={characterType === 'either'}
                    onChange={(e) => setCharacterType(e.target.value)}
                  />{' '}
                  Either{' '}
                </label>
              </div>
              <div>
                <label>
                  <input
                    id="pc-radio"
                    type="radio"
                    name="character-type-button"
                    value="pc"
                    checked={characterType === 'pc'}
                    onChange={(e) => setCharacterType(e.target.value)}
                  />{' '}
                  Adventurer{' '}
                </label>
              </div>
              <div>
                <label>
                  <input
                    id="npc-radio"
                    type="radio"
                    name="character-type-button"
                    value="npc"
                    checked={characterType === 'npc'}
                    onChange={(e) => setCharacterType(e.target.value)}
                  />{' '}
                  Civilian{' '}
                </label>
              </div>
              <br />
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <b>Race Randomizer:</b>
              <div>
                <label>
                  <input
                    id="normal-radio"
                    type="radio"
                    name="race-randomizer-button"
                    defaultChecked
                  />{' '}
                  Normal{' '}
                </label>
              </div>
              <div>
                <label>
                  <input id="weighted-radio" type="radio" name="race-randomizer-button" />{' '}
                  Weighted{' '}
                </label>
              </div>
              <div>
                <label>
                  <input id="15x-weighted-radio" type="radio" name="race-randomizer-button" />{' '}
                  Weighted x1.5{' '}
                </label>
              </div>
              <div>
                <label>
                  <input id="20x-weighted-radio" type="radio" name="race-randomizer-button" />{' '}
                  Weighted x2{' '}
                </label>
              </div>
              <br />
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <b>Human Ethnicities:</b>
              <div>
                <label>
                  <input
                    id="standard-radio"
                    type="radio"
                    name="ethnicity-button"
                    defaultChecked
                  />{' '}
                  Standard{' '}
                </label>
              </div>
              <div>
                <label>
                  <input id="real-radio" type="radio" name="ethnicity-button" /> Real{' '}
                </label>
              </div>
              <div>
                <label>
                  <input id="both-radio" type="radio" name="ethnicity-button" /> Both{' '}
                </label>
              </div>
              <br />
            </div>
          </div>

          <hr />

          {/* Lock Buttons */}
          <div style={{ textAlign: 'center' }}>
            <button
              className="lock-button"
              id="all-lock-button"
              style={{ width: '4rem' }}
              onClick={lockAll}
            >
              🔒 All
            </button>
            <button
              className="lock-button"
              id="none-lock-button"
              style={{ width: '4rem' }}
              onClick={unlockAll}
            >
              🔓 All
            </button>
            <br />
            <button type="button" className="dnd-button" onClick={handleGenerateCharacter}>
              Generate Character
            </button>
          </div>
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

          <br />
          <hr />

          {/* Gender and Name Input Section */}
          <div style={{ textAlign: 'center' }}>
            <div className="npc-show row" style={{ maxWidth: '30rem', margin: 'auto' }}>
              <div className="col-12 col-sm-6">
                <button className="lock-button" onClick={() => toggleLock('traits')}>
                  {locks.traits ? '🔒' : '🔓'}
                </button>
                <button type="button" className="dnd-button">
                  Generate Description
                </button>
              </div>
              <div className="col-12 col-sm-6">
                <button className="lock-button" onClick={() => toggleLock('occupation')}>
                  {locks.occupation ? '🔒' : '🔓'}
                </button>
                <button type="button" className="dnd-button">
                  Generate Occupation
                </button>
              </div>
            </div>

            <div>
              <br className="small-only-br" />
              <div style={{ width: '100%' }}>
                <label htmlFor="name-input">
                  <b>Name: </b>
                </label>
                <input
                  id="name-input"
                  type="text"
                  placeholder="Random"
                  style={{ maxWidth: '20rem' }}
                  className="dnd-input"
                />
                <button type="button" className="dnd-button" onClick={handleGenerateName}>
                  Generate
                </button>
              </div>
              <br className="small-only-br" />
              <div>
                <label htmlFor="gendermenu">
                  <b>Gender: </b>
                </label>
                <br className="small-only-br" />
                <select className="dnd-select" id="gendermenu">
                  <option value="Random">Random</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Nonbinary or Unknown">Nonbinary or Unknown</option>
                </select>
                <button type="button" className="dnd-button" onClick={handleGenerateGender}>
                  Generate
                </button>
              </div>
            </div>
            <br />
            <h3>
              Gender:{' '}
              <span id="genderheader">
                {character.Race?.name === 'Warforged' ? 'Genderless' : character.Gender || ''}
              </span>
            </h3>
          </div>

          {/* Character Details Columns */}
          <div id="character-columns" className="row">
            <div className="col-12 col-lg-4 pc-show" id="class-section">
              <div style={{ textAlign: 'center' }}>
                <label htmlFor="classmenu">
                  <b>Class: </b>
                </label>
                <br className="sometimes-br" />
                <button className="lock-button" onClick={() => toggleLock('class')}>
                  {locks.class ? '🔒' : '🔓'}
                </button>
                <select className="dnd-select" id="classmenu">
                  {classOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button type="button" className="dnd-button" onClick={handleGenerateClass}>
                  Generate
                </button>
                <br />
                <br />
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
              <div style={{ textAlign: 'center' }}>
                <label htmlFor="racemenu">
                  <b>Race: </b>
                </label>
                <br className="sometimes-br" />
                <button className="lock-button" onClick={() => toggleLock('race')}>
                  {locks.race ? '🔒' : '🔓'}
                </button>
                <select className="dnd-select" id="racemenu">
                  {raceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button type="button" className="dnd-button" onClick={handleGenerateRace}>
                  Generate
                </button>
                <br />
                <br />
              </div>
              <h3>
                Race: <span id="raceheader">{character.Race?.name || ''}</span>
              </h3>
              <ul id="racesection">{renderContent(character.Race, 'race')}</ul>
              <br />
            </div>
            <div className="col-12 col-lg-4 pc-show" id="background-section">
              <div style={{ textAlign: 'center' }}>
                <label htmlFor="backgroundmenu">
                  <b>Background: </b>
                </label>
                <br className="sometimes-br" />
                <button className="lock-button" onClick={() => toggleLock('background')}>
                  {locks.background ? '🔒' : '🔓'}
                </button>
                <select className="dnd-select" id="backgroundmenu">
                  {backgroundOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button type="button" className="dnd-button" onClick={handleGenerateBackground}>
                  Generate
                </button>
                <br />
                <br />
              </div>
              <h3>
                Background: <span id="backgroundheader">{character.Background?.name || ''}</span>
              </h3>
              <ul id="backgroundsection">{renderContent(character.Background, 'background')}</ul>
              <br />
            </div>
          </div>

          <hr />

          {/* Life Section */}
          <div>
            <h3 style={{ display: 'inline', marginRight: '30px' }}>Life:</h3>
            <button className="lock-button" onClick={() => toggleLock('life')}>
              {locks.life ? '🔒' : '🔓'}
            </button>
            <button type="button" className="dnd-button">
              Generate
            </button>
            <br />
            <br />
            <ul id="lifesection" style={{ minHeight: '45rem' }}>
              {renderObjectProperties(character.Life, 'life')}
            </ul>
            <br />
          </div>
          {/* Footer */}
          <div className="footer">
          </div>
        </div>
      </div>
    </div>
  );
}
