import { useEffect, useState } from 'react';
import { type User } from 'firebase/auth';
import { initializeAnonymousAuth, subscribeToAuth } from '../lib/firebase';

export interface UserProfile {
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
  subscriptionTier: string;
  createdAt: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = subscribeToAuth((currentUser) => {
      if (!mounted) return;
      setUser(currentUser);
      if (currentUser) {
        setProfile({
          email: currentUser.email || '',
          displayName: currentUser.displayName || 'Mastering Engineer',
          photoURL: currentUser.photoURL || '',
          role: 'user',
          subscriptionTier: 'free',
          createdAt: '',
        });
        void currentUser.getIdTokenResult().then((tokenResult) => {
          if (mounted) setIsAdmin(tokenResult.claims.admin === true);
        }).catch(() => {
          if (mounted) setIsAdmin(false);
        });
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    initializeAnonymousAuth().catch((error) => {
      if (!mounted) return;
      console.error('[Auth] Unable to initialize anonymous session', error);
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { user, profile, loading, isAdmin };
};
