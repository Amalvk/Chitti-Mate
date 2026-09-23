import { getApps, initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyC_KhGpNbY5zNT4JR5M3Mv61ns3f6HtcUo',
  authDomain: 'chitti-koottam.firebaseapp.com',
  projectId: 'chitti-koottam',
  storageBucket: 'chitti-koottam.firebasestorage.app',
  messagingSenderId: '991137223597',
  appId: '1:991137223597:web:b9a0896523f88cd4368724',
  measurementId: 'G-LTVRZB3VB8',
}

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Opt-in local emulator for development, e.g. `firebase emulators:start` +
// VITE_USE_FIRESTORE_EMULATOR=true. Never enabled in a production build.
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIRESTORE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080)
}
