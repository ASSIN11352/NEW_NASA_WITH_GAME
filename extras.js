// Salvage challenge data + Settings panel (controls & sound) + game audio for game.html
// Everything is procedural (Web Audio), no audio files needed.
(() => {
const LS = localStorage, $ = s => document.querySelector(s);
const jp = s => { try { return JSON.parse(s); } catch (e) { return null; } };

// ---------- RELICS: debris and old tools NASA left in space (c = chapter index) ----------
const R = (c, id, n, k, col, sc, f) => ({ c, id, n, k, col, sc, f });
const RELICS = [
  R(0, "golf", "Apollo 14 golf balls", "sphere", 0xf2f2f2, 2.6, "Alan Shepard swung a golf club on the Moon in 1971. His golf balls stayed there."),
  R(0, "hassel", "Hasselblad camera", "cam", 0x3a3d45, 3.4, "Astronauts took photos on the Moon, then left the cameras behind and carried home only the film."),
  R(0, "backpack", "Life-support backpack", "pack", 0xd9dde6, 3.2, "Apollo 11 astronauts left their backpacks on the Moon to make the ship lighter for the trip home."),
  R(0, "fallen", "Fallen Astronaut memorial", "fig", 0xc9ccd4, 3.4, "A tiny aluminum figure left by Apollo 15 honors astronauts and cosmonauts who died."),
  R(0, "goodwill", "Goodwill message disc", "disc", 0xb9c2d6, 3.2, "Apollo 11 left a small silicon disc with messages from leaders of many countries."),
  R(1, "heatshield", "Opportunity's heat shield", "shield", 0x6b4a3a, 3.2, "The shield that protected Opportunity during landing was found lying on the ground, close to the rover."),
  R(1, "parachute", "Perseverance parachute", "chute", 0xff7a2a, 3.2, "Its orange and white pattern hides a secret message written in binary code."),
  R(1, "skycrane", "Curiosity descent stage", "crane", 0xcaa24a, 3, "After lowering Curiosity on cables, this rocket stage flew away and crashed nearby."),
  R(1, "wright", "Wright Flyer fabric", "fabric", 0xe8d9b0, 3.4, "Ingenuity carried a tiny piece of cloth from the first airplane, the 1903 Wright Flyer."),
  R(1, "rat", "Rock Abrasion Tool", "tool", 0xcaa24a, 3.4, "Spirit and Opportunity used grinding tools like this to look inside Martian rocks."),
  R(2, "mole", "InSight's digging mole", "mole", 0xb9bfcc, 3.4, "This probe was meant to hammer itself into the ground to measure heat, but it got stuck."),
  R(2, "backshell", "Phoenix landing shell", "shell", 0xf0f0f0, 3, "Phoenix's shell and parachute helped slow it down. A camera in orbit photographed them."),
  R(2, "vikarm", "Viking sampler arm", "arm", 0xc9ccd4, 3.2, "Viking's robot arm scooped up Martian soil for the first experiments searching for life."),
  R(2, "dome", "InSight seismometer dome", "dome", 0xc9ccd4, 3.2, "A shield like this covered InSight's seismometer to protect it from wind and temperature changes."),
  R(2, "phxdvd", "Phoenix DVD", "disc", 0x7fd6ff, 3.2, "Phoenix carried a DVD of messages and stories from Earth, meant for future visitors."),
  R(3, "plaque", "Pioneer plaque", "plaque", 0xcaa24a, 3.2, "A gold-colored plaque shows where we live, as a greeting to anyone who finds Pioneer."),
  R(3, "rtg", "Pioneer nuclear battery", "rtg", 0x4a4f5c, 3.2, "Far from the Sun, Pioneer made power from heat, using small nuclear generators."),
  R(3, "ion", "Dawn ion thruster", "ion", 0x5ec8ff, 3.4, "Dawn used a gentle blue-glowing engine that pushed it using xenon gas."),
  R(3, "kcam", "Kepler's planet-hunting camera", "phot", 0x9aa4b8, 3.2, "Kepler's camera watched over 150,000 stars at once to spot planets passing in front."),
  R(3, "gamma", "NEAR gamma-ray spectrometer", "spec", 0xcaa24a, 3.2, "After NEAR landed on Eros, this instrument kept working and sent data home for about two weeks.")
];

// ---------- SETTINGS ----------
const ACTIONS = [
  ["u", "Move forward"], ["d", "Move backward"], ["l", "Turn left"], ["r", "Turn right"],
  ["s", "Scan"], ["q", "Rotate camera left"], ["e", "Rotate camera right"],
  ["hint", "Hint"], ["fs", "Fullscreen"], ["set", "Open settings"]
];
const DEF_KEYS = { u: ["ArrowUp", "KeyW"], d: ["ArrowDown", "KeyS"], l: ["ArrowLeft", "KeyA"], r: ["ArrowRight", "KeyD"],
  s: ["Space", ""], q: ["KeyQ", ""], e: ["KeyE", ""], hint: ["KeyH", ""], fs: ["KeyF", ""], set: ["KeyO", ""] };
const DEF_SND = { m: .8, mu: .5, fx: .8, ui: .6 };
const clone = o => JSON.parse(JSON.stringify(o));
const saved = jp(LS.getItem("anf_game_settings")) || {};
const S = {
  keys: Object.assign(clone(DEF_KEYS), saved.keys || {}),
  sens: saved.sens ?? 1, inv: !!saved.inv, pad: saved.pad !== false,
  vol: Object.assign(clone(DEF_SND), saved.vol || {}),
  mute: LS.getItem("muted") === "1"
};
let codeMap = {};
const rebuild = () => { codeMap = {}; for (const a in S.keys) S.keys[a].forEach(c => { if (c) codeMap[c] = a; }); };
rebuild();
const save = () => LS.setItem("anf_game_settings", JSON.stringify({ keys: S.keys, sens: S.sens, inv: S.inv, pad: S.pad, vol: S.vol }));

// ---------- RELIC PROGRESS (saved in this browser) ----------
let owned = new Set(jp(LS.getItem("anf_relics")) || []);
const saveOwned = () => LS.setItem("anf_relics", JSON.stringify([...owned]));

// ---------- GAME AUDIO ----------
const A = {
  ctx: null, windF: null, theme: null, tmr: 0, nodes: [], lastTick: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const c = this.ctx = new C();
    this.mg = c.createGain(); this.mu = c.createGain(); this.fx = c.createGain();
    const dl = c.createDelay(1), fb = c.createGain(), wet = c.createGain();
    dl.delayTime.value = .45; fb.gain.value = .4; wet.gain.value = .35;
    this.mu.connect(this.mg); this.mu.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(this.mg);
    this.fx.connect(this.mg); this.mg.connect(c.destination);
    const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = b; s.loop = true;
    this.windF = c.createBiquadFilter(); this.windF.type = "bandpass"; this.windF.frequency.value = 500; this.windF.Q.value = .6;
    this.windG = c.createGain(); this.windG.gain.value = 0;
    s.connect(this.windF); this.windF.connect(this.windG); this.windG.connect(this.fx); s.start();
    this.engO = c.createOscillator(); this.engO.type = "triangle"; this.engO.frequency.value = 55;
    this.engG = c.createGain(); this.engG.gain.value = 0; this.engO.connect(this.engG); this.engG.connect(this.fx); this.engO.start();
    this.vol();
  },
  vol() {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    this.mg.gain.setTargetAtTime(S.mute ? 0 : S.vol.m, t, .05);
    this.mu.gain.setTargetAtTime(S.vol.mu, t, .05);
    this.fx.gain.setTargetAtTime(S.vol.fx, t, .05);
  },
  tone(f, to, dur, vol, type, at) {
    const c = this.ctx; if (!c) return; const t = c.currentTime + (at || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol || .1, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(this.fx); o.start(t); o.stop(t + dur + .05);
  },
  noise(dur, f0, f1, vol) {
    const c = this.ctx; if (!c) return; const t = c.currentTime, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = "lowpass";
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.fx); s.start(t);
  },
  // ambient music: slow drone + sparse bell notes, a different scale for each world
  music(th) {
    this.stopMusic(); const c = this.ctx; if (!c) return;
    const sc = { moon: [220, 261.6, 329.6, 392, 440], mars: [146.8, 174.6, 220, 261.6, 293.7], ast: [261.6, 329.6, 392, 523.3, 659.3] }[th] || [220, 261.6, 329.6, 392, 440];
    const root = sc[0] / 2, flt = c.createBiquadFilter(), lfo = c.createOscillator(), lg = c.createGain(), master = c.createGain();
    flt.type = "lowpass"; flt.frequency.value = 500; lfo.frequency.value = .07; lg.gain.value = 180; lfo.connect(lg); lg.connect(flt.frequency);
    master.gain.value = 0; master.gain.setTargetAtTime(1, c.currentTime, 1.2); flt.connect(master); master.connect(this.mu);
    const oscs = [[root, "sawtooth", .03], [root * 1.5, "sine", .05], [root * 2.01, "sine", .035]].map(([f, ty, v]) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = ty; o.frequency.value = f; g.gain.value = v; o.connect(g); g.connect(flt); o.start(); return o;
    });
    lfo.start(); this.nodes = [...oscs, lfo]; this.master = master; this.flt = flt;
    const bell = () => {
      const f = sc[Math.floor(Math.random() * sc.length)] * (Math.random() < .3 ? 2 : 1), t = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.07, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + 2.6);
      o.connect(g); g.connect(this.mu); o.start(t); o.stop(t + 2.7);
    };
    bell(); this.tmr = setInterval(bell, 2800);
  },
  stopMusic() {
    clearInterval(this.tmr); const c = this.ctx, ns = this.nodes, m = this.master; this.nodes = [];
    if (!c || !m) return; m.gain.setTargetAtTime(0, c.currentTime, .3);
    setTimeout(() => ns.forEach(o => { try { o.stop(); } catch (e) {} }), 1500);
  },
  intensity(x) { if (this.flt) this.flt.frequency.setTargetAtTime(450 + x * 900, this.ctx.currentTime, .5); },
  wind(x) { if (!this.windG) return; const t = this.ctx.currentTime; this.windG.gain.setTargetAtTime(x * .45, t, .3); this.windF.frequency.setTargetAtTime(400 + x * 700, t, .3); },
  engine(x) { if (!this.engG) return; const t = this.ctx.currentTime; this.engG.gain.setTargetAtTime(x * .06, t, .1); this.engO.frequency.setTargetAtTime(52 + x * 40, t, .1); },
  // sound effects
  relic() { [659, 830, 988, 1319].forEach((f, i) => this.tone(f, 0, .3, .1, "triangle", i * .07)); },
  sample() { this.tone(880, 1320, .12, .08); },
  scanTick(p) { const n = performance.now(); if (n - this.lastTick < 140) return; this.lastTick = n; this.tone(500 + p * 900, 0, .07, .06); },
  scanDone() { [523, 784, 1047].forEach((f, i) => this.tone(f, 0, .25, .1, "triangle", i * .1)); },
  detect() { this.tone(1200, 0, .06, .05, "square"); this.tone(1500, 0, .06, .05, "square", .09); },
  hit() { this.noise(.35, 1500, 150, .35); this.tone(140, 50, .3, .18, "sawtooth"); },
  low() { this.tone(440, 0, .12, .06, "square"); this.tone(440, 0, .12, .06, "square", .18); },
  charge() { this.tone(600, 1000, .15, .05); },
  block() { this.tone(90, 60, .18, .12); },
  hint() { this.tone(900, 1500, .12, .06); },
  ui() { this.tone(1800, 0, .04, .05); },
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0, .35, .1, "triangle", i * .12)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0, .4, .09, "sawtooth", i * .18)); },
  test() { this.init(); this.relic(); }
};

