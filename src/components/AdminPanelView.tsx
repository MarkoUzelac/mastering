import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Users, Shield, Database, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const AdminPanelView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, loading, isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchUsers = async () => {
      setFetching(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList: any[] = [];
        querySnapshot.forEach((doc) => {
          usersList.push({ id: doc.id, ...doc.data() });
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
    return <div className="p-8 text-[#C7FF18]">Loading admin access...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col p-8 items-center justify-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-\[#F2F2EE\] mb-2">Access Denied</h2>
        <p className="text-[#A5A69F] mb-6">You do not have administrative privileges to view this area.</p>
        <button onClick={onBack} className="bg-[#222420] text-\[#F2F2EE\] px-6 py-2 rounded-lg">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-[#151714] border border-[#222420] rounded-lg text-[#A5A69F] hover:text-\[#F2F2EE\] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-\[#F2F2EE\] flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-[#B7F000]" />
              Admin Control Panel
            </h1>
            <p className="text-sm text-[#A5A69F]">Manage users, subscriptions, and platform settings.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#151714] border border-[#222420] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-[#B7F000]" />
            <h3 className="font-semibold text-\[#F2F2EE\]">Total Users</h3>
          </div>
          <p className="text-3xl font-bold text-\[#F2F2EE\]">{users.length}</p>
        </div>
        <div className="bg-[#151714] border border-[#222420] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-\[#F2F2EE\]">Active Admins</h3>
          </div>
          <p className="text-3xl font-bold text-\[#F2F2EE\]">{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="bg-[#151714] border border-[#222420] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-5 h-5 text-[#B7F000]" />
            <h3 className="font-semibold text-\[#F2F2EE\]">Pro Subscribers</h3>
          </div>
          <p className="text-3xl font-bold text-\[#F2F2EE\]">{users.filter(u => u.subscriptionTier === 'pro').length}</p>
        </div>
      </div>

      <div className="bg-[#0D0E0C] border border-[#222420] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#222420] bg-[#151714]">
          <h2 className="text-lg font-bold text-\[#F2F2EE\]">User Directory</h2>
        </div>
        {fetching ? (
          <div className="p-8 text-center text-[#A5A69F]">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#222420] text-xs font-semibold text-[#A5A69F] uppercase tracking-wider">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Subscription</th>
                  <th className="px-6 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222420]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#151714]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full border border-[#222420]" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#222420] flex items-center justify-center text-xs font-bold text-\[#F2F2EE\]">
                            {u.displayName?.charAt(0) || u.email?.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium text-\[#F2F2EE\]">{u.displayName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#A5A69F]">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${u.role === 'admin' ? 'bg-[#B7F000]/20 text-[#C7FF18] border border-[#B7F000]/30' : 'bg-[#222420] text-[#A5A69F]'}`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${u.subscriptionTier === 'pro' ? 'bg-[#10B981]/20 text-[#A7F3D0] border border-[#10B981]/30' : 'bg-[#222420] text-[#A5A69F]'}`}>
                        {u.subscriptionTier?.toUpperCase() || 'FREE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#686A63]">
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
