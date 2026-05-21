// import { initializeApp } from "firebase/app";
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDfKCTCeGHh1DmaLCL7IhnPSPsauxPGvwk",
  authDomain: "project-2f912.firebaseapp.com",
  projectId: "project-2f912",
  storageBucket: "project-2f912.firebasestorage.app",
  messagingSenderId: "493481435351",
  appId: "1:493481435351:web:f72b925826f1d1ca0a1092",
  measurementId: "G-B1XTF6XWEH"
};

// const app = initializeApp(firebaseConfig);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);