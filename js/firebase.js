// js/firebase.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { 
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import {
  getFirestore, collection, addDoc, getDocs, query, where,
  doc, updateDoc, deleteDoc, setDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

// 🔧 CONFIGURACIÓ: copia la teva de Firebase Console → Project settings → Web app
const firebaseConfig = {
  apiKey: "AIzaSyCrDmpdYr9c55SR2ZbNsYVBzsgXxHM9h5k",
  authDomain: "programeta-cc218.firebaseapp.com",
  projectId: "programeta-cc218",
  storageBucket: "programeta-cc218.firebasestorage.app",
  messagingSenderId: "1004120651589",
  appId: "1:1004120651589:web:9313cd2adf287f8c5e302c"
};

// Inicialització
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ──────────────────────────────────────────
// AUTENTICACIÓ AMB EMAIL / PASSWORD
// ──────────────────────────────────────────

// Quan l’usuari entra o surt
onAuthStateChanged(auth, (user)=>{
  const emailSpan = document.getElementById("userEmail");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginToggle = document.getElementById("loginToggle");

  if(user){
    console.log("Usuari connectat:", user.email);
    if(emailSpan) emailSpan.textContent = user.email;
    if(logoutBtn) logoutBtn.classList.remove("hidden");
    if(loginToggle) loginToggle.classList.add("hidden");
  }else{
    console.log("Ningú connectat");
    if(emailSpan) emailSpan.textContent = "";
    if(logoutBtn) logoutBtn.classList.add("hidden");
    if(loginToggle) loginToggle.classList.remove("hidden");
  }
});

// Login
export async function login(email, pass){
  return signInWithEmailAndPassword(auth, email, pass);
}

// Registre
export async function register(email, pass){
  return createUserWithEmailAndPassword(auth, email, pass);
}

// Logout
export async function logout(){
  return signOut(auth);
}

// ──────────────────────────────────────────
// HORARI (setmanal / anual)
// ──────────────────────────────────────────
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

  // 2) Ocasional d’aquesta setmana
  const qOcc = query(colRef, where('setmana', '==', setmana), where('any', '==', any));
  const snapOcc = await getDocs(qOcc);

  return [...snapPerm.docs, ...snapOcc.docs].map(d => ({ id: d.id, ...d.data() }));
}

export async function setHorariSetmana(uid, setmana, any, activitats) {
  const ref = doc(db, 'users', uid, 'horariAnual', `${any}-${String(setmana).padStart(2,'0')}`);
  await setDoc(ref, { setmana, any, activitats, updatedAt: serverTimestamp() });
}

// ──────────────────────────────────────────
// LLIÇONARI
// ──────────────────────────────────────────
export async function addLlico(uid, { curs, assignatura, titol, descripcio, recursos }) {
  const colRef = collection(db, 'users', uid, 'lliçons');
  return await addDoc(colRef, {
    curs, assignatura, titol, descripcio,
    recursos: recursos || [],
    createdAt: serverTimestamp()
  });
}

export async function listLlicons(uid, { curs, assignatura } = {}) {
  const colRef = collection(db, 'users', uid, 'lliçons');
  let q = colRef;
  if (curs && assignatura) q = query(colRef, where('curs','==',curs), where('assignatura','==',assignatura));
  else if (curs) q = query(colRef, where('curs','==',curs));
  else if (assignatura) q = query(colRef, where('assignatura','==',assignatura));
  const snap = await getDocs(q);
  return snap.docs.map(d=>({ id:d.id, ...d.data() }));
}

export async function deleteLlico(uid, id) {
  await deleteDoc(doc(db, 'users', uid, 'lliçons', id));
}
