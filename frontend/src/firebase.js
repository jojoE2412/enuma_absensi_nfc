// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCeRhIxK6NpnbKoLqBRjXbdiqr1w_sWNI8",
  authDomain: "enuma-absensi-nfc.firebaseapp.com",
  projectId: "enuma-absensi-nfc",
  storageBucket: "enuma-absensi-nfc.firebasestorage.app",
  messagingSenderId: "839280913599",
  appId: "1:839280913599:web:2d5432536de594c9516a0a",
  measurementId: "G-6J4T3CDJ3X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);