{ initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
// ──────────────────────────────────────────────────────────────
// HORARI (setmanal)
// - Convenció: setmanes permanents => { setmana: 0, any: 0 }
// - Ocasional per una setmana concreta => { setmana: <ISO>, any: <YYYY> }
// ──────────────────────────────────────────────────────────────
export async function addFranja(uid, data) {
const colRef = collection(db, 'users', uid, 'horariSetmanal');
return await addDoc(colRef, { ...data, createdAt: serverTimestamp() });
}


export async function updateFranja(uid, id, data) {
await updateDoc(doc(db, 'users', uid, 'horariSetmanal', id), data);
}


export async function deleteFranja(uid, id) {
await deleteDoc(doc(db, 'users', uid, 'horariSetmanal', id));
}


export async function listFrangesForWeek(uid, any, setmana) {
const colRef = collection(db, 'users', uid, 'horariSetmanal');
// 1) Permanents
const qPerm = query(colRef, where('setmana', '==', 0));
const snapPerm = await getDocs(qPerm);
// 2) Ocasional de la setmana i any
const qOcc = query(colRef, where('setmana', '==', setmana), where('any', '==', any));
const snapOcc = await getDocs(qOcc);
const all = [...snapPerm.docs, ...snapOcc.docs].map(d => ({ id: d.id, ...d.data() }));
// Ordena per dia/hora per estabilitat
return all.sort((a,b) => (ordDia(a.dia) - ordDia(b.dia)) || (a.hora.localeCompare(b.hora)));
}


function ordDia(d) {
const map = { 'dilluns':1, 'dimarts':2, 'dimecres':3, 'dijous':4, 'divendres':5 };
return map[d] || 9;
}


// ──────────────────────────────────────────────────────────────
// LLIÇONARI
// ──────────────────────────────────────────────────────────────
export async function addLlico(uid, { curs, assignatura, titol, descripcio, recursos }) {
const colRef = collection(db, 'users', uid, 'lliçons');
return await addDoc(colRef, {
curs, assignatura, titol, descripcio,
recursos: (recursos || []).filter(x => x),
createdAt: serverTimestamp()
});
}


export async function listLlicons(uid, { curs, assignatura } = {}) {
const colRef = collection(db, 'users', uid, 'lliçons');
let q = null;
if (curs && assignatura) q = query(colRef, where('curs', '==', curs), where('assignatura', '==', assignatura));
else if (curs) q = query(colRef, where('curs', '==', curs));
else if (assignatura) q = query(colRef, where('assignatura', '==', assignatura));
const snap = await getDocs(q || colRef);
const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
// Ordena per curs → assignatura → titol
return rows.sort((a,b) => (a.curs||'').localeCompare(b.curs||'') || (a.assignatura||'').localeCompare(b.assignatura||'') || (a.titol||'').localeCompare(b.titol||''));
}


export async function deleteLlico(uid, id) {
await deleteDoc(doc(db, 'users', uid, 'lliçons', id));
}


export async function setHorariSetmana(uid, setmana, any, activitats) {
// Opcional: guardar un resum anual (no imprescindible per funcionar)
const ref = doc(db, 'users', uid, 'horariAnual', `${any}-${String(setmana).padStart(2,'0')}`);
await setDoc(ref, { setmana, any, activitats, updatedAt: serverTimestamp() });
