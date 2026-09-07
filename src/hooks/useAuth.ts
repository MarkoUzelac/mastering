import { useEffect, useState } from 'react';
import { getApiAuthHeaders } from '../lib/client-identity';

export interface UserProfile {
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
  subscriptionTier: string;
  createdAt: string;
}

interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch('/api/me', { headers: await getApiAuthHeaders() });
        const data = await response.json().catch(() => null) as { user?: SessionUser } | null;
        if (!mounted) return;

        if (response.ok && data?.user) {
          setUser(data.user);
          setProfile({
            email: data.user.email || '',
            displayName: data.user.name || 'Mastering Engineer',
            photoURL: '',
            role: 'user',
            subscriptionTier: 'free',
            createdAt: '',
          });
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        if (mounted) {
          console.error('[Auth] Unable to initialize session', error);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadSession();
    return () => {
      mounted = false;
    };
  }, []);

  return { user, profile, loading, isAdmin };
};
