import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAiHCW9b6aanfsNWkzY8MgptPnitB3or6Q",
  authDomain: "gymai-9edba.firebaseapp.com",
  projectId: "gymai-9edba",
  storageBucket: "gymai-9edba.appspot.com",
  messagingSenderId: "755619265638",
  appId: "1:755619265638:web:abcdef1234567890abcdef",
  measurementId: "G-XXXXXX"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
