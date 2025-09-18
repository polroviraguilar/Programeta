import { ensureAuth, addUnit, listUnits, deleteUnit } from './firebase.js';


let currentUser = null;


function escapeHtml(s) { return s.replace(/[&<>"]+/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function nl2br(s) { return s.replace(/\n/g, '<br/>'); }


function render(unitats) {
const wrap = document.getElementById('llistaUnitats');
if (!wrap) return;
if (!unitats.length) { wrap.innerHTML = '<p class="muted">Encara no hi ha unitats.</p>'; return; }
wrap.innerHTML = unitats.map(u => `
<div class="item" data-id="${u.id}">
<div class="item-head">
<h3>${escapeHtml(u.titol)}</h3>
<div class="actions"><button data-action="delete">Eliminar</button></div>
</div>
<div class="muted">${u.assignatura ? `<span class="badge">${escapeHtml(u.assignatura)}</span>` : ''} ${u.data || ''}</div>
<div>${nl2br(escapeHtml(u.contingut || ''))}</div>
</div>
`).join('');
}


async function refresh() {
const unitats = await listUnits(currentUser.uid);
render(unitats);
}


async function onSubmit(e) {
e.preventDefault();
const titol = document.getElementById('titol').value.trim();
const assignatura = document.getElementById('assignatura').value.trim();
const data = document.getElementById('data').value;
const contingut = document.getElementById('contingut').value.trim();
if (!titol) return;
await addUnit(currentUser.uid, { titol, assignatura, data, contingut });
(e.target).reset();
await refresh();
}


function onListClick(e) {
const btn = e.target.closest('button');
if (!btn) return;
const item = e.target.closest('.item');
if (!item) return;
const id = item.getAttribute('data-id');
if (btn.dataset.action === 'delete') {
deleteUnit(currentUser.uid, id).then(refresh);
}
}


// Init
ensureAuth().then(async (user) => {
currentUser = user;
await refresh();
});


document.getElementById('unitatForm')?.addEventListener('submit', onSubmit);
document.getElementById('llistaUnitats')?.addEventListener('click', onListClick);
