// js/app.firebase.js — Versió amb Firestore

import { 
  login, register, logout,
  addFranja, updateFranja, deleteFranja, listFrangesForWeek,
  addLlico, listLlicons
} from './firebase.js';

import { auth } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';

// ──────────────────────────────────────────
// Estat
// ──────────────────────────────────────────
let currentUser = null;
let selected = currentISO(); // { date, week, year }
let franges = [];
let franjaIndex = new Map();
let currentEditKey = null;
let currentEditId = null;

const DAYS = ['dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres'];
const DAY_LABELS = ['Dilluns','Dimarts','Dimecres','Dijous','Divendres'];
const TIMES = ['09:00-10:00','10:00-11:00','11:30-12:30','12:30-13:30','15:00-16:00','16:00-17:00'];

// ──────────────────────────────────────────
// Utils ISO-setmana i format
// ──────────────────────────────────────────
function currentISO() { return dateToISO(new Date()); }
function dateToISO(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  const year = d.getUTCFullYear();
  return { date, week, year };
}
function isoWeekToRange(year, week) {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay() || 7;
  const start = new Date(simple);
  start.setUTCDate(simple.getUTCDate() - dow + 1);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 4);
  return { start, end };
}
function pad(n){ return String(n).padStart(2,'0'); }
function fmtDM(d){ return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth()+1)}`; }
function weeksInYear(year){
  const d = new Date(Date.UTC(year, 11, 31));
  const w = dateToISO(d).week; return w === 1 ? 52 : w;
}
function escapeHtml(s = '') {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}
function nl2br(s=''){ return s.replace(/\n/g,'<br/>'); }

// ──────────────────────────────────────────
// Navegació (adaptada a menú lateral + subpestanyes)
// ──────────────────────────────────────────

// Subcapçalera desplegable (botó de la topbar)
const toggleSub = document.getElementById('toggleSubheader');
if (toggleSub) {
  toggleSub.addEventListener('click', () => {
    const sh = document.getElementById('subheader');
    if (sh) sh.classList.toggle('hidden');
  });
}

// Plegar/desplegar menú lateral (hamburguesa a la topbar)
const toggleSidebar = document.getElementById('toggleSidebar');
if (toggleSidebar) {
  toggleSidebar.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-collapsed');
  });
}

// Menú lateral: Horari / Lliçonari
const sideNav = document.querySelector('.side-nav');
if (sideNav) {
  sideNav.addEventListener('click', (e) => {
    const btn = e.target.closest('.side-link');
    if (!btn) return;

    sideNav.querySelectorAll('.side-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const tab = btn.dataset.tab;
    document.getElementById('tab-horari')?.classList.toggle('hidden', tab !== 'horari');
    document.getElementById('tab-lliconari')?.classList.toggle('hidden', tab !== 'lliconari');
  });
}

// Subpestanyes de l'Horari: Setmanal / Anual
const horariTabs = document.getElementById('horariTabs');
if (horariTabs) {
  horariTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('button.tab'); 
    if (!btn) return;

    horariTabs.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const sub = btn.dataset.subtab;
    document.getElementById('subtab-setmanal')?.classList.toggle('hidden', sub !== 'setmanal');
    document.getElementById('subtab-anual')?.classList.toggle('hidden', sub !== 'anual');
  });
}

// ──────────────────────────────────────────
// Vista setmanal
// ──────────────────────────────────────────
const weekGrid = document.getElementById('weekGrid');
const weekLabel = document.getElementById('weekLabel');
const weekRange = document.getElementById('weekRange');

document.getElementById('prevWeek').addEventListener('click', ()=>{
  selected.week -= 1;
  if (selected.week < 1){ selected.year -= 1; selected.week = weeksInYear(selected.year); }
  loadWeek();
});
document.getElementById('nextWeek').addEventListener('click', ()=>{
  selected.week += 1;
  const max = weeksInYear(selected.year);
  if (selected.week > max){ selected.week = 1; selected.year += 1; }
  loadWeek();
});

async function loadWeek(){
  if (!currentUser) return;
  franges = await listFrangesForWeek(currentUser.uid, selected.year, selected.week);
  franjaIndex.clear();
  for (const f of franges){ franjaIndex.set(`${f.dia}|${f.hora}`, f); }
  renderWeek();
}

function renderWeek(){
  const { start, end } = isoWeekToRange(selected.year, selected.week);
  weekLabel.textContent = `${selected.week} — ${selected.year}`;
  weekRange.textContent = `${fmtDM(start)} → ${fmtDM(end)}`;

  let html = '<thead><tr><th>Hora</th>' + DAY_LABELS.map(d=>`<th>${d}</th>`).join('') + '</tr></thead><tbody>';
  for (const t of TIMES){
    html += `<tr><th>${t}</th>`;
    for (let i=0;i<DAYS.length;i++){
      const d = DAYS[i]; const key = `${d}|${t}`;
      const f = franjaIndex.get(key);
      const body = f ? (`<div class="act"><strong>${escapeHtml(f.curs||'')}</strong> — ${escapeHtml(f.assignatura||'')}</div>` +
                        (f.activitat?`<div class="meta">${escapeHtml(f.activitat)}</div>`:'') +
                        `<div class="meta">${f.tipus==='permanent'?'Permanent':'Aquesta setmana'}</div>`)
                     : '<div class="meta">(buit)</div>';
      html += `<td class="cell"><button class="edit" data-key="${key}">${f?'Editar':'Afegir'}</button>${body}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody>';
  weekGrid.innerHTML = html;
}

