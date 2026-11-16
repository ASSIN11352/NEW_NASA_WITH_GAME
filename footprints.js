// Leave your footprint on the Moon
// Visitors type a name, pick a boot print + glow color, then click on the Moon surface.
// Footprints are saved in this browser (localStorage).
(() => {
const moon = document.getElementById("fp-moon");
if (!moon) return;

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const KEY = "anf_footprints", MAX = 300;
const COLORS = ["#6ce8ff", "#a78bfa", "#ff9eac", "#ffd479", "#7dffb2", "#ff8f5a"];

// text made by JavaScript (the fixed page text is translated in app.js)
const TXT = {
  en: { h0: "Write your name first, then click on the Moon.", ready: "Now click anywhere on the Moon to leave your footprint.", need: "Please write your name first.",
        done: "Done! %n's footprint is now on the Moon.", confirm: "Delete all footprints saved in this browser?", empty: "No footprints yet. Be the first!", print: "Boot print" },
  ar: { h0: "اكتب اسمك أولًا ثم اضغط على القمر.", ready: "الآن اضغط في أي مكان على القمر لتترك بصمتك.", need: "من فضلك اكتب اسمك أولًا.",
        done: "تم! بصمة %n أصبحت على القمر.", confirm: "هل تريد حذف كل البصمات المحفوظة في هذا المتصفح؟", empty: "لا توجد بصمات بعد. كن الأول!", print: "شكل البصمة" }
};
const tx = k => TXT[document.documentElement.lang === "ar" ? "ar" : "en"][k];

const hash = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const firstLetter = name => (Array.from(name.trim())[0] || "★").toUpperCase();

// the boot print: sole + heel, 4 tread styles, first letter of the name on the heel
function footSVG(style, letter) {
  const t = [];
  if (style === 0) for (let y = 18; y <= 58; y += 10) t.push(`<path d="M14 ${y}H30"/>`);
  if (style === 1) for (let y = 20; y <= 60; y += 10) for (const x of [16, 22, 28]) t.push(`<circle cx="${x}" cy="${y}" r="1.5" fill="rgba(255,255,255,.3)" stroke="none"/>`);
  if (style === 2) for (let y = 20; y <= 56; y += 12) t.push(`<path d="M14 ${y}L22 ${y + 6}L30 ${y}"/>`);
  if (style === 3) [[17, 24], [27, 24], [22, 36], [17, 48], [27, 48], [22, 60]].forEach(p => t.push(`<circle cx="${p[0]}" cy="${p[1]}" r="3"/>`));
  return `<svg viewBox="0 0 44 100" aria-hidden="true">
    <g fill="rgba(12,15,24,.7)" stroke="currentColor" stroke-width="1.2" stroke-opacity=".7">
      <path d="M22 3c9 0 15 8 15 20 0 9-2 15-3 22-1 6 0 11-1 17H11c-1-6 0-11-1-17-1-7-3-13-3-22C7 11 13 3 22 3z"/>
      <ellipse cx="22" cy="83" rx="10" ry="13"/>
    </g>
    <g fill="none" stroke="rgba(255,255,255,.28)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${t.join("")}</g>
    <text x="22" y="89" text-anchor="middle" font-size="15" font-weight="700" font-family="DM Mono, monospace" fill="currentColor">${esc(letter)}</text>
  </svg>`;
}

// ---------- data ----------
const load = () => { try { const a = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
let list = load(), style = 0, color = 0, touched = false, newId = null, hintKey = "h0", hintName = "";
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} };
const nameInput = $("#fp-name"), hint = $("#fp-hint");

// ---------- drawing ----------
function drawControls() {
  const letter = firstLetter(nameInput.value);
  $("#fp-treads").innerHTML = [0, 1, 2, 3].map(i =>
    `<button type="button" class="fp-tread ${i === style ? "sel" : ""}" data-i="${i}" style="color:${COLORS[color]}" aria-label="${tx("print")} ${i + 1}">${footSVG(i, letter)}</button>`).join("");
  $("#fp-colors").innerHTML = COLORS.map((c, i) =>
    `<button type="button" class="fp-swatch ${i === color ? "sel" : ""}" data-i="${i}" style="--c:${c}" aria-label="Color ${i + 1}"></button>`).join("");
}

function drawPrints() {
  $("#fp-layer").innerHTML = list.map(p => {
    const c = COLORS.includes(p.color) ? p.color : COLORS[0];
    return `<div class="fp-print ${p.id === newId ? "new" : ""}" data-key="${esc(p.name.toLowerCase())}" style="left:${Number(p.x)}%;top:${Number(p.y)}%;--c:${c};--rot:${Number(p.rot)}deg;--s:${Number(p.s)}">
      ${footSVG(Number(p.style) || 0, firstLetter(p.name))}<span class="fp-name">${esc(p.name)}</span></div>`;
  }).join("");
  newId = null;

  $("#fp-count").textContent = String(list.length).padStart(2, "0");
  const names = new Map();
  list.forEach(p => { const k = p.name.toLowerCase(), e = names.get(k) || { name: p.name, n: 0 }; e.n++; e.color = p.color; names.set(k, e); });
  $("#fp-names-count").textContent = String(names.size).padStart(2, "0");
  $("#fp-names").innerHTML = names.size
    ? [...names.entries()].reverse().map(([k, e]) => `<span class="fp-chip" data-key="${esc(k)}" style="--c:${COLORS.includes(e.color) ? e.color : COLORS[0]}"><i></i>${esc(e.name)}${e.n > 1 ? ` <small>×${e.n}</small>` : ""}</span>`).join("")
    : `<p class="muted">${tx("empty")}</p>`;
}

function setHint(key, name, warn) {
  hintKey = key; hintName = name || "";
  hint.textContent = tx(key).replace("%n", hintName);
  hint.classList.toggle("warn", !!warn);
}
const refreshHint = () => { if (hintKey === "done" || hintKey === "need") setHint(hintKey, hintName, hintKey === "need"); else setHint(nameInput.value.trim() ? "ready" : "h0"); };

// ---------- moon surface (craters drawn once with a fixed seed) ----------
function drawCraters() {
  const c = $("#fp-craters"), w = moon.clientWidth, h = moon.clientHeight, d = Math.min(window.devicePixelRatio || 1, 2);
  c.width = w * d; c.height = h * d;
  const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
  let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 42; i++) {
    const x = rnd() * w, y = rnd() * h, r = 8 + rnd() * rnd() * 70;
    const gr = g.createRadialGradient(x - r * .15, y - r * .15, r * .1, x, y, r);
    gr.addColorStop(0, "rgba(30,33,40,.45)"); gr.addColorStop(.8, "rgba(30,33,40,.18)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r, Math.PI * .9, Math.PI * 1.6); g.stroke();
  }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * .08})`; g.fillRect(rnd() * w, rnd() * h, 1.5, 1.5); }
}

// ---------- leaving a footprint ----------
const sound = n => document.dispatchEvent(new CustomEvent("anf-sound", { detail: n }));

function place(clientX, clientY) {
  const name = nameInput.value.replace(/\s+/g, " ").trim();
  if (!name) {
    nameInput.classList.add("shake"); setTimeout(() => nameInput.classList.remove("shake"), 450);
    nameInput.focus(); setHint("need", "", true); sound("wrong"); return;
  }
  const r = moon.getBoundingClientRect();
  const x = Math.min(96, Math.max(4, (clientX - r.left) / r.width * 100));
  const y = Math.min(94, Math.max(6, (clientY - r.top) / r.height * 100));
  const id = Date.now() + "-" + Math.random().toString(36).slice(2, 6), h = hash(name + id);
  // every print is a little different: angle and size come from the name + time
  list.push({ id, name, style, color: COLORS[color], x: +x.toFixed(2), y: +y.toFixed(2), rot: (h % 61) - 30, s: +(0.9 + ((h >> 8) % 35) / 100).toFixed(2) });
  if (list.length > MAX) list = list.slice(-MAX);
  save(); newId = id; drawPrints();
  const puff = document.createElement("div");
  puff.className = "fp-puff"; puff.style.left = x + "%"; puff.style.top = y + "%";
  moon.appendChild(puff); setTimeout(() => puff.remove(), 900);
  sound("thud"); setHint("done", name);
}

moon.addEventListener("click", e => place(e.clientX, e.clientY));
moon.addEventListener("keydown", e => {            // keyboard: Enter / Space leaves a print at a random spot
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault(); const r = moon.getBoundingClientRect();
  place(r.left + r.width * (.15 + Math.random() * .7), r.top + r.height * (.25 + Math.random() * .6));
});

// ---------- controls ----------
$("#fp-treads").addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (b) { style = +b.dataset.i; touched = true; drawControls(); } });
$("#fp-colors").addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (b) { color = +b.dataset.i; touched = true; drawControls(); } });
nameInput.addEventListener("input", () => {
  const n = nameInput.value.trim();
  if (!touched && n) { const h = hash(n); style = h % 4; color = (h >> 3) % COLORS.length; }   // a different default print for every name
  drawControls(); setHint(n ? "ready" : "h0");
});
$("#fp-clear").addEventListener("click", () => { if (list.length && confirm(tx("confirm"))) { list = []; save(); drawPrints(); } });
$("#fp-names").addEventListener("mouseover", e => { const c = e.target.closest(".fp-chip"); if (c) document.querySelectorAll(".fp-print").forEach(p => p.classList.toggle("hl", p.dataset.key === c.dataset.key)); });
$("#fp-names").addEventListener("mouseout", () => document.querySelectorAll(".fp-print.hl").forEach(p => p.classList.remove("hl")));
document.addEventListener("anf-lang", () => { drawControls(); drawPrints(); refreshHint(); });
window.addEventListener("resize", drawCraters);

drawCraters(); drawControls(); drawPrints(); setHint("h0");
})();
