// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCiAuPVqI61k2is94rc70DzqvVNrYqdI3w",
  authDomain: "kasku-7aeb6.firebaseapp.com",
  projectId: "kasku-7aeb6",
  storageBucket: "kasku-7aeb6.firebasestorage.app",
  messagingSenderId: "434974443546",
  appId: "1:434974443546:web:7564462cc71ea32d70e9a3",
  measurementId: "G-0GG8J8NPZR",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
