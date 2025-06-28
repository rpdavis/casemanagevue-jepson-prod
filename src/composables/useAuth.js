// /Users/rd/CaseManageVue/src/composables/useAuth.js

import { ref } from 'vue';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';

// This will hold the user data across the app
const currentUser = ref(null);

/**
 * A composable to manage authentication state.
 */
export function useAuth() {
  // A promise that resolves when the auth state is first determined
  const waitForAuthInit = new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // User is signed in, fetch their profile from usersByUID collection
          const userDocRef = doc(db, 'usersByUID', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            currentUser.value = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              ...userDoc.data()
            };
          } else {
            // User exists in Auth but not in Firestore
            console.warn(`User ${firebaseUser.uid} exists in Auth but not in usersByUID collection`);
            currentUser.value = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              role: null // No role assigned
            };
          }
        } catch (error) {
          console.error('Error fetching user document:', error);
          // Fallback to basic user info if Firestore fails
          currentUser.value = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: null
          };
        }
      } else {
        // User is signed out
        currentUser.value = null;
      }
      resolve(currentUser.value);
      unsubscribe(); // Unsubscribe after first check
    });
  });

  return { currentUser, waitForAuthInit };
}