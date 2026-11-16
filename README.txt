ABANDONED, NOT FORGOTTEN — PROJECT GUIDE

FILES
- index.html      Homepage: short summary of the site, animated meteor / star background
- explorer.html   NASA technology: new readings about NASA instruments, telescopes and spacecraft (search + filter)
- archive.html    The full record: all stories with every detail
- story.html      Individual story page (opens with ?id=...)
- footprints.html  Leave your footprint on the Moon (name + boot print + color, saved in the browser)
- footprints.js    Logic of the footprints page
- game.html       Mars Rescue Scan 3D game, 4-chapter journey: Moon, Mars rovers, Mars landers, Deep space; fullscreen; data ideas from NASA NSSDCA, three.js from cdnjs (needs internet) (robot assistant ROVA; uses the Mars stories from the archive)
- lab.html        Interactive quiz and learning facts
- sources.html    NASA reference links
- admin.html      Demo admin login and content editor
- data.js         Default story data + NASA_TECH (the Explorer readings)
- app.js          Site behavior, animations, local storage and admin functions (normal mouse cursor)
- extras.js      Game extras: Salvage Challenge relic data (20 items NASA left in space), Settings panel (rebind keys, camera, volumes) and procedural game audio (music + effects)
- sound.js       Space-style hover sounds (Web Audio, one sound per group; speaker button turns them off)
- i18n.js         Arabic/English translation of the whole site (add new sentences to DICT). Language is remembered.
- styles.css      Dark space design and responsive layout

HOW TO RUN
1. Extract the ZIP to a normal folder (do not open files from inside the ZIP).
2. Open index.html in Chrome or Edge.
3. Click "Admin access" in the footer or open admin.html.
4. Demo credentials:
   Username: admin
   Password: space2026
5. Add/edit/delete stories, add an image URL or upload an image (up to 2 MB), and press Save story.

IMPORTANT LIMITATION
This is a static HTML/CSS/JavaScript demo intended to work by double-clicking index.html.
Admin edits are saved in the current browser's localStorage. They do not sync to other devices,
do not update the source files, and are not secure server-side authentication. Clearing browser
data may remove saved changes. For a public website with secure login and shared changes, use
a backend such as Flask/Node plus a database and upload storage.

NOTES
- The page uses remote Unsplash image URLs and Google Fonts, so those images/fonts need internet.
- The NASA links are reference starting points. Verify exact mission details against primary sources
  before presenting the project as a scientific archive.
- The English/Arabic button translates the main navigation labels as a small demo; full bilingual
  story content can be added through the admin content fields or future localization work.

SALVAGE CHALLENGE (game.html)
- 20 relics (debris and old tools NASA left in space), 5 per chapter. Drive over the pink beam to collect one: +4 seconds.
- Progress is saved in the browser (localStorage key anf_relics). Collected relics do not appear again; see them in the Salvage log under the game.
- Settings (gear button or key O): rebind every key (2 slots each), camera sensitivity, invert look, on-screen buttons, master/music/effects/interface volumes, mute.
- To add a relic: add a line to RELICS in extras.js and its Arabic text to DICT in i18n.js.

SHIP, DAY/NIGHT AND ROVA AI (new)
- Every chapter starts with the rover being lowered from the landing ship (green beam). The ship is your charger (battery) and your shelter.
- When the storm/night warning comes (or the battery is low) a green arrow points to the ship. Be within range of the ship when time runs out: you rest inside, progress is kept, and you continue in the morning (max 3 days per chapter). If you are caught outside, the mission fails.
- ai.js: "Ask ROVA" button (bottom of the game). ROVA remembers the mission log (scans, relics, hazards, nights, battery) and answers in Arabic or English about it, about any mission object, and about the NASA stories. The game pauses while the chat is open.
- Optional: press the key button inside the chat and paste a Gemini API key (kept only in your browser) to get free-form AI answers that still know your game log. Without a key, ROVA answers from the built-in knowledge.

SHOP, COINS, CLAUDE AND GRAPHICS (v11)
- shop.js: coins come from gold coins on the ground, samples (+3), scans (+25), relics (+15) and chapter wins (+50). Shop (button next to ROVA, or on the start/night overlay) sells rover upgrades (speed, battery efficiency, scanner speed, coin magnet) and ship upgrades (charger, charging range, extra day). Saved in this browser.
- ROVA chat: press the key button and paste a Claude API key (sk-ant...) to talk to Claude about any NASA topic, or a Gemini key. The key stays in your browser only; do not publish the site publicly with a key inside.
- Graphics: planet/moon in the sky per chapter, striped red-rock mesas on Mars (also obstacles), rover tire/foot tracks, coin pickups, slightly higher exposure.

SHIP AND ROVER (v12)
- New detailed landing ship: cargo deck with the rover parked on it, crew module with panel texture and lit windows, fuel tanks, solar wings, engine, 4 legs that follow the terrain, beacon light and a lamp that gets stronger at night.
- At the start of each day the ship lowers a ramp (bridge) and the rover drives down it. At night the rover is parked back on the deck.
- New rover model: white body with gold blanket, mast camera, dish antenna, arm, RTG with fins, rocker-bogie suspension and treaded wheels.
