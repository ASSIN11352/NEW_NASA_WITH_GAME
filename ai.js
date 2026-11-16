// ROVA AI: in-game assistant. Answers about the mission log, game state, stories, relics and NASA tech.
// Works offline (built-in knowledge). Optional: press the key button and paste a Gemini API key for free-form answers.
(() => {
const $ = s => document.querySelector(s), LS = localStorage;
const AR = () => LS.getItem("lang") === "ar", T = (e, a) => AR() ? a : e, tr = s => AR() && window.anfT ? window.anfT(s) : s;
const nz = s => String(s || "").toLowerCase().replace(/[\u064B-\u065F\u0640]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\w\u0600-\u06FF ]/g, " ");
let LOG = []; try { LOG = JSON.parse(LS.getItem("anf_rova_log")) || []; } catch (e) {}
const S = () => window.ROVAstate ? window.ROVAstate() : {};
window.ROVA = { log(type, a) { const s = S(); LOG.push({ type, a: a || "", ch: s.ch || "", day: s.day || 1 }); LOG = LOG.slice(-80); try { LS.setItem("anf_rova_log", JSON.stringify(LOG)); } catch (e) {} } };

const EV = e => {
  const a = tr(e.a), c = e.ch ? " (" + tr(e.ch) + ", " + T("day ", "اليوم ") + e.day + ")" : "";
  const m = { start: [`Started ${e.a}`, `بدأت ${a}`], land: ["Rover deployed from the ship", "نزل الروفر من السفينة"], scan: [`Scanned: ${e.a}`, `مسحت: ${a}`], relic: [`Found relic: ${e.a}`, `لقيت أثر: ${a}`], sample: ["Collected a sample", "جمعت عينة"], buy: [`Bought upgrade: ${e.a}`, `اشتريت تطوير: ${e.a}`], hit: ["A hazard hit the rover and drained the battery", "خطر ضرب الروفر واستنزف البطارية"], low: ["Battery got low", "البطارية قاربت تخلص"], dock: ["Recharged at the ship", "شحنت البطارية عند السفينة"], warn: ["Night/storm warning: ordered back to the ship", "تحذير من الليل/العاصفة: رجعنا للسفينة"], shelter: ["Spent the night safely inside the ship", "قضيت الليل في أمان جوه السفينة"], morning: ["New morning: back out on the surface", "صباح جديد: رجعنا نشتغل بره"], win: ["Chapter completed!", "خلصت الفصل بنجاح!"], lose: ["Mission failed: caught outside", "فشلت المهمة: الليل أو العاصفة لحقتنا بره"] }[e.type];
  return m ? T(m[0], m[1]) + c : "";
};
const ALI = { spirit: "سبيريت روح", opportunity: "اوبورتيونيتي اوبرتيونيتي", ingenuity: "انجينيوتي هليكوبتر طياره", sojourner: "سوجورنر", "viking-1": "فايكنج", phoenix: "فينيكس", insight: "انسايت", kepler: "كيبلر كبلر", dawn: "داون", pioneer: "بايونير", near: "نير ايروس", "apollo-footprints": "ابولو اقدام", "lunar-rover": "مركبه القمر", "laser-reflector": "ليزر عاكس مراه", "surveyor-3": "سيرفيور", alsep: "الس زلازل" };
function index() {
  const L = [], seen = {}, S0 = S(), tg = S0.tg || [];
  const add = (k, id, name, txt, done) => { if (seen[k + id]) return; seen[k + id] = 1; L.push({ k, id, name, txt, done, key: nz(name + " " + tr(name) + " " + (ALI[id] || "") + " " + id.replace(/-/g, " ")) }); };
  tg.forEach(t => add("t", t.id, t.title, t.kid, t.done));
  (window.DEFAULT_STORIES || []).forEach(s => add("s", s.id, s.title, s.summary + " " + (s.location || "") + ". " + (s.status || "")));
  ((window.GX && GX.RELICS) || []).forEach(r => add("r", r.id, r.n, r.f, window.GX.owns(r.id)));
  (window.NASA_TECH || []).forEach(s => add("n", s.id, s.title, s.summary));
  return L;
}
function find(q) {
  const tk = nz(q).split(" ").filter(w => w.length > 2 && !/^(the|what|about|tell|and|ما|هو|عن|ايه|اللي|قولي|احكي)$/.test(w));
  let best = null, bs = 0;
  index().forEach(e => { let s = 0; tk.forEach(w => { if (e.key.includes(w)) s += w.length > 3 ? 2 : 1; }); if (s > bs) { bs = s; best = e; } });
  return bs >= 2 ? best : null;
}
const has = (q, w) => w.some(x => q.includes(x));
function local(raw) {
  const q = nz(raw), s = S(), g = window.GX, hits = LOG.filter(e => e.type === "hit").length, nights = LOG.filter(e => e.type === "shelter").length;
  const st = T(`Now: ${tr(s.ch)}, day ${s.day}/${s.maxd}, time left ${s.time}s, battery ${s.batt}%, scanned ${(s.tg || []).filter(t => t.done).length}/${(s.tg || []).length}, samples ${s.got}/${s.NS}, ${Math.round((s.ship || 0) / 10)}m from the ship.`, `الحالة دلوقتي: ${tr(s.ch)}، اليوم ${s.day}/${s.maxd}، باقي ${s.time} ثانية، البطارية ${s.batt}%، مسحت ${(s.tg || []).filter(t => t.done).length}/${(s.tg || []).length}، عينات ${s.got}/${s.NS}، على بعد ${Math.round((s.ship || 0) / 10)} متر من السفينة.`);
  if (has(q, ["happen", "summary", "recap", "so far", "log", "today", "حصل", "حدث", "ملخص", "عملنا", "عملت", "النهارده", "اليوم"])) {
    const ev = LOG.slice(-10).map(EV).filter(Boolean).map(x => "• " + x);
    return (ev.length ? T("Here is what happened recently:\n", "ده اللي حصل مؤخرا:\n") + ev.join("\n") : T("Nothing yet. Start the mission!", "لسه ماحصلش حاجة. ابدأ المهمة!")) + "\n\n" + st;
  }
  if (has(q, ["ship", "base", "lander", "home", "shelter", "سفين", "قاعد", "ملجا"])) return T(`The ship is where we landed. Come back to it to recharge the battery, and when night or the storm arrives stay inside until morning: your scans and relics are saved. We have spent ${nights} night(s) inside. The cyan beam and the arrow point to it. Now we are ${Math.round((s.ship || 0) / 10)}m away.`, `السفينة هي المكان اللي نزلنا منه. ارجعلها تشحن البطارية، ولما الليل أو العاصفة تيجي استنى جواها لحد الصبح: المسح والآثار اللي جمعتها بتتحفظ. قضينا ${nights} ليلة جواها. الشعاع السماوي والسهم بيوروك طريقها. احنا دلوقتي على بعد ${Math.round((s.ship || 0) / 10)} متر.`);
  if (has(q, ["batter", "charge", "بطاري", "شحن"])) return T(`Battery is ${s.batt}%. Recharge by staying near the ship or on a green pad. At 0% the rover crawls. Hazards drain 20%. The battery ran low ${LOG.filter(e => e.type === "low").length} time(s).`, `البطارية ${s.batt}%. اشحن بالوقوف جنب السفينة أو على لوح أخضر. لو وصلت صفر الروفر بيزحف. الأخطار بتخصم 20%. البطارية قربت تخلص ${LOG.filter(e => e.type === "low").length} مرة.`);
  if (has(q, ["night", "storm", "dark", "ليل", "عاصف", "ظلام", "عواص"])) return T(`Each day lasts ${s.time}s more. When it runs out, night (Moon/asteroid) or a dust storm (Mars) arrives. If you are inside the ship you rest and continue the next morning (max ${s.maxd} days). If you are outside, the mission fails.`, `باقي من اليوم ${s.time} ثانية. لما يخلص بييجي الليل (القمر/الكويكب) أو عاصفة غبار (المريخ). لو انت في السفينة بترتاح وتكمل الصبح (أقصى حاجة ${s.maxd} أيام). لو بره بتفشل المهمة.`);
  if (has(q, ["how to", "control", "help", "ازاي", "تحكم", "مساعد", "اعمل ايه"])) return T("Move with WASD/arrows, drag to look, hold SPACE near an object to scan it, H for hints, O for settings. Scan everything, keep the battery up, and be inside the ship when night falls.", "اتحرك بأسهم أو WASD، اسحب الماوس عشان تبص حواليك، اضغط SPACE جنب أي جسم عشان تمسحه، H للتلميحات، O للإعدادات. امسح كل حاجة، خلي البطارية مشحونة، وكون جوه السفينة لما الليل ييجي.");
  if (has(q, ["coin", "shop", "upgrade", "كوين", "عمل", "شوب", "تطوير", "فلوس"])) { const H = window.SHOP; return H ? T(`You have ${H.coins} coins. Upgrades: `, `معاك ${H.coins} عملة. التطويرات: `) + H.UP.map(u => T(u[1], u[2]) + " " + H.U[u[0]] + "/" + u[3]).join("، ") + T("\nEarn coins on the ground, from samples, scans, relics and wins.", "\nاكسب عملات من الأرض والعينات والمسح والآثار والفوز.") : ""; }
  const e = find(raw);
  if (e) { const nm = tr(e.name); return nm + ": " + tr(e.txt) + (e.k === "t" || e.k === "r" ? "\n" + (e.done ? T("✔ You already have this one.", "✔ انت خلصته بالفعل.") : T("Not found/scanned yet.", "لسه ما لقيتوش/ما مسحتوش.")) : ""); }
  if (has(q, ["relic", "salvage", "debris", "اثار", "قطع", "بقايا"])) { const o = ((g && g.RELICS) || []).filter(r => g.owns(r.id)); return T(`Relics found: ${o.length}/${g.RELICS.length}.\n`, `الآثار اللي لقيتها: ${o.length}/${g.RELICS.length}.\n`) + o.map(r => "• " + tr(r.n)).join("\n"); }
  if (has(q, ["scan", "مسح", "سكان"])) { const d = (s.tg || []).filter(t => t.done); return T(`Scanned ${d.length}/${(s.tg || []).length}: `, `مسحت ${d.length}/${(s.tg || []).length}: `) + d.map(t => tr(t.title)).join("، ") + T("\nThe rest are still locked: explore!", "\nالباقي لسه مقفول: استكشف!"); }
  if (has(q, ["hazard", "hit", "damage", "خطر", "اصطدم", "ضرب"])) return T(`Hazards hit us ${hits} time(s). Keep your distance: each hit drains 20% battery.`, `الأخطار ضربتنا ${hits} مرة. خليك بعيد: كل ضربة بتخصم 20% من البطارية.`);
  if (has(q, ["now", "status", "الان", "حالي", "دلوقتي"])) return st;
  return null;
}
const HIST = [];
async function gem(q) {
  const ck = LS.getItem("anf_ck"), gk = LS.getItem("anf_gem"); if (!ck && !gk) return null;
  const s = S(), ctx = JSON.stringify(s) + "\nEVENTS:\n" + LOG.slice(-30).map(EV).join("\n") + "\nFACTS:\n" + (s.tg || []).map(t => t.title + ": " + t.kid).join("\n") + "\nRELICS FOUND: " + ((window.GX && GX.RELICS) || []).filter(r => GX.owns(r.id)).map(r => r.n).join(", ") + "\nCOINS: " + (window.SHOP ? SHOP.coins : 0);
  const sys = "You are ROVA, a friendly robot assistant inside a NASA-themed space exploration game (landing from a ship, collecting scans before night or storm, recharging at the ship, a coin shop). You can chat about anything NASA: missions, rovers, telescopes, history, science. Be accurate, say when unsure, reply in the user's language (Arabic or English), clear and not too long. Game data:\n" + ctx;
  if (ck) {
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": ck, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: LS.getItem("anf_cmodel") || "claude-sonnet-5-5", max_tokens: 800, system: sys, messages: [...HIST, { role: "user", content: q }] }) });
    const d = await r.json(), t = d.content && d.content.map(p => p.text || "").join(""); if (!t) throw 0;
    HIST.push({ role: "user", content: q }, { role: "assistant", content: t }); HIST.splice(0, Math.max(0, HIST.length - 12)); return t;
  }
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + (LS.getItem("anf_gem_model") || "gemini-2.5-flash") + ":generateContent?key=" + encodeURIComponent(gk), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents: [{ role: "user", parts: [{ text: q }] }] }) });
  const d = await r.json(); const t = d.candidates && d.candidates[0].content.parts.map(p => p.text).join(""); if (!t) throw 0; return t;
}
const css = document.createElement("style");
css.textContent = "#rova-chat{position:absolute;right:12px;bottom:56px;width:min(360px,calc(100% - 24px));max-height:72%;z-index:5;display:flex;flex-direction:column;background:rgba(5,8,18,.94);border:1px solid var(--line);border-radius:14px;overflow:hidden;font-size:13px;color:#dce7fb}#rova-chat[hidden]{display:none}#rv-h{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid var(--line);font:11px var(--mono);letter-spacing:1px;color:var(--cyan)}#rv-h button{background:none;border:0;color:#fff;cursor:pointer;font-size:15px}#rv-m{flex:1;overflow:auto;padding:10px;display:grid;gap:8px;min-height:120px}#rv-m div{white-space:pre-wrap;padding:8px 10px;border-radius:10px;line-height:1.7;max-width:92%}.rv-b{background:rgba(108,232,255,.12)}.rv-u{background:rgba(255,157,92,.18);justify-self:end}#rv-c{display:flex;flex-wrap:wrap;gap:6px;padding:0 10px 8px}#rv-c button{font-size:11px;padding:4px 8px;border-radius:99px;border:1px solid var(--line);background:none;color:#cfe;cursor:pointer}#rv-f{display:flex;gap:6px;padding:8px;border-top:1px solid var(--line)}#rv-i{flex:1;min-width:0;background:#0a1222;border:1px solid var(--line);border-radius:8px;color:#fff;padding:7px 9px;font:inherit}";
document.head.appendChild(css);
function init() {
  const wrap = $(".game-wrap"); if (!wrap) return;
  wrap.insertAdjacentHTML("beforeend", '<button class="button ghost small" id="rova-btn" style="position:absolute;right:100px;bottom:12px;z-index:3"></button><div id="rova-chat" hidden><div id="rv-h"><span id="rv-t"></span><span><button id="rv-k">🔑</button><button id="rv-x">✕</button></span></div><div id="rv-m"></div><div id="rv-c"></div><form id="rv-f"><input id="rv-i" autocomplete="off"><button class="button primary small" id="rv-s"></button></form></div>');
  const box = $("#rova-chat"), msgs = $("#rv-m"), inp = $("#rv-i");
  const label = () => { $("#rova-btn").textContent = "💬 " + T("Ask ROVA", "اسأل روفا"); $("#rv-t").textContent = "ROVA AI" + (LS.getItem("anf_ck") ? " · Claude" : LS.getItem("anf_gem") ? " · Gemini" : ""); inp.placeholder = T("Ask about anything that happened...", "اسأل عن أي حاجة حصلت..."); $("#rv-s").textContent = T("Send", "إرسال");
    $("#rv-c").innerHTML = [["What happened?", "ايه اللي حصل؟"], ["Where is the ship?", "فين السفينة؟"], ["Battery status", "حالة البطارية"], ["Relics I found", "الآثار اللي لقيتها"]].map(c => `<button type="button">${T(c[0], c[1])}</button>`).join(""); };
  const put = (c, t) => { const d = document.createElement("div"); d.className = c; d.dir = "auto"; d.textContent = t; msgs.appendChild(d); msgs.scrollTop = 1e9; return d; };
  async function ask(q) {
    q = q.trim(); if (!q) return; put("rv-u", q); const w = put("rv-b", "…"); let a = null;
    try { a = await gem(q); } catch (e) { a = null; if (LS.getItem("anf_gem") || LS.getItem("anf_ck")) w.dataset.err = 1; }
    if (!a) a = local(q) || T("I could not find that in my records. Ask me about the ship, battery, night/storm, relics, a mission object (Spirit, Viking, Kepler...) or what happened today. Press 🔑 to add a Gemini key for free-form answers.", "ما لقيتش ده في سجلاتي. اسألني عن السفينة أو البطارية أو الليل والعاصفة أو الآثار أو أي جسم في المهمة (سبيريت، فايكنج، كيبلر...) أو اللي حصل النهارده. دوس 🔑 وحط مفتاح Gemini عشان أجاوب على أي سؤال.");
    w.textContent = a + (w.dataset.err ? T("\n\n(Could not reach the AI service: check your key and internet. This is an offline answer.)", "\n\n(تعذر الاتصال بخدمة الذكاء الاصطناعي: راجع المفتاح والإنترنت. ده رد من المعلومات الداخلية.)") : ""); msgs.scrollTop = 1e9;
  }
  const open = o => { box.hidden = !o; if (window.GX && GX.pauseHook) GX.pauseHook(o); if (o) { if (!msgs.children.length) put("rv-b", T("Hi, I'm ROVA! I remember everything that happened in this mission. Ask me anything. The game is paused while we talk.", "أهلا، أنا روفا! فاكر كل اللي حصل في المهمة. اسألني أي حاجة. اللعبة واقفة وإحنا بنتكلم.")); inp.focus(); } };
  $("#rova-btn").onclick = () => open(box.hidden); $("#rv-x").onclick = () => open(false);
  $("#rv-k").onclick = () => { const k = prompt(T("Paste your Claude API key (starts with sk-ant) or a Gemini key. It stays only in this browser. Leave empty to remove:", "الصق مفتاح Claude API (بيبدأ بـ sk-ant) أو مفتاح Gemini. بيتحفظ في المتصفح بس. سيبه فاضي للمسح:"), LS.getItem("anf_ck") || LS.getItem("anf_gem") || ""); if (k === null) return; const v = k.trim(); LS.removeItem("anf_ck"); LS.removeItem("anf_gem"); if (v) LS.setItem(v.startsWith("sk-ant") ? "anf_ck" : "anf_gem", v); label(); };
  $("#rv-f").onsubmit = e => { e.preventDefault(); const q = inp.value; inp.value = ""; ask(q); };
  $("#rv-c").onclick = e => { if (e.target.tagName === "BUTTON") ask(e.target.textContent); };
  ["keydown", "keyup"].forEach(v => box.addEventListener(v, e => e.stopPropagation()));
  document.addEventListener("anf-lang", label); label();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
