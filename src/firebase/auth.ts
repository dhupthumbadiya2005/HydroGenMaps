// src/firebase/auth.ts
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  sendPasswordResetEmail,
  UserCredential 
} from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";

// Export auth and provider for direct use in components
export { auth, googleProvider };

// Register user
export const doCreateUserWithEmailAndPassword = (
  email: string, 
  password: string
): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Login user
export const doSignInWithEmailAndPassword = (
  email: string, 
  password: string
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Logout
export const doSignOut = (): Promise<void> => {
  return signOut(auth);
};

// Google login
export const doSignInWithGoogle = (): Promise<UserCredential> => {
  return signInWithPopup(auth, googleProvider);
};

// Password reset
export const doPasswordReset = (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email);
};
