// Space hover sounds - made with the Web Audio API (no audio files needed).
// Every sound goes through a small echo, so it feels like it travels through space.
// Each group of icons / buttons has its own sound.
(() => {
let ctx = null, bus = null;
let muted = localStorage.getItem("muted") === "1";
let lastPlay = 0;
let uiVol = (() => { try { const v = JSON.parse(localStorage.getItem("anf_game_settings")).vol.ui; return typeof v === "number" ? v : 0.6; } catch (e) { return 0.6; } })();

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    // echo "space" bus: dry signal + a soft repeating, darker echo
    bus = ctx.createGain(); bus.gain.value = uiVol / 0.6;
    const delay = ctx.createDelay(1), feedback = ctx.createGain(), tone = ctx.createBiquadFilter(), wet = ctx.createGain();
    delay.delayTime.value = 0.24; feedback.gain.value = 0.4; wet.gain.value = 0.5;
    tone.type = "lowpass"; tone.frequency.value = 2200;
    bus.connect(ctx.destination);
    bus.connect(delay); delay.connect(tone); tone.connect(feedback); feedback.connect(delay); tone.connect(wet); wet.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// one note. o = { f: start Hz, to: end Hz, type, dur, vol, at: delay, att: fade-in }
function note(o) {
  const a = audio(); if (!a) return;
  const t0 = a.currentTime + (o.at || 0), att = o.att || 0.01, dur = o.dur || 0.15;
  const osc = a.createOscillator(), g = a.createGain();
  osc.type = o.type || "sine";
  osc.frequency.setValueAtTime(o.f, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(o.vol || 0.06, t0 + att);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(bus);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

// filtered noise: wind, hiss, "air". o = { from, to: filter Hz, type, dur, vol, q, at }
function air(o) {
  const a = audio(); if (!a) return;
  const t0 = a.currentTime + (o.at || 0), dur = o.dur || 0.3;
  const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  src.buffer = buf;
  f.type = o.type || "bandpass"; f.Q.value = o.q || 1.5;
  f.frequency.setValueAtTime(o.from, t0);
  f.frequency.exponentialRampToValueAtTime(o.to || o.from, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(o.vol || 0.05, t0 + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(bus);
  src.start(t0);
}

const BEEPS = [880, 988, 1175, 1319, 1568];

const SOUNDS = {
  // logo: deep engine hum that swells up
  brand: () => { note({ f: 90, to: 140, type: "triangle", dur: 0.7, vol: 0.12, att: 0.25 }); note({ f: 180, to: 280, type: "sine", dur: 0.6, vol: 0.04, att: 0.25 }); },
  // menu links: radio chirp
  comms: () => { note({ f: 900, to: 1700, type: "sine", dur: 0.08, vol: 0.07 }); note({ f: 1700, type: "sine", dur: 0.06, vol: 0.05, at: 0.09 }); },
  // language button: sonar ping
  sonar: () => note({ f: 1320, type: "sine", dur: 0.9, vol: 0.09, att: 0.005 }),
  // admin icon: airlock - low thud + air hiss
  airlock: () => { note({ f: 170, to: 80, type: "sine", dur: 0.3, vol: 0.12 }); air({ from: 5000, to: 1800, type: "highpass", dur: 0.4, vol: 0.05, at: 0.05 }); },
  // sound on/off + mobile menu: tiny control-panel tick
  tick: () => note({ f: 2200, type: "sine", dur: 0.04, vol: 0.05 }),
  thruster: () => air({ from: 700, to: 300, type: "lowpass", dur: 0.25, vol: 0.09 }),
  // buttons: laser zap
  zap: () => { note({ f: 1500, to: 180, type: "sawtooth", dur: 0.18, vol: 0.035 }); note({ f: 900, to: 120, type: "sine", dur: 0.2, vol: 0.06 }); },
  // story cards: stardust shimmer
  stardust: () => { air({ from: 1500, to: 5500, dur: 0.4, vol: 0.03, q: 3 }); [2093, 2637, 3136, 4186].forEach((f, i) => note({ f, type: "sine", dur: 0.25, vol: 0.025, at: i * 0.06 })); },
  // quiz answers: computer double-beep (random pitch)
  beep: () => { const n = BEEPS[Math.floor(Math.random() * BEEPS.length)]; note({ f: n, type: "square", dur: 0.06, vol: 0.025 }); note({ f: n * 1.5, type: "square", dur: 0.08, vol: 0.025, at: 0.08 }); },
  // fact cards: slow cosmic pad
  pad: () => { [220, 222, 330, 441].forEach(f => note({ f, type: "sine", dur: 0.8, vol: 0.035, att: 0.25 })); },
  // small links: radio click
  blip: () => note({ f: 1800, to: 2600, type: "sine", dur: 0.05, vol: 0.04 }),
  // quiz result sounds
  correct: () => [523, 659, 784, 1047].forEach((f, i) => note({ f, type: "triangle", dur: 0.2, vol: 0.07, at: i * 0.09 })),
  // footprint pressed into the moon dust: low thud + soft dust
  thud: () => { note({ f: 140, to: 45, type: "sine", dur: 0.28, vol: 0.2 }); air({ from: 900, to: 250, type: "lowpass", dur: 0.35, vol: 0.07, at: 0.02 }); },
  wrong: () => { note({ f: 200, to: 90, type: "sawtooth", dur: 0.35, vol: 0.05 }); }
};

// order matters: first match wins
const GROUPS = [
  ["#sound-toggle", "tick"],
  [".brand", "brand"],
  [".lang-toggle", "sonar"],
  [".admin-icon-link", "airlock"],
  [".site-header nav a", "comms"],
  [".menu-toggle", "thruster"],
  [".quiz-option", "beep"],
  [".fp-tread, .fp-swatch", "tick"],
  [".fp-chip", "blip"],
  [".button, .admin-story", "zap"],
  [".story-card", "stardust"],
  [".fact-card", "pad"],
  [".text-link, .site-footer a, .source-list a", "blip"]
];

let current = null;
document.addEventListener("mouseover", e => {
  if (muted) return;
  for (const [sel, name] of GROUPS) {
    const el = e.target.closest(sel);
    if (!el) continue;
    if (el === current || el.disabled) return;
    current = el;
    const now = performance.now();
    if (now - lastPlay < 60) return;      // never stack sounds
    lastPlay = now;
    SOUNDS[name]();
    return;
  }
});
document.addEventListener("mouseout", e => {
  if (current && !current.contains(e.relatedTarget)) current = null;
});

// right or wrong answer in the quiz
document.addEventListener("click", e => {
  const b = e.target.closest(".quiz-option");
  if (!b || muted) return;
  SOUNDS[b.classList.contains("correct") ? "correct" : "wrong"]();
});

// sounds asked for by other scripts (footprints page)
document.addEventListener("anf-sound", e => { if (!muted && SOUNDS[e.detail]) SOUNDS[e.detail](); });

// browsers only allow sound after the first click / key press
["pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, audio, { once: true }));

// small sound on/off button, next to the language button (same style)
const langBtn = document.getElementById("lang-toggle");
if (langBtn) {
  const btn = document.createElement("button");
  btn.id = "sound-toggle"; btn.className = "lang-toggle"; btn.type = "button";
  const draw = () => { btn.textContent = muted ? "🔇" : "🔊"; btn.title = muted ? "Sound off" : "Sound on"; btn.setAttribute("aria-label", btn.title); };
  draw();
  btn.addEventListener("click", () => { muted = !muted; localStorage.setItem("muted", muted ? "1" : "0"); draw(); if (!muted) SOUNDS.tick(); document.dispatchEvent(new Event("anf-mute-changed")); });
  langBtn.parentNode.insertBefore(btn, langBtn);
  window.anfSetMuted = v => { muted = !!v; localStorage.setItem("muted", muted ? "1" : "0"); draw(); };
} else window.anfSetMuted = v => { muted = !!v; localStorage.setItem("muted", muted ? "1" : "0"); };
// interface (hover) sound volume, 0..1 (set from the game settings)
window.anfSetVolume = v => { uiVol = v; if (bus) bus.gain.value = v / 0.6; };
})();
