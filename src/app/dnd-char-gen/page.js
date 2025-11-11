import './dnd-char-gen.css';

export const metadata = {
  title: 'D&D 5e Character Generator',
  description: 'D&D 5e Random Character Generator',
};

export default function CharacterGeneratorPage() {
  return (
    <div className="char-gen-body">
      <div className="dnd-container">
        <div className="dnd-content">
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
            <button type="button" className="dnd-button">
              Generate Character
            </button>
            <button type="button" className="dnd-button">
              Randomize Card
            </button>
            <br />
            <br />
            <div id="cardcontainer">
              <canvas id="canvas" width="612" height="792" className="dnd-canvas"></canvas>
              <div>
                <a id="sourcelink" href="">
                  Character Art Source
                </a>
                <br />
              </div>
            </div>
            <div id="plaintext">
              <textarea
                rows="50"
                cols="40"
                id="textarea"
                readOnly
                className="dnd-textarea"
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
                    defaultChecked
                  />{' '}
                  Personality{' '}
                </label>
              </div>
              <div>
                <label>
                  <input id="characteristics-radio" type="radio" name="show-button" />{' '}
                  Characteristics{' '}
                </label>
              </div>
              <div>
                <label>
                  <input id="empty-radio" type="radio" name="show-button" /> Empty Card{' '}
                </label>
              </div>
              <div>
                <label>
                  <input id="plaintext-radio" type="radio" name="show-button" /> Plain Text{' '}
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
                    defaultChecked
                  />{' '}
                  Either{' '}
                </label>
              </div>
              <div>
                <label>
                  <input id="pc-radio" type="radio" name="character-type-button" /> Adventurer{' '}
                </label>
              </div>
              <div>
                <label>
                  <input id="npc-radio" type="radio" name="character-type-button" /> Civilian{' '}
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
            <button className="lock-button" id="all-lock-button" style={{ width: '4rem' }}>
              🔒 All
            </button>
            <button className="lock-button" id="none-lock-button" style={{ width: '4rem' }}>
              🔓 All
            </button>
            <br />
            <button type="button" className="dnd-button">
              Generate Character
            </button>
          </div>
          <br />

          {/* Character Info Summary */}
          <h2 id="name">Character</h2>
          <ul>
            <li>
              <b>Race:</b> <span id="race"></span>
            </li>
            <li>
              <b>Gender:</b> <span id="gender"></span>
            </li>
            <li className="pc-show">
              <b>Class:</b> <span id="class"></span>
            </li>
            <li className="pc-show">
              <b>Background:</b> <span id="background"></span>
            </li>
            <li className="npc-show">
              <b>Occupation:</b> <span id="occupation"></span>
            </li>
            <li className="npc-show">
              <b>Description:</b>
              <ul id="npc-traits-section"></ul>
            </li>
          </ul>

          <br />
          <hr />

          {/* Gender and Name Input Section */}
          <div style={{ textAlign: 'center' }}>
            <div className="npc-show row" style={{ maxWidth: '30rem', margin: 'auto' }}>
              <div className="col-12 col-sm-6">
                <button className="lock-button">🔓</button>
                <button type="button" className="dnd-button">
                  Generate Description
                </button>
              </div>
              <div className="col-12 col-sm-6">
                <button className="lock-button">🔓</button>
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
                <button type="button" className="dnd-button">
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
                <button type="button" className="dnd-button">
                  Generate
                </button>
              </div>
            </div>
            <br />
            <h3>
              Gender: <span id="genderheader"></span>
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
                <button className="lock-button">🔓</button>
                <select className="dnd-select" id="classmenu">
                  <option value="">Random</option>
                </select>
                <button type="button" className="dnd-button">
                  Generate
                </button>
                <br />
                <br />
              </div>
              <h3>
                Class: <span id="classheader"></span>
              </h3>
              <ul id="classsection"></ul>
              <br />
            </div>
            <div className="col-12 col-lg-4" id="race-section">
              <div style={{ textAlign: 'center' }}>
                <label htmlFor="racemenu">
                  <b>Race: </b>
                </label>
                <br className="sometimes-br" />
                <button className="lock-button">🔓</button>
                <select className="dnd-select" id="racemenu">
                  <option value="">Random</option>
                </select>
                <button type="button" className="dnd-button">
                  Generate
                </button>
                <br />
                <br />
              </div>
              <h3>
                Race: <span id="raceheader"></span>
              </h3>
              <ul id="racesection"></ul>
              <br />
            </div>
            <div className="col-12 col-lg-4 pc-show" id="background-section">
              <div style={{ textAlign: 'center' }}>
                <label htmlFor="backgroundmenu">
                  <b>Background: </b>
                </label>
                <br className="sometimes-br" />
                <button className="lock-button">🔓</button>
                <select className="dnd-select" id="backgroundmenu">
                  <option value="">Random</option>
                </select>
                <button type="button" className="dnd-button">
                  Generate
                </button>
                <br />
                <br />
              </div>
              <h3>
                Background: <span id="backgroundheader"></span>
              </h3>
              <ul id="backgroundsection"></ul>
              <br />
            </div>
          </div>

          <hr />

          {/* Life Section */}
          <div>
            <h3 style={{ display: 'inline', marginRight: '30px' }}>Life:</h3>
            <button className="lock-button">🔓</button>
            <button type="button" className="dnd-button">
              Generate
            </button>
            <br />
            <br />
            <ul id="lifesection" style={{ minHeight: '45rem' }}></ul>
            <br />
            <sub>
              Refer to Xanathar&apos;s Guide (starting on page 61) for supplementary tables.
            </sub>
          </div>

          {/* Footer */}
          <div className="footer">
            <a href="https://github.com/Tetra-cube/Tetra-cube.github.io">GitHub Repo</a>
          </div>
        </div>
      </div>
    </div>
  );
}
