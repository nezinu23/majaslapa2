// script.js — 3. forma (Publiskā datubāze)
// Base requirement:
// - Load vielas.json + inventars.json
// - Filter with buttons: Vielas / Inventārs / Rādīt visu
//
// Extra (as requested):
// - If NOT logged in -> show only first 3 rows total
// - If logged in -> show all rows
// - If logged in -> can add custom rows + delete custom rows (saved in localStorage)
//
// NOTE: This is client-side only. JSON files on GitHub are not modified.

const SESSION_KEY = "klus_session_v1";
const CUSTOM_KEY  = "klus_custom_rows_v2";

const state = {
  baseRows: [],
  customRows: [],
  mode: "all",  // all | vielas | inventars
  query: ""
};

function normalize(v){ return String(v ?? "").toLowerCase(); }

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function getSession(){
  try{
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch{
    return null;
  }
}

function setStatus(msg){
  const el = document.getElementById("status");
  if(!el) return;
  el.hidden = !msg;
  el.textContent = msg || "";
}

function setActiveButton(){
  const btnAll = document.getElementById("btnAll");
  const btnV = document.getElementById("btnVielas");
  const btnI = document.getElementById("btnInventars");
  if(!btnAll || !btnV || !btnI) return;
  [btnAll, btnV, btnI].forEach(b => b.classList.remove("active"));
  if(state.mode === "all") btnAll.classList.add("active");
  if(state.mode === "vielas") btnV.classList.add("active");
  if(state.mode === "inventars") btnI.classList.add("active");
}

function mapVielas(v){
  const svars = (v.daudzums ?? "") === "" ? "-" : `${v.daudzums}${v.mervienibas ? " " + v.mervienibas : ""}`;
  return {
    id: v.id,
    nosaukums: v.nosaukums,
    tips: "Viela",
    apraksts: v.apakstips ?? "-",
    skaits: v.skaits ?? "-",
    svars,
    komentari: v.komentari ?? "-",
    _source: "vielas",
    _custom: false
  };
}

function mapInventars(i){
  return {
    id: i.id,
    nosaukums: i.nosaukums,
    tips: "Aprīkojums",
    apraksts: i.apakstips ?? i.tips ?? "-",
    skaits: i.skaits ?? "-",
    svars: "-",
    komentari: i.komentari ?? "-",
    _source: "inventars",
    _custom: false
  };
}

function matchesMode(r){
  if(state.mode === "all") return true;
  return r._source === state.mode;
}

function matchesQuery(r){
  if(!state.query) return true;
  const q = state.query;
  const hay = [r.id, r.nosaukums, r.tips, r.apraksts, r.skaits, r.svars, r.komentari]
    .map(normalize).join(" ");
  return hay.includes(q);
}

function loadCustom(){
  try{
    const raw = localStorage.getItem(CUSTOM_KEY);
    const data = raw ? JSON.parse(raw) : [];
    state.customRows = Array.isArray(data) ? data : [];
  }catch{
    state.customRows = [];
  }
}

function saveCustom(){
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(state.customRows));
}

function isLoggedIn(){
  return !!getSession();
}

function applyAccess(rows){
  if(isLoggedIn()) return rows;
  // not logged in -> only first 3 rows total (after filters/search)
  return rows.slice(0, 3);
}

function ensureActionsColumn(show){
  const head = document.getElementById("actionsHead");
  if(head) head.hidden = !show;
}

