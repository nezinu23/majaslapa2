// auth.js — login + registration (client-side only)
// Admin is checked from users.json. Registered users are stored in localStorage.

const SESSION_KEY = "klus_session_v3";
const REG_KEY = "klus_registered_users_v2";

function norm(s){ return String(s ?? "").trim().toLowerCase(); }

function showLoginError(msg){
  const el = document.getElementById("loginError");
  if(!el) return;
  el.hidden = !msg;
  el.textContent = msg || "";
}

function showRegisterMsg(msg){
  const el = document.getElementById("registerMsg");
  if(!el) return;
  el.textContent = msg || "";
}

async function loadAdmins(){
  const res = await fetch("users.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Nevar ielādēt users.json");
  const data = await res.json();
  return Array.isArray(data?.users) ? data.users : [];
}

function loadRegistered(){
  try{
    const raw = localStorage.getItem(REG_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch{ return []; }
}

function saveRegistered(arr){
  localStorage.setItem(REG_KEY, JSON.stringify(arr));
}

function findAdmin(admins, username, password){
  const u = norm(username);
  const p = String(password ?? "");
  for(const a of admins){
    const full = `${a.vards ?? ""} ${a.uzvards ?? ""}`.trim();
    if(norm(full) === u && String(a.parole ?? "") === p){
      return { id:a.id, vards:a.vards, uzvards:a.uzvards, loma:"admin" };
    }
  }
  return null;
}

function findRegistered(users, username, password){
  const u = norm(username);
  const p = String(password ?? "");
  for(const r of users){
    const full = `${r.vards ?? ""} ${r.uzvards ?? ""}`.trim();
    if(norm(full) === u && String(r.parole ?? "") === p){
      return { id:r.id, vards:r.vards, uzvards:r.uzvards, loma:"user" };
    }
  }
  return null;
}

async function login(){
  const username = document.getElementById("username")?.value ?? "";
  const password = document.getElementById("password")?.value ?? "";

  showLoginError("");

  if(!username.trim() || !password.trim()){
    showLoginError("Ievadi lietotājvārdu un paroli.");
    return;
  }

  try{
    const admins = await loadAdmins();
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

    showLoginError("Nepareizi dati.");
  }catch(e){
    console.error(e);
    showLoginError("Kļūda ielādējot lietotājus.");
  }
}

function register(){
  const v = document.getElementById("regFirst")?.value.trim() ?? "";
  const u = document.getElementById("regLast")?.value.trim() ?? "";
  const p = document.getElementById("regPass")?.value.trim() ?? "";
  showRegisterMsg("");

  if(!v || !u || !p){
    showRegisterMsg("Aizpildi visus laukus.");
    return;
  }

  const regs = loadRegistered();
  regs.push({ id: Date.now(), vards: v, uzvards: u, parole: p });
  saveRegistered(regs);
  showRegisterMsg("Konts izveidots! Tagad vari pieslēgties.");
}

document.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById("loginBtn")?.addEventListener("click", login);
  document.getElementById("registerBtn")?.addEventListener("click", register);

  document.getElementById("password")?.addEventListener("keydown", (e)=>{
    if(e.key === "Enter") login();
  });
});
