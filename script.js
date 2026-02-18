// script.js — 3. forma
// Requirements: load vielas.json + inventars.json and filter via buttons.
// Extras (as requested):
// - guest (not logged in): shows only 3 rows max
// - logged in user: sees all rows + search + filters
// - admin (Janis Kociņš / 12 from users.json): can add / edit / delete (stored in localStorage)

const SESSION_KEY = "klus_session_v3";
const ADMIN_CUSTOM_KEY = "klus_admin_custom_rows_v1";
const ADMIN_DELETED_KEY = "klus_admin_deleted_ids_v1";
const ADMIN_EDITS_KEY = "klus_admin_edits_v1";

const state = {
  baseRows: [],
  customRows: [],
  deletedIds: new Set(),
  edits: {},           // id -> edited fields
  mode: "all",         // all | vielas | inventars
  query: ""
};

function norm(v){ return String(v ?? "").toLowerCase(); }
function esc(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function getSession(){
  try{ return JSON.parse(localStorage.getItem(SESSION_KEY)); }catch{ return null; }
}
function isLogged(){ return !!getSession(); }
function isAdmin(){ return getSession()?.loma === "admin"; }

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

function loadAdminStorage(){
  try{
    const c = JSON.parse(localStorage.getItem(ADMIN_CUSTOM_KEY) || "[]");
    state.customRows = Array.isArray(c) ? c : [];
  }catch{ state.customRows = []; }

  try{
    const d = JSON.parse(localStorage.getItem(ADMIN_DELETED_KEY) || "[]");
    state.deletedIds = new Set(Array.isArray(d) ? d : []);
  }catch{ state.deletedIds = new Set(); }

  try{
    const e = JSON.parse(localStorage.getItem(ADMIN_EDITS_KEY) || "{}");
    state.edits = (e && typeof e === "object") ? e : {};
  }catch{ state.edits = {}; }
}

function saveAdminStorage(){
  localStorage.setItem(ADMIN_CUSTOM_KEY, JSON.stringify(state.customRows));
  localStorage.setItem(ADMIN_DELETED_KEY, JSON.stringify(Array.from(state.deletedIds)));
  localStorage.setItem(ADMIN_EDITS_KEY, JSON.stringify(state.edits));
}

function resetAdminChanges(){
  state.customRows = [];
  state.deletedIds = new Set();
  state.edits = {};
  saveAdminStorage();
  render();
}

function mapVielas(v){
  const svars = (v.daudzums ?? "") === "" ? "-" : `${v.daudzums}${v.mervienibas ? " " + v.mervienibas : ""}`;
  return {
    id: String(v.id),
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
    id: String(i.id),
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

function applyEdits(row){
  const e = state.edits[row.id];
  if(!e) return row;
  return { ...row, ...e };
}

function matchesMode(r){
  if(state.mode === "all") return true;
  return r._source === state.mode;
}

function matchesQuery(r){
  if(!state.query) return true;
  const q = state.query;
  const hay = [r.id, r.nosaukums, r.tips, r.apraksts, r.skaits, r.svars, r.komentari].map(norm).join(" ");
  return hay.includes(q);
}

function updateSessionUi(){
  const who = document.getElementById("whoami");
  const loginLink = document.getElementById("loginLink");
  const logoutBtn = document.getElementById("logoutBtn");
  const adminPanel = document.getElementById("adminPanel");
  const actionsHead = document.getElementById("actionsHead");

  const s = getSession();

  if(!s){
    if(who) who.textContent = "Nav pieslēdzies (redzi tikai 3 ierakstus).";
    if(loginLink) loginLink.hidden = false;
    if(logoutBtn) logoutBtn.hidden = true;
    if(adminPanel) adminPanel.hidden = true;
    if(actionsHead) actionsHead.hidden = true;
    return;
  }

  const name = [s.vards, s.uzvards].filter(Boolean).join(" ");
  if(who) who.textContent = `Pieslēdzies kā: ${name || "lietotājs"} (${s.loma})`;
  if(loginLink) loginLink.hidden = true;
  if(logoutBtn) logoutBtn.hidden = false;

  if(isAdmin()){
    if(adminPanel) adminPanel.hidden = false;
    if(actionsHead) actionsHead.hidden = false;
  }else{
    if(adminPanel) adminPanel.hidden = true;
    if(actionsHead) actionsHead.hidden = true;
  }
}

function logout(){
  localStorage.removeItem(SESSION_KEY);
  updateSessionUi();
  render();
}

function addRow(){
  const msg = document.getElementById("adminMsg");
  if(msg) msg.textContent = "";

  const src = document.getElementById("addSource")?.value ?? "vielas";
  const id = (document.getElementById("addId")?.value ?? "").trim();
  const name = (document.getElementById("addName")?.value ?? "").trim();
  const desc = (document.getElementById("addDesc")?.value ?? "").trim();
  const countVal = (document.getElementById("addCount")?.value ?? "").trim();
  const weight = (document.getElementById("addWeight")?.value ?? "").trim();
  const comment = (document.getElementById("addComment")?.value ?? "").trim();

  if(!id || !name){
    if(msg) msg.textContent = "Ievadi vismaz ID un Nosaukumu.";
    return;
  }

  if(state.baseRows.some(r => r.id === id) || state.customRows.some(r => r.id === id)){
    if(msg) msg.textContent = "Šāds ID jau eksistē.";
    return;
  }

  state.customRows.unshift({
    id,
    nosaukums: name,
    tips: src === "vielas" ? "Viela" : "Aprīkojums",
    apraksts: desc || "-",
    skaits: countVal === "" ? "-" : Number(countVal),
    svars: weight || "-",
    komentari: comment || "-",
    _source: src,
    _custom: true
  });
  saveAdminStorage();
  render();
}

function deleteRow(id){
  // If it's a custom row -> remove from customRows
  const idx = state.customRows.findIndex(r => r.id === id);
  if(idx >= 0){
    state.customRows.splice(idx, 1);
    saveAdminStorage();
    render();
    return;
  }
  // base row -> mark deleted
  state.deletedIds.add(id);
  saveAdminStorage();
  render();
}

function editRowPrompt(row){
  // Simple prompt-based editing (easy + reliable for school project)
  const nos = prompt("Nosaukums:", row.nosaukums);
  if(nos === null) return;
  const apr = prompt("Apraksts:", row.apraksts);
  if(apr === null) return;
  const ski = prompt("Skaits:", row.skaits);
  if(ski === null) return;
  const sva = prompt("Svars:", row.svars);
  if(sva === null) return;
  const kom = prompt("Komentāri:", row.komentari);
  if(kom === null) return;

  state.edits[row.id] = {
    nosaukums: nos,
    apraksts: apr,
    skaits: ski,
    svars: sva,
    komentari: kom
  };
  saveAdminStorage();
  render();
}

function render(){
  const tbody = document.getElementById("tbody");
  const count = document.getElementById("count");
  if(!tbody) return;

  const combined = [
    ...state.baseRows.map(applyEdits),
    ...state.customRows.map(applyEdits)
  ].filter(r => !state.deletedIds.has(r.id));

  const filtered = combined.filter(matchesMode).filter(matchesQuery);

  const visible = isLogged() ? filtered : filtered.slice(0, 3);

  tbody.innerHTML = "";

  const admin = isAdmin();
  for(const r0 of visible){
    const r = r0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${esc(r.id)}</td>
      <td>${esc(r.nosaukums)}</td>
      <td>${esc(r.tips)}</td>
      <td>${esc(r.apraksts)}</td>
      <td>${esc(r.skaits)}</td>
      <td>${esc(r.svars)}</td>
      <td>${esc(r.komentari)}</td>
    `;

    if(admin){
      const td = document.createElement("td");
      td.style.whiteSpace = "nowrap";

      const editBtn = document.createElement("button");
      editBtn.className = "btn outline small";
      editBtn.type = "button";
      editBtn.textContent = "Rediģēt";
      editBtn.addEventListener("click", ()=> editRowPrompt(r));

      const delBtn = document.createElement("button");
      delBtn.className = "btn outline small";
      delBtn.type = "button";
      delBtn.style.marginLeft = "8px";
      delBtn.textContent = "Dzēst";
      delBtn.addEventListener("click", ()=> deleteRow(r.id));

      td.appendChild(editBtn);
      td.appendChild(delBtn);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  if(count){
    if(!isLogged()){
      count.textContent = `Rādītie ieraksti: ${visible.length} / Kopā: ${filtered.length} (pieslēdzies, lai redzētu visus)`;
    }else{
      count.textContent = `Rādītie ieraksti: ${visible.length} / Kopā: ${filtered.length}` + (isAdmin() ? " (admin)" : "");
    }
  }

  setActiveButton();
}

async function loadBase(){
  try{
    const [vRes, iRes] = await Promise.all([
      fetch("vielas.json", { cache:"no-store" }),
      fetch("inventars.json", { cache:"no-store" })
    ]);
    if(!vRes.ok) throw new Error("Nevar ielādēt vielas.json");
    if(!iRes.ok) throw new Error("Nevar ielādēt inventars.json");

    const v = await vRes.json();
    const i = await iRes.json();

    const vRows = (Array.isArray(v) ? v : []).map(mapVielas);
    const iRows = (Array.isArray(i) ? i : []).map(mapInventars);

    state.baseRows = [...vRows, ...iRows];
    setStatus("");
  }catch(e){
    console.error(e);
    state.baseRows = [];
    setStatus("Neizdevās ielādēt datus. Pārliecinies, ka vielas.json un inventars.json ir repo saknē un vietne ir atvērta caur GitHub Pages/Replit.");
  }
}

function wire(){
  document.getElementById("btnAll")?.addEventListener("click", ()=>{ state.mode="all"; render(); });
  document.getElementById("btnVielas")?.addEventListener("click", ()=>{ state.mode="vielas"; render(); });
  document.getElementById("btnInventars")?.addEventListener("click", ()=>{ state.mode="inventars"; render(); });

  document.getElementById("search")?.addEventListener("input", (e)=>{
    state.query = norm(e.target.value).trim();
    render();
  });

  document.getElementById("logoutBtn")?.addEventListener("click", logout);

  // Admin buttons
  document.getElementById("addBtn")?.addEventListener("click", ()=>{ if(isAdmin()) addRow(); });
  document.getElementById("resetAdminBtn")?.addEventListener("click", ()=>{ if(isAdmin()) resetAdminChanges(); });
}

document.addEventListener("DOMContentLoaded", async ()=>{
  wire();
  loadAdminStorage();
  await loadBase();
  updateSessionUi();
  render();
});
