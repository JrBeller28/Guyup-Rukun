
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged, db, doc, onSnapshot, handleFirestoreError, OperationType, setDoc, getDoc, Timestamp } from '../lib/firebase';
import type { FirebaseUser } from '../lib/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: any | null;
  loading: boolean;
  isAdmin: boolean;
  isKetuaRT: boolean;
  isBendahara: boolean;
  isSekretaris: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isAdmin: false,
  isKetuaRT: false,
  isBendahara: false,
  isSekretaris: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubDoc: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }
      
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Ensure user document exists
        try {
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            // Default role is warga unless it's the specified admin email
            const role = (firebaseUser.email === 'muhammad.adjiprasetyo28@gmail.com' || firebaseUser.email === 'adjiprasetyo4@gmail.com') 
              ? 'ketua_rt' 
              : 'warga';

            await setDoc(userDocRef, {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Warga',
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              role: role,
              createdAt: Timestamp.now()
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }

        unsubDoc = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserData(doc.data());
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  const isKetuaRT = userData?.role === 'ketua_rt' || 
                    user?.email === 'muhammad.adjiprasetyo28@gmail.com' || 
                    user?.email === 'adjiprasetyo4@gmail.com';
  const isBendahara = userData?.role === 'bendahara';
  const isSekretaris = userData?.role === 'sekretaris';
  const isAdmin = isKetuaRT;

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin, isKetuaRT, isBendahara, isSekretaris }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
