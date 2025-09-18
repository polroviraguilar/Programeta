const STORAGE_KEY = 'programeta_unitats_v1';


// Estat en memòria
let unitats = [];


// Helpers LocalStorage
function load() {
try { unitats = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
catch { unitats = []; }
}
function save() {
localStorage.setItem(STORAGE_KEY, JSON.stringify(unitats));
}


// Render de la llista
function render() {
const wrap = document.getElementById('llistaUnitats');
if (!wrap) return;
if (!unitats.length) { wrap.innerHTML = '<p class="muted">Encara no hi ha unitats.</p>'; return; }
wrap.innerHTML = unitats.map(u => `
<div class="item" data-id="${u.id}">
<div class="item-head">
<h3>${escapeHtml(u.titol)}</h3>
<div class="actions">
<button data-action="delete">Eliminar</button>
</div>
</div>
<div class="muted">${u.assignatura ? `<span class="badge">${escapeHtml(u.assignatura)}</span>` : ''} ${u.data || ''}</div>
<div>${nl2br(escapeHtml(u.contingut || ''))}</div>
</div>
`).join('');
}


// Form submit
function onSubmit(e) {
e.preventDefault();
const titol = document.getElementById('titol').value.trim();
const assignatura = document.getElementById('assignatura').value.trim();
const data = document.getElementById('data').value;
const contingut = document.getElementById('contingut').value.trim();
if (!titol) return;
const nova = { id: String(Date.now()), titol, assignatura, data, contingut, createdAt: new Date().toISOString() };
unitats.unshift(nova);
save();
(e.target).reset();
render();
}


// Delegació per eliminar
function onListClick(e) {
const btn = e.target.closest('button');
if (!btn) return;
const action = btn.dataset.action;
const item = e.target.closest('.item');
if (action === 'delete' && item) {
const id = item.getAttribute('data-id');
unitats = unitats.filter(u => u.id !== id);
save();
render();
}
}


// Utils mínimos
function escapeHtml(s) { return s.replace(/[&<>"]+/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function nl2br(s) { return s.replace(/\n/g, '<br/>'); }


// Init
load();
render();


document.getElementById('unitatForm')?.addEventListener('submit', onSubmit);
document.getElementById('llistaUnitats')?.addEventListener('click', onListClick);