function render(){
  const tbody = document.getElementById("tbody");
  const count = document.getElementById("count");
  if(!tbody) return;

  const combined = [...state.baseRows, ...state.customRows];

  const filtered = combined
    .filter(matchesMode)
    .filter(matchesQuery);

  const visible = applyAccess(filtered);

  tbody.innerHTML = "";
  const logged = isLoggedIn();
  ensureActionsColumn(logged);

  for(const r of visible){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(r.id)}</td>
      <td>${escapeHtml(r.nosaukums)}</td>
      <td>${escapeHtml(r.tips)}</td>
      <td>${escapeHtml(r.apraksts)}</td>
      <td>${escapeHtml(r.skaits)}</td>
      <td>${escapeHtml(r.svars)}</td>
      <td>${escapeHtml(r.komentari)}</td>
    `;

    if(logged){
      const td = document.createElement("td");
      td.style.whiteSpace = "nowrap";
      if(r._custom){
        const btn = document.createElement("button");
        btn.className = "btn outline small";
        btn.type = "button";
        btn.textContent = "Dzēst";
        btn.addEventListener("click", ()=>{
          state.customRows = state.customRows.filter(x => x._id !== r._id);
          saveCustom();
          render();
        });
        td.appendChild(btn);
      }else{
        td.textContent = "-";
      }
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  if(count){
    const total = filtered.length;
    const shown = visible.length;
    count.textContent = logged
      ? `Rādītie ieraksti: ${shown} / Kopā: ${total} (+ mani: ${state.customRows.length})`
      : `Rādītie ieraksti: ${shown} / Kopā: ${total} (pieslēdzies, lai redzētu visus)`;
  }

  setActiveButton();
}

async function loadBase(){
  try{
    const [vielasRes, invRes] = await Promise.all([
      fetch("vielas.json", { cache: "no-store" }),
      fetch("inventars.json", { cache: "no-store" })
    ]);
    if(!vielasRes.ok) throw new Error("Nevar ielādēt vielas.json");
    if(!invRes.ok) throw new Error("Nevar ielādēt inventars.json");

    const vielas = await vielasRes.json();
    const inventars = await invRes.json();

    const vRows = (Array.isArray(vielas) ? vielas : []).map(mapVielas);
    const iRows = (Array.isArray(inventars) ? inventars : []).map(mapInventars);

    state.baseRows = [...vRows, ...iRows];
    setStatus("");
  }catch(err){
    console.error(err);
    setStatus("Neizdevās ielādēt datus. Pārliecinies, ka vielas.json un inventars.json ir repo saknē un vietne ir atvērta caur GitHub Pages/Replit.");
    state.baseRows = [];
  }
}

function updateSessionUi(){
  const who = document.getElementById("whoami");
  const logout = document.getElementById("logoutBtn");
  const addPanel = document.getElementById("addPanel");

  const s = getSession();
  if(s){
    const name = [s.vards, s.uzvards].filter(Boolean).join(" ");
    if(who) who.textContent = `Pieslēdzies kā: ${name || "lietotājs"} (${s.loma || "user"})`;
    if(logout) logout.hidden = false;
    if(addPanel) addPanel.hidden = false;
  }else{
    if(who) who.textContent = "Nav pieslēdzies (redzi tikai 3 ierakstus).";
    if(logout) logout.hidden = true;
    if(addPanel) addPanel.hidden = true;
  }
}

function logout(){
  localStorage.removeItem(SESSION_KEY);
  updateSessionUi();
  render();
}

function addCustom(){
  const err = document.getElementById("addError");
  if(err) err.textContent = "";

  const src = document.getElementById("addSource")?.value ?? "vielas";
  const id = document.getElementById("addId")?.value.trim() ?? "";
  const name = document.getElementById("addName")?.value.trim() ?? "";
  const desc = document.getElementById("addDesc")?.value.trim() ?? "";
  const countVal = document.getElementById("addCount")?.value ?? "";
  const weight = document.getElementById("addWeight")?.value.trim() ?? "";
  const comment = document.getElementById("addComment")?.value.trim() ?? "";

  if(!id || !name){
    if(err) err.textContent = "Lūdzu ievadi vismaz ID un Nosaukumu.";
    return;
  }

  const row = {
    _id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
    id,
    nosaukums: name,
    tips: src === "vielas" ? "Viela" : "Aprīkojums",
    apraksts: desc || "-",
    skaits: countVal === "" ? "-" : Number(countVal),
    svars: weight || "-",
    komentari: comment || "-",
    _source: src,
    _custom: true
  };

  state.customRows.unshift(row);
  saveCustom();
  render();
}

function clearCustom(){
  state.customRows = [];
  saveCustom();
  render();
}

function wire(){
  document.getElementById("btnAll")?.addEventListener("click", ()=>{ state.mode="all"; render(); });
  document.getElementById("btnVielas")?.addEventListener("click", ()=>{ state.mode="vielas"; render(); });
  document.getElementById("btnInventars")?.addEventListener("click", ()=>{ state.mode="inventars"; render(); });

  document.getElementById("search")?.addEventListener("input", (e)=>{
    state.query = normalize(e.target.value).trim();
    render();
  });

  document.getElementById("logoutBtn")?.addEventListener("click", logout);

  document.getElementById("addBtn")?.addEventListener("click", addCustom);
  document.getElementById("clearCustomBtn")?.addEventListener("click", clearCustom);
}

document.addEventListener("DOMContentLoaded", async ()=>{
  wire();
  loadCustom();
  await loadBase();
  updateSessionUi();
  render();
});
