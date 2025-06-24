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
        // User is signed in, fetch their profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        // Corrected line: pass the reference to getDoc()
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          currentUser.value = {
            uid: firebaseUser.uid,
            ...userDoc.data()
          };
        } else {
          // User exists in Auth but not in Firestore. This is an edge case.
          currentUser.value = null;
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