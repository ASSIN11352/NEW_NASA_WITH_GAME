// Coin shop: coins are earned in the game (coins on the ground, samples, scans, relics, chapter wins). Upgrades are saved in this browser.
(() => {
const LS = localStorage, $ = s => document.querySelector(s), AR = () => LS.getItem("lang") === "ar", T = (e, a) => AR() ? a : e;
const jp = (k, d) => { try { return JSON.parse(LS.getItem(k)) || d; } catch (e) { return d; } };
// key, English, Arabic, max level, base cost
const UP = [["spd", "Rover speed", "سرعة الروفر", 4, 40], ["eff", "Battery efficiency", "كفاءة البطارية", 4, 40], ["scn", "Scanner speed", "سرعة الماسح", 4, 50], ["mag", "Coin magnet", "مغناطيس العملات", 3, 35], ["chg", "Ship charger", "شاحن السفينة", 4, 45], ["rng", "Ship charging range", "مدى شحن السفينة", 3, 45], ["day", "Extra day in the ship", "يوم إضافي في السفينة", 2, 120]];
const U = Object.assign({ spd: 0, eff: 0, scn: 0, mag: 0, chg: 0, rng: 0, day: 0 }, jp("anf_up", {}));
const SHOP = window.SHOP = { U, UP, coins: +LS.getItem("anf_coins") || 0, add(n) { this.coins += n; LS.setItem("anf_coins", this.coins); } };
const css = document.createElement("style");
css.textContent = "#shop{position:absolute;left:12px;top:12px;bottom:56px;width:min(390px,calc(100% - 24px));z-index:5;display:flex;flex-direction:column;background:rgba(5,8,18,.95);border:1px solid var(--line);border-radius:14px;overflow:hidden;font-size:13px;color:#dce7fb}#shop[hidden]{display:none}#sh-h{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid var(--line);font:12px var(--mono);color:#ffcf6b}#sh-h button{background:none;border:0;color:#fff;cursor:pointer;font-size:15px}#sh-l{overflow:auto;padding:10px;display:grid;gap:8px}.sh-r{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--line);border-radius:10px}.sh-r small{display:block;color:#9fb0cc}.sh-g{font:11px var(--mono);color:#6ce8ff;margin:4px 2px 0}";
document.head.appendChild(css);
function init() {
  const wrap = $(".game-wrap"); if (!wrap) return;
  wrap.insertAdjacentHTML("beforeend", '<button class="button ghost small" id="shop-btn" style="position:absolute;right:200px;bottom:12px;z-index:3"></button><div id="shop" hidden><div id="sh-h"><span id="sh-t"></span><button id="sh-x">✕</button></div><div id="sh-l"></div></div>');
  const box = $("#shop"), cost = (u, l) => u[4] * (l + 1);
  const row = u => { const l = U[u[0]], max = l >= u[3]; return `<div class="sh-r"><div><b>${T(u[1], u[2])}</b><small>${"●".repeat(l)}${"○".repeat(u[3] - l)}</small></div><button class="button ${SHOP.coins >= cost(u, l) && !max ? "primary" : "ghost"} small" data-b="${u[0]}" ${max ? "disabled" : ""}>${max ? "MAX" : "🪙 " + cost(u, l)}</button></div>`; };
  const render = () => { $("#sh-t").textContent = "🛒 " + T("SHOP", "الشوب") + "   🪙 " + SHOP.coins; $("#shop-btn").textContent = "🛒 " + T("Shop", "الشوب");
    $("#sh-l").innerHTML = `<div class="sh-g">${T("ROVER", "الروفر")}</div>` + UP.slice(0, 4).map(row).join("") + `<div class="sh-g">${T("SHIP", "السفينة")}</div>` + UP.slice(4).map(row).join("") + `<p style="color:#9fb0cc;margin:4px 2px">${T("Earn coins: pick them up on the ground, collect samples, scan objects, find relics and finish chapters.", "اكسب العملات: التقطها من الأرض، اجمع العينات، امسح الأجسام، اعثر على الآثار وأنهِ الفصول.")}</p>`; };
  const open = o => { box.hidden = !o; if (window.GX && GX.pauseHook) GX.pauseHook(o); if (o) render(); };
  $("#shop-btn").onclick = () => open(box.hidden); $("#sh-x").onclick = () => open(false);
  $("#sh-l").onclick = e => { const k = e.target.dataset && e.target.dataset.b; if (!k) return; const u = UP.find(x => x[0] === k), c = cost(u, U[k]); if (U[k] >= u[3] || SHOP.coins < c) return; SHOP.coins -= c; LS.setItem("anf_coins", SHOP.coins); U[k]++; LS.setItem("anf_up", JSON.stringify(U)); if (window.ROVA) ROVA.log("buy", T(u[1], u[2])); render(); };
  const ov = $("#lvs"); if (ov) { ov.insertAdjacentHTML("afterend", '<div class="pad" style="margin:0"><button class="button ghost small" id="shop-ov"></button></div>'); $("#shop-ov").onclick = () => open(true); }
  const lab = () => { render(); const b = $("#shop-ov"); if (b) b.textContent = "🛒 " + T("Open the shop", "افتح الشوب"); };
  document.addEventListener("anf-lang", lab); lab();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
