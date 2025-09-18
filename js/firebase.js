// js/firebase.js (mòdul)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/X.Y.Z/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/X.Y.Z/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/X.Y.Z/firebase-firestore.js';


// 🔁 Posa aquí el teu bloc de configuració de Firebase
export const firebaseConfig = {
apiKey: "TU_API_KEY",
authDomain: "TU_PROJECT.firebaseapp.com",
projectId: "TU_PROJECT",
storageBucket: "TU_PROJECT.appspot.com",
messagingSenderId: "...",
appId: "..."
};


export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);


// Autenticació mínima (anònima per MVP)
export function ensureAuth() {
return new Promise((resolve, reject) => {
onAuthStateChanged(auth, async (user) => {
try {
if (!user) {
await signInAnonymously(auth);
return; // esperar proper onAuthStateChanged
}
resolve(user);
} catch (err) { reject(err); }
});
});
}


// Operacions Firestore encapsulades
export async function addUnit(uid, data) {
const colRef = collection(db, 'users', uid, 'unitats');
await addDoc(colRef, { ...data, createdAt: serverTimestamp() });
}


export async function listUnits(uid) {
const colRef = collection(db, 'users', uid, 'unitats');
const snap = await getDocs(query(colRef, orderBy('createdAt', 'desc')));
return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}


export async function deleteUnit(uid, id) {
await deleteDoc(doc(db, 'users', uid, 'unitats', id));
}
