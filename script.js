// 3. forma: ielādē vielas.json + inventars.json un parāda tabulā.
// Prasība:
// - poga "Vielas" rāda tikai vielas (no vielas.json)
// - poga "Inventārs" rāda tikai inventāru (no inventars.json)
// - poga "Rādīt visu" rāda visus ierakstus kopā
//
// NB: fetch() strādā korekti, ja vietne tiek pasniegta caur serveri (Replit / GitHub Pages).
// Ja atver ar file://, pārlūks var bloķēt JSON ielādi.

const state = {
  rows: [],
  mode: "all", // all | vielas | inventars
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

function setStatus(msg){
  const el = document.getElementById("status");
  if(!el) return;
  el.hidden = !msg;
  el.textContent = msg || "";
}

function mapVielas(v){
  // vielas.json: apakstips, daudzums, id, komentari, mervienibas, nosaukums, skaits, tips
  const svars = (v.daudzums ?? "") === "" ? "-" : `${v.daudzums}${v.mervienibas ? " " + v.mervienibas : ""}`;
  return {
    id: v.id,
    nosaukums: v.nosaukums,
    tips: "Viela",
    apraksts: v.apakstips ?? "-",
    skaits: v.skaits ?? "-",
    svars,
    komentari: v.komentari ?? "-",
    _source: "vielas"
  };
}

function mapInventars(i){
  // inventars.json: apakstips, id, komentari, nosaukums, skaits, tips
  return {
    id: i.id,
    nosaukums: i.nosaukums,
    tips: "Aprīkojums",
    apraksts: i.apakstips ?? i.tips ?? "-",
    skaits: i.skaits ?? "-",
    svars: "-",
    komentari: i.komentari ?? "-",
    _source: "inventars"
  };
}

function matchesMode(r){
  if(state.mode === "all") return true;
  return r._source === state.mode;
}

function matchesQuery(r){
  if(!state.query) return true;
  const q = state.query;
  const hay = [
    r.id, r.nosaukums, r.tips, r.apraksts, r.skaits, r.svars, r.komentari
  ].map(normalize).join(" ");
  return hay.includes(q);
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

function render(){
  const tbody = document.getElementById("tbody");
  const count = document.getElementById("count");
  if(!tbody) return;

  tbody.innerHTML = "";
  const filtered = state.rows.filter(matchesMode).filter(matchesQuery);

  for(const r of filtered){
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
    tbody.appendChild(tr);
  }

  if(count){
    count.textContent = `Rādītie ieraksti: ${filtered.length} / Kopā: ${state.rows.length}`;
  }
  setActiveButton();
}

async function load(){
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

    state.rows = [...vRows, ...iRows];
    setStatus("");
    render();
  }catch(err){
    console.error(err);
    setStatus("Neizdevās ielādēt datus. Pārliecinies, ka vielas.json un inventars.json ir vienā mapē ar form3.html un vietne tiek atvērta caur serveri (Replit / GitHub Pages).");
    state.rows = [];
    render();
  }
}

function wire(){
  const btnAll = document.getElementById("btnAll");
  const btnV = document.getElementById("btnVielas");
  const btnI = document.getElementById("btnInventars");
  const search = document.getElementById("search");

  if(btnAll) btnAll.addEventListener("click", ()=>{ state.mode="all"; render(); });
  if(btnV) btnV.addEventListener("click", ()=>{ state.mode="vielas"; render(); });
  if(btnI) btnI.addEventListener("click", ()=>{ state.mode="inventars"; render(); });

  if(search) search.addEventListener("input", ()=>{
    state.query = normalize(search.value).trim();
    render();
  });
}

document.addEventListener("DOMContentLoaded", ()=>{
  wire();
  load();
});
