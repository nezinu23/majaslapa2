const SESSION_KEY = "klus_session_v2";
const REG_KEY = "klus_registered_users_v1";

function normalize(s){ return String(s ?? "").trim().toLowerCase(); }

function showError(msg){
  const el = document.getElementById("loginError");
  if(!el) return;
  el.hidden = !msg;
  el.textContent = msg || "";
}

function showReg(msg){
  const el = document.getElementById("registerMsg");
  if(!el) return;
  el.textContent = msg || "";
}

async function loadAdminUsers(){
  const res = await fetch("users.json", { cache: "no-store" });
  const data = await res.json();
  return Array.isArray(data?.users) ? data.users : [];
}

function loadRegistered(){
  try{
    return JSON.parse(localStorage.getItem(REG_KEY)) || [];
  }catch{ return []; }
}

function saveRegistered(arr){
  localStorage.setItem(REG_KEY, JSON.stringify(arr));
}

function findAdmin(admins, username, password){
  const u = normalize(username);
  for(const user of admins){
    const full = `${user.vards} ${user.uzvards}`.trim();
    if(normalize(full) === u && String(user.parole) === String(password)){
      return { id:user.id, vards:user.vards, uzvards:user.uzvards, loma:"admin" };
    }
  }
  return null;
}

function findRegistered(users, username, password){
  const u = normalize(username);
  for(const user of users){
    const full = `${user.vards} ${user.uzvards}`.trim();
    if(normalize(full) === u && user.parole === password){
      return { ...user, loma:"user" };
    }
  }
  return null;
}

async function login(){
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const admins = await loadAdminUsers();
  const admin = findAdmin(admins, username, password);
  if(admin){
    localStorage.setItem(SESSION_KEY, JSON.stringify(admin));
    window.location.href = "form3.html";
    return;
  }

  const regs = loadRegistered();
  const user = findRegistered(regs, username, password);
  if(user){
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    window.location.href = "form3.html";
    return;
  }

  showError("Nepareizi dati.");
}

function register(){
  const v = document.getElementById("regFirst").value.trim();
  const u = document.getElementById("regLast").value.trim();
  const p = document.getElementById("regPass").value.trim();
  if(!v || !u || !p){ showReg("Aizpildi visus laukus."); return; }

  const arr = loadRegistered();
  arr.push({ id:Date.now(), vards:v, uzvards:u, parole:p });
  saveRegistered(arr);
  showReg("Konts izveidots! Tagad vari pieslēgties.");
}

document.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById("loginBtn").addEventListener("click", login);
  document.getElementById("registerBtn").addEventListener("click", register);
});