// ──────────────────────────────────────────
// Modal edició franja
// ──────────────────────────────────────────
const dlg = document.getElementById('franjaDlg');
const fdia = document.getElementById('fdia');
const fhora = document.getElementById('fhora');
const fcurs = document.getElementById('fcurs');
const fassignatura = document.getElementById('fassignatura');
const factivitat = document.getElementById('factivitat');
const ftipus = document.getElementById('ftipus');

weekGrid.addEventListener('click', e=>{
  const btn = e.target.closest('button.edit'); if(!btn) return;
  openEdit(btn.dataset.key);
});

function openEdit(key){
  currentEditKey = key;
  currentEditId = null;
  const [dia,hora] = key.split('|');
  fdia.value = dia; fhora.value = hora;
  fcurs.value=''; fassignatura.value=''; factivitat.value=''; ftipus.value='ocasional';
  const f = franjaIndex.get(key);
  if (f){
    currentEditId = f.id;
    fcurs.value = f.curs || '';
    fassignatura.value = f.assignatura || '';
    factivitat.value = f.activitat || '';
    ftipus.value = f.tipus || 'ocasional';
  }
  dlg.showModal();
}

document.getElementById('cancelFranja').addEventListener('click', ()=> dlg.close());

document.getElementById('delFranja').addEventListener('click', async ()=>{
  if (currentEditId){ await deleteFranja(currentUser.uid, currentEditId); }
  dlg.close(); loadWeek();
});

document.getElementById('saveFranja').addEventListener('click', async ()=>{
  const [dia,hora] = currentEditKey.split('|');
  const base = {
    dia, hora,
    curs: fcurs.value.trim(),
    assignatura: fassignatura.value.trim(),
    activitat: factivitat.value.trim(),
    tipus: ftipus.value
  };
  if (base.tipus === 'permanent'){ base.setmana=0; base.any=0; }
  else { base.setmana=selected.week; base.any=selected.year; }

  if (currentEditId) await updateFranja(currentUser.uid, currentEditId, base);
  else await addFranja(currentUser.uid, base);

  dlg.close(); loadWeek();
});

// ──────────────────────────────────────────
// Vista anual
// ──────────────────────────────────────────
const yearGrid = document.getElementById('yearGrid');
const yearLabel = document.getElementById('yearLabel');

document.getElementById('prevYear').addEventListener('click', ()=>{ selected.year--; renderYear(); });
document.getElementById('nextYear').addEventListener('click', ()=>{ selected.year++; renderYear(); });

