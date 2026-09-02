import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, FileAudio, ShieldCheck, Trash2, User, X } from 'lucide-react';
import { entitlementService, UserAccount, UserEntitlement, UserUsage } from '../billing/entitlement-service';
import { UsageMeter } from './UsageMeter';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeClick: () => void;
  initialTab?: 'subscription' | 'billing' | 'usage' | 'exports' | 'privacy';
  onNavigateToDataRequest?: () => void;
}

type AccountTab = NonNullable<AccountModalProps['initialTab']>;

const TABS: Array<{ id: AccountTab; label: string; icon: React.ReactNode }> = [
  { id: 'subscription', label: 'Studio', icon: <User className="h-3.5 w-3.5" /> },
  { id: 'billing', label: 'Račun', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { id: 'usage', label: 'Korištenje', icon: <Activity className="h-3.5 w-3.5" /> },
  { id: 'exports', label: 'Izvozi', icon: <FileAudio className="h-3.5 w-3.5" /> },
  { id: 'privacy', label: 'Privatnost', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onUpgradeClick: _onUpgradeClick,
  initialTab = 'subscription',
  onNavigateToDataRequest,
}) => {
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);
  const [entitlement, setEntitlement] = useState<UserEntitlement>(entitlementService.getEntitlement());
  const [usage, setUsage] = useState<UserUsage>(entitlementService.getUsage());
  const [user, setUser] = useState<UserAccount>(entitlementService.getUser());
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    setEntitlement(entitlementService.getEntitlement());
    setUsage(entitlementService.getUsage());
    setUser(entitlementService.getUser());
    setActionMessage(null);
  }, [initialTab, isOpen]);

  useEffect(() => {
    const unsubscribe = entitlementService.subscribe((nextEntitlement, nextUsage) => {
      setEntitlement(nextEntitlement);
      setUsage(nextUsage);
      setUser(entitlementService.getUser());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput !== 'DELETE') return;
    setIsDeleting(true);
    setActionMessage(null);
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Delete request failed.');
      }
      localStorage.clear();
      setActionMessage({ type: 'success', text: data.message || 'Zahtjev za brisanje računa je zaprimljen.' });
      window.setTimeout(() => window.location.reload(), 1800);
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Brisanje računa nije uspjelo.',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmationInput('');
    }
  };

  const renderedExports = Math.max(0, usage.exportsUsed);
  const featureCount = entitlement.features.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]/80 p-3 backdrop-blur-md sm:p-4">
