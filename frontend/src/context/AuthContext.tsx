import React, { createContext, useContext, useState, useEffect } from 'react';
import { firebaseAuthService, UserSession } from '../services/firebase';

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase authorization state updates
    const unsubscribe = firebaseAuthService.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          localStorage.setItem('travel_planner_auth_token', token);
          
          if (firebaseAuthService.isMock) {
            localStorage.setItem('travel_planner_mock_user', JSON.stringify({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
            }));
          }
        } catch (e) {
          console.error('[AUTH CONTEXT] Failed to obtain token:', e);
        }
        setUser(currentUser);
      } else {
        localStorage.removeItem('travel_planner_auth_token');
        localStorage.removeItem('travel_planner_mock_user');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const u = await firebaseAuthService.signInWithGoogle();
      const token = await u.getIdToken();
      localStorage.setItem('travel_planner_auth_token', token);
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const u = await firebaseAuthService.signInWithEmail(email, pass);
      const token = await u.getIdToken();
      localStorage.setItem('travel_planner_auth_token', token);
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const u = await firebaseAuthService.signUpWithEmail(email, pass, name);
      const token = await u.getIdToken();
      localStorage.setItem('travel_planner_auth_token', token);
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseAuthService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be wrapped in an AuthProvider');
  }
  return context;
};
