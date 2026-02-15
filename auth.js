// auth.js — simple client-side login using users.json (no server).
// Success stores session in localStorage and redirects to form3.html.

const SESSION_KEY = "klus_session_v1";

function normalize(s){ return String(s ?? "").trim().toLowerCase(); }

function showError(msg){
  const el = document.getElementById("loginError");
  if(!el) return;
  el.hidden = !msg;
  el.textContent = msg || "";
}

async function loadUsers(){
  const res = await fetch("users.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Nevar ielādēt users.json");
  const data = await res.json();
  return Array.isArray(data?.users) ? data.users : [];
}

function findUser(users, username, password){
  const u = normalize(username);
  const p = String(password ?? "");
  for(const user of users){
    const vards = String(user?.vards ?? "");
    const uzvards = String(user?.uzvards ?? "");
    const full = `${vards} ${uzvards}`.trim();
    const pass = String(user?.parole ?? "");
    if(pass === p && (normalize(vards) === u || normalize(full) === u)){
      return { id: user.id, vards, uzvards, loma: user.loma ?? "" };
    }
  }
  return null;
}

async function login(){
  const username = document.getElementById("username")?.value ?? "";
  const password = document.getElementById("password")?.value ?? "";
  showError("");

  if(!username.trim() || !password.trim()){
    showError("Lūdzu ievadi lietotājvārdu un paroli.");
    return;
  }

  try{
    const users = await loadUsers();
    const found = findUser(users, username, password);
    if(!found){
      showError("Nepareizs lietotājvārds vai parole.");
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(found));
    window.location.href = "form3.html";
  }catch(err){
    console.error(err);
    showError("Neizdevās ielādēt lietotājus. Pārliecinies, ka users.json ir repo un vietne ir atvērta caur GitHub Pages/Replit.");
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById("loginBtn")?.addEventListener("click", login);
  document.getElementById("password")?.addEventListener("keydown", (e)=>{
    if(e.key === "Enter") login();
  });
});
