import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ArrowLeft, Users, Shield, Database, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const AdminPanelView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { loading, isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!isAdmin || !db) {
      if (isAdmin && !db) {
        console.warn('[AdminPanel] Firestore is not initialized.');
      }
      return;
    }

    const firestore = db;
    const fetchUsers = async () => {
      setFetching(true);
      try {
        const querySnapshot = await getDocs(collection(firestore, 'users'));
        const usersList: any[] = [];
        querySnapshot.forEach((snapshot) => {
          usersList.push({ id: snapshot.id, ...snapshot.data() });
        });
        setUsers(usersList);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setFetching(false);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  if (loading) {
    return <div className="p-8 text-[var(--accent-lime-hover)]">Loading admin access...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col p-8 items-center justify-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Access Denied</h2>
        <p className="text-[var(--text-secondary)] mb-6">You do not have administrative privileges to view this area.</p>
        <button onClick={onBack} className="btn-secondary">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-[var(--accent-lime)]" />
              Admin Control Panel
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">Manage users, subscriptions, and platform settings.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-[var(--accent-lime)]" />
            <h3 className="font-semibold text-[var(--text-primary)]">Total Users</h3>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{users.length}</p>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-[var(--text-primary)]">Active Admins</h3>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-5 h-5 text-[var(--accent-lime)]" />
            <h3 className="font-semibold text-[var(--text-primary)]">Pro Subscribers</h3>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{users.filter(u => u.subscriptionTier === 'pro').length}</p>
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">User Directory</h2>
        </div>
        {fetching ? (
          <div className="p-8 text-center text-[var(--text-secondary)]">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Subscription</th>
                  <th className="px-6 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full border border-[var(--border-subtle)]" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[var(--border-subtle)] flex items-center justify-center text-xs font-bold text-[var(--text-primary)]">
                            {u.displayName?.charAt(0) || u.email?.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium text-[var(--text-primary)]">{u.displayName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${u.role === 'admin' ? 'bg-[var(--accent-lime)]/20 text-[var(--accent-lime-hover)] border border-[var(--accent-lime)]/30' : 'bg-[var(--border-subtle)] text-[var(--text-secondary)]'}`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${u.subscriptionTier === 'pro' ? 'bg-[#10B981]/20 text-[#A7F3D0] border border-[#10B981]/30' : 'bg-[var(--border-subtle)] text-[var(--text-secondary)]'}`}>
                        {u.subscriptionTier?.toUpperCase() || 'FREE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-tertiary)]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