// ---------- SETTINGS PANEL ----------
const GX = {
  RELICS, S, audio: A, rebinding: false, pauseHook: () => {}, onReset: () => {},
  act: code => codeMap[code],
  owns: id => owned.has(id), own: id => { owned.add(id); saveOwned(); },
  count: () => owned.size,
  chOwned: c => RELICS.filter(r => r.c === c && owned.has(r.id)).length,
  chTotal: c => RELICS.filter(r => r.c === c).length,
  isOpen: () => !panel.hidden,
  open() { panel.hidden = false; draw(); GX.pauseHook(true); },
  close() { GX.rebinding = false; panel.hidden = true; GX.pauseHook(false); },
  applyPad() { const p = $("#pad"); if (p) p.style.display = S.pad ? "" : "none"; }
};
window.GX = GX;

const label = c => !c ? "—" : c.startsWith("Key") ? c.slice(3) : c.startsWith("Digit") ? c.slice(5) : c === "Space" ? "Space" :
  ({ ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→" })[c] || c;

const style = document.createElement("style");
style.textContent = `.gs{position:absolute;inset:0;z-index:6;display:grid;place-items:center;background:rgba(3,5,12,.8);padding:12px}.gs[hidden]{display:none}
.gs-box{width:min(540px,100%);max-height:100%;overflow:auto;border:1px solid var(--line);border-radius:14px;background:#0b1020;padding:18px 20px;text-align:start}
.gs-h{display:flex;justify-content:space-between;align-items:center;gap:10px}.gs-h h3{margin:0;font-size:20px}
.gs-tabs{display:flex;gap:8px;margin:14px 0 6px}.gs-tabs .button.on{border-color:var(--cyan);color:var(--cyan)}
.gs-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--line);font-size:13px;color:#dce7fb}
.gs-keys{display:flex;gap:6px}.gs-key{min-width:68px;font-family:var(--mono)}.gs-key.wait{border-color:var(--cyan);color:var(--cyan)}
.gs-row input[type=range]{width:180px;accent-color:#6ce8ff}.gs-row input[type=checkbox]{width:18px;height:18px;accent-color:#6ce8ff}
.gs-note{font-size:12px;color:var(--muted);min-height:20px;margin:10px 0 0}.gs-foot{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
@media(max-width:560px){.gs-row{flex-wrap:wrap}.gs-row input[type=range]{width:100%}}`;
document.head.appendChild(style);

const wrapEl = $(".game-wrap");
const panel = document.createElement("div");
panel.className = "gs"; panel.hidden = true; panel.setAttribute("role", "dialog");
if (wrapEl) wrapEl.appendChild(panel);
let tab = "controls";
const slider = (k, lab, v, min, max, step) => `<label class="gs-row"><span>${lab}</span><input type="range" data-s="${k}" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;
const check = (k, lab, v) => `<label class="gs-row"><span>${lab}</span><input type="checkbox" data-c="${k}" ${v ? "checked" : ""}></label>`;
function draw() {
  const ctl = tab === "controls";
  panel.innerHTML = `<div class="gs-box"><div class="gs-h"><h3>Settings</h3><button class="button ghost small" data-x="close" aria-label="Close">✕</button></div>
  <div class="gs-tabs"><button class="button ghost small ${ctl ? "on" : ""}" data-t="controls">Controls</button><button class="button ghost small ${ctl ? "" : "on"}" data-t="sound">Sound</button></div>` +
  (ctl ? `<p class="gs-note">Click a key to change it. Esc to cancel, Delete to clear.</p>` +
    ACTIONS.map(([a, n]) => `<div class="gs-row"><span>${n}</span><span class="gs-keys">${[0, 1].map(i => `<button class="button ghost small gs-key" data-a="${a}" data-i="${i}">${label(S.keys[a][i])}</button>`).join("")}</span></div>`).join("") +
    slider("sens", "Camera sensitivity", S.sens, .3, 2, .1) + check("inv", "Invert vertical look", S.inv) + check("pad", "Show on-screen buttons", S.pad) +
    `<div class="gs-foot"><button class="button ghost small" data-x="rkeys">Reset controls</button></div>`
  : slider("m", "Master volume", S.vol.m, 0, 1, .05) + slider("mu", "Music", S.vol.mu, 0, 1, .05) + slider("fx", "Effects", S.vol.fx, 0, 1, .05) + slider("ui", "Interface sounds", S.vol.ui, 0, 1, .05) +
    check("mute", "Mute all sound", S.mute) + `<div class="gs-foot"><button class="button primary small" data-x="test">Play test sound</button><button class="button ghost small" data-x="rsnd">Reset sound</button></div>`) +
  `<p class="gs-note" id="gs-note"></p><div class="gs-foot"><button class="button danger small" data-x="rrel">Reset salvage progress</button></div></div>`;
}
const note = t => { const n = $("#gs-note"); if (n) n.textContent = t; };
const syncUI = () => { if (window.anfSetVolume) anfSetVolume(S.vol.ui); if (window.anfSetMuted) anfSetMuted(S.mute); A.vol(); };

panel.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) { if (e.target === panel) GX.close(); return; }
  A.init();
  if (b.dataset.t) { tab = b.dataset.t; draw(); return; }
  if (b.dataset.a) { GX.rebinding = { a: b.dataset.a, i: +b.dataset.i }; b.classList.add("wait"); b.textContent = "Press a key…"; note(""); return; }
  const x = b.dataset.x;
  if (x === "close") GX.close();
  else if (x === "rkeys") { S.keys = clone(DEF_KEYS); S.sens = 1; S.inv = false; S.pad = true; rebuild(); save(); GX.applyPad(); draw(); }
  else if (x === "rsnd") { S.vol = clone(DEF_SND); S.mute = false; save(); syncUI(); draw(); }
  else if (x === "test") A.test();
  else if (x === "rrel") { if (confirm((window.anfT || String)("Reset all collected relics?"))) { owned = new Set(); saveOwned(); GX.onReset(); note("Salvage progress was reset."); } }
});
panel.addEventListener("input", e => {
  const t = e.target;
  if (t.dataset.s) { const k = t.dataset.s; if (k === "sens") S.sens = +t.value; else S.vol[k] = +t.value; save(); syncUI(); }
});
panel.addEventListener("change", e => {
  const t = e.target;
  if (t.dataset.c) { S[t.dataset.c] = t.checked; save(); if (t.dataset.c === "pad") GX.applyPad(); else syncUI(); }
});
// key capture while rebinding (runs before the game's own key handler)
addEventListener("keydown", e => {
  const rb = GX.rebinding; if (!rb) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (e.code === "Escape") { GX.rebinding = false; draw(); return; }
  if (e.code === "Delete" || e.code === "Backspace") {
    if (S.keys[rb.a].filter(Boolean).length < 2 && S.keys[rb.a][rb.i]) { GX.rebinding = false; draw(); note("Each action needs at least one key."); return; }
    S.keys[rb.a][rb.i] = "";
  } else {
    let moved = false;
    for (const a in S.keys) S.keys[a].forEach((c, i) => { if (c === e.code && !(a === rb.a && i === rb.i)) { S.keys[a][i] = ""; moved = true; if (!S.keys[a].some(Boolean)) S.keys[a][i === 0 ? 0 : 1] = ""; } });
    S.keys[rb.a][rb.i] = e.code;
    // never leave an action with no key: give it back its default
    for (const a in S.keys) if (!S.keys[a].some(Boolean)) S.keys[a][0] = DEF_KEYS[a][0] !== e.code ? DEF_KEYS[a][0] : "";
    if (moved) setTimeout(() => note("Key moved from another action."), 0);
  }
  GX.rebinding = false; rebuild(); save(); draw();
}, true);

// header sound button changed -> keep the settings in sync
document.addEventListener("anf-mute-changed", () => { S.mute = LS.getItem("muted") === "1"; A.vol(); if (!panel.hidden) draw(); });
setTimeout(syncUI, 0);
GX.applyPad();
})();
