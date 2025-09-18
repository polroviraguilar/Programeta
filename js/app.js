// js/app.firebase.js
// Canvia a subtab setmanal
document.querySelector('#horariTabs [data-subtab="setmanal"]').click();
loadWeek();
});


// ──────────────────────────────────────────────────────────────
// Lliçonari
// ──────────────────────────────────────────────────────────────
const lcurs = document.getElementById('lcurs');
const lassignatura = document.getElementById('lassignatura');
const ltitol = document.getElementById('ltitol');
const ldescripcio = document.getElementById('ldescripcio');
const lrecursos = document.getElementById('lrecursos');
const saveLlicoBtn = document.getElementById('saveLlico');
const llistaLlicons = document.getElementById('llistaLlicons');
const fCurs = document.getElementById('fCurs');
const fAssignatura = document.getElementById('fAssignatura');
const filtraBtn = document.getElementById('filtraLlicons');
const netejaBtn = document.getElementById('netejaFiltres');
const imprimirBtn = document.getElementById('imprimirLlicons');
const descarregarBtn = document.getElementById('descarregarCSV');


saveLlicoBtn.addEventListener('click', async ()=>{
const recursos = (lrecursos.value||'').split(',').map(s=>s.trim());
await addLlico(currentUser.uid, {
curs: lcurs.value.trim(), assignatura: lassignatura.value.trim(), titol: ltitol.value.trim(), descripcio: ldescripcio.value.trim(), recursos
});
lcurs.value = lassignatura.value = ltitol.value = ldescripcio.value = lrecursos.value = '';
await loadLlicons();
});


filtraBtn.addEventListener('click', loadLlicons);
netejaBtn.addEventListener('click', ()=>{ fCurs.value=''; fAssignatura.value=''; loadLlicons(); });
imprimirBtn.addEventListener('click', ()=> window.print());
descarregarBtn.addEventListener('click', ()=> downloadCSV(currentLlicons));


let currentLlicons = [];
async function loadLlicons(){
currentLlicons = await listLlicons(currentUser.uid, { curs: fCurs.value.trim() || undefined, assignatura: fAssignatura.value.trim() || undefined });
if (!currentLlicons.length){ llistaLlicons.innerHTML = '<p class="muted">No hi ha lliçons.</p>'; return; }
llistaLlicons.innerHTML = currentLlicons.map(l=>`
<div class="item">
<div class="item-head"><h3>${escapeHtml(l.titol||'')}</h3><span class="badge">${escapeHtml(l.curs||'')} · ${escapeHtml(l.assignatura||'')}</span></div>
<div class="muted">Recursos: ${(l.recursos||[]).map(r=>`<code>${escapeHtml(r)}</code>`).join(', ')}</div>
<div>${escapeHtml(l.descripcio||'')}</div>
</div>
`).join('');
}


function downloadCSV(rows){
if(!rows?.length) return;
const headers = ['curs','assignatura','titol','descripcio','recursos'];
const csv = [headers.join(';')].concat(rows.map(r=> headers.map(h => escapeCSV(Array.isArray(r[h])? r[h].join('|') : (r[h]||'')).replace(/
/g,' ')).join(';'))).join('
');
const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a'); a.href = url; a.download = 'llicons.csv'; a.click(); URL.revokeObjectURL(url);
}
function escapeCSV(s){ return String(s).includes(';') || String(s).includes('"') ? '"'+String(s).replace(/"/g,'""')+'"' : String(s); }


// ──────────────────────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────────────────────
(async function init(){
currentUser = await ensureAuth();
renderYear();
await loadWeek();
await loadLlicons();
})();