function renderYear(){
  yearLabel.textContent = selected.year;
  const total = weeksInYear(selected.year);
  let cells = '';
  for (let w=1;w<=total;w++){
    const active = (w===selected.week)?'active':'';
    cells += `<div class="wk ${active}" data-week="${w}">W${pad(w)}</div>`;
  }
  yearGrid.innerHTML = cells;
}

yearGrid.addEventListener('click', e=>{
  const div = e.target.closest('.wk'); if(!div) return;
  selected.week = parseInt(div.dataset.week,10);
  document.querySelector('#horariTabs [data-subtab="setmanal"]').click();
  loadWeek(); renderYear();
});

// ──────────────────────────────────────────
// Lliçonari
// ──────────────────────────────────────────
const llistaLlicons = document.getElementById('llistaLlicons');

document.getElementById('filtraLlicons').addEventListener('click', renderLlicons);
document.getElementById('netejaFiltres').addEventListener('click', ()=>{
  document.getElementById('fCurs').value = '';
  document.getElementById('fAssignatura').value = '';
  renderLlicons();
});

document.getElementById('imprimirLlicons').addEventListener('click', ()=> window.print());
document.getElementById('descarregarCSV').addEventListener('click', ()=>{
  const fc = document.getElementById('fCurs').value.trim();
  const fa = document.getElementById('fAssignatura').value.trim();
  const rows = franges.filter(f => (!fc || f.curs === fc) && (!fa || f.assignatura === fa));
  const csv = toCSV(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'llicons.csv'; a.click();
  URL.revokeObjectURL(url);
});

function renderLlicons() {
  const fc = document.getElementById('fCurs').value.trim();
  const fa = document.getElementById('fAssignatura').value.trim();

  const rows = franges.filter(f =>
    (!fc || f.curs === fc) &&
    (!fa || f.assignatura === fa)
  );

  if (!rows.length) {
    llistaLlicons.innerHTML = '<p class="muted">Sense resultats.</p>';
    return;
  }

  llistaLlicons.innerHTML = rows.map(r => `
    <div class="item">
      <div class="item-head"><h3>${escapeHtml(r.activitat)}</h3></div>
      <div class="muted">${escapeHtml(r.curs)} — ${escapeHtml(r.assignatura)}</div>
      <div class="meta">${escapeHtml(r.dia)} ${escapeHtml(r.hora)} · Setmana ${r.week} / ${r.year}</div>
      <div class="meta">${r.tipus === 'permanent' ? 'Permanent' : 'Ocasional'}</div>
    </div>
  `).join('');
}

function toCSV(rows){
  const header = ['curs','assignatura','activitat','dia','hora','setmana','any','tipus'];
  const esc = (s='')=> `"${String(s).replace(/"/g,'""')}"`;
  const lines = [header.join(',')];
  for (const r of rows){
    lines.push([esc(r.curs), esc(r.assignatura), esc(r.activitat), esc(r.dia), esc(r.hora), r.week, r.year, r.tipus].join(','));
  }
  return lines.join('\n');
}

// Login
document.getElementById("btnLogin")?.addEventListener("click", async ()=>{
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPass").value;
  try {
    await login(email, pass);
    alert("Sessió iniciada!");
  } catch (e){
    alert("Error login: " + e.message);
  }
});

// Registre
document.getElementById("btnRegister")?.addEventListener("click", async ()=>{
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPass").value;
  try {
    await register(email, pass);
    alert("Usuari registrat!");
  } catch (e){
    alert("Error registre: " + e.message);
  }
});

// Logout
document.getElementById("btnLogout")?.addEventListener("click", async ()=>{
  await logout();
});

// ──────────────────────────────────────────
// Inicialització amb usuari real
// ──────────────────────────────────────────
onAuthStateChanged(auth, (user)=>{
  if (user) {
    currentUser = user;
    console.log("Sessió iniciada:", user.email);
    renderYear();
    loadWeek();
    renderLlicons();
  } else {
    currentUser = null;
    console.log("Cap usuari connectat.");
    // Opcional: pots netejar la UI aquí
  }
});
