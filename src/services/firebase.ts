import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Placeholder Firebase configuration - to be replaced with actual values
const firebaseConfig = {
  apiKey: "AIzaSyBVnPsHwwrp-iOr59dS8yvtH3zStUYKVkY",
  authDomain: "hackout-4e20f.firebaseapp.com",
  projectId: "hackout-4e20f",
  storageBucket: "hackout-4e20f.firebasestorage.app",
  messagingSenderId: "129983507452",
  appId: "1:129983507452:web:53c9bab5d18efa2967a079",
  measurementId: "G-LHR3Q12V67"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;