import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  CreditCard,
  Layers,
  Activity,
  FileAudio,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Loader2,
  ExternalLink,
  Trash2,
  Lock,
} from 'lucide-react';
import { entitlementService, UserEntitlement, UserUsage, UserAccount } from '../billing/entitlement-service';
import { subscriptionService, Invoice, ExportHistoryRecord } from '../billing/subscription-service';
import { BILLING_PLANS } from '../billing/billing-config';
import { ProBadge } from './ProBadge';
import { UsageMeter } from './UsageMeter';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeClick: () => void;
  initialTab?: 'subscription' | 'billing' | 'usage' | 'exports' | 'privacy';
  onNavigateToDataRequest?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onUpgradeClick,
  initialTab = 'subscription',
  onNavigateToDataRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'subscription' | 'billing' | 'usage' | 'exports' | 'privacy'>(initialTab);
  const [entitlement, setEntitlement] = useState<UserEntitlement>(entitlementService.getEntitlement());
  const [usage, setUsage] = useState<UserUsage>(entitlementService.getUsage());
  const [user, setUser] = useState<UserAccount>(entitlementService.getUser());
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportHistoryRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Deletion modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEntitlement(entitlementService.getEntitlement());
      setUsage(entitlementService.getUsage());
      setUser(entitlementService.getUser());

      subscriptionService.getInvoices().then(setInvoices);
      subscriptionService.getExportHistory().then(setExportHistory);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isPro = entitlement.status === 'PRO' || entitlement.status === 'TRIAL';
  const currentPlanConfig = BILLING_PLANS[entitlement.plan] || BILLING_PLANS.free;

  const handleOpenStripePortal = async () => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.fallback) {
        setActionMessage({
          type: 'success',
          text: data.message || 'Direct Stripe billing portal management active in live production.',
        });
      }
    } catch {
      setActionMessage({
        type: 'error',
        text: 'Unable to reach customer billing portal.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your MasteringLocal.Pro Pro subscription?')) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await subscriptionService.cancelSubscription(false);
      if (res.success) {
        setEntitlement(entitlementService.getEntitlement());
        setActionMessage({ type: 'success', text: res.message });
      } else {
        setActionMessage({ type: 'error', text: res.message });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResume = async () => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await subscriptionService.resumeSubscription();
      if (res.success) {
        setEntitlement(entitlementService.getEntitlement());
        setActionMessage({ type: 'success', text: res.message });
      } else {
        setActionMessage({ type: 'error', text: res.message });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput !== 'DELETE') return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      localStorage.clear();
      setActionMessage({
        type: 'success',
        text: data.message || 'Your account and personal profile have been scheduled for deletion.',
      });
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch {
      setActionMessage({
        type: 'error',
        text: 'Failed to complete deletion request. Please contact privacy@masteringlocal.pro',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formattedPeriodEnd = entitlement.currentPeriodEnd
    ? new Date(entitlement.currentPeriodEnd).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08090B]/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0E1013] border border-[#24282D] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#24282D] bg-[#14171B]/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#14171B] border border-[#24282D] flex items-center justify-center text-[#D6AF62]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F4F3EF] tracking-wider uppercase font-mono">
                Studio Account &amp; Entitlements
              </h3>
              <p className="text-[11px] text-[#9A9EA6] font-mono">
                {user.email} · {isPro ? 'Pro Active' : 'Free Tier'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9A9EA6] hover:text-[#F4F3EF] p-1.5 rounded-lg hover:bg-[#14171B] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-[#24282D] bg-[#0E1013] text-xs font-mono overflow-x-auto">
          <button
            onClick={() => setActiveTab('subscription')}
            className={`py-3 px-4 font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'subscription'
                ? 'border-[#D6AF62] text-[#D6AF62]'
                : 'border-transparent text-[#9A9EA6] hover:text-[#F4F3EF]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Subscription
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`py-3 px-4 font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'billing'
                ? 'border-[#D6AF62] text-[#D6AF62]'
                : 'border-transparent text-[#9A9EA6] hover:text-[#F4F3EF]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Billing &amp; Invoices
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`py-3 px-4 font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'usage'
                ? 'border-[#D6AF62] text-[#D6AF62]'
                : 'border-transparent text-[#9A9EA6] hover:text-[#F4F3EF]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Usage &amp; Quotas
          </button>
          <button
            onClick={() => setActiveTab('exports')}
            className={`py-3 px-4 font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'exports'
                ? 'border-[#D6AF62] text-[#D6AF62]'
                : 'border-transparent text-[#9A9EA6] hover:text-[#F4F3EF]'
            }`}
          >
            <FileAudio className="w-3.5 h-3.5" />
            Export Logs
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-4 font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-[#D6AF62] text-[#D6AF62]'
                : 'border-transparent text-[#9A9EA6] hover:text-[#F4F3EF]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Privacy &amp; Data (GDPR)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {actionMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                actionMessage.type === 'success'
                  ? 'bg-[#1C170E] border-[#D6AF62] text-[#D6AF62]'
                  : 'bg-[#1C1012] border-[#E56B6B]/40 text-[#E56B6B]'
              }`}
            >
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
          )}

          {/* TAB 1: Subscription */}
          {activeTab === 'subscription' && (
            <div className="space-y-4">
              <div className="bg-[#08090B] p-4 rounded-xl border border-[#1E2228] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#646A73] uppercase font-mono block">CURRENT TIER</span>
                    <h4 className="text-base font-semibold text-[#F4F3EF] flex items-center gap-2 mt-0.5">
                      {currentPlanConfig.name}
                      <ProBadge size="xs" locked={!isPro} />
                    </h4>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold border ${
                      isPro
                        ? entitlement.cancelAtPeriodEnd
                          ? 'bg-[#1C170E] text-[#E7C77F] border-[#E7C77F]/40'
                          : 'bg-[#1C170E] text-[#D6AF62] border-[#D6AF62]/40'
                        : 'bg-[#14171B] text-[#9A9EA6] border-[#24282D]'
                    }`}
                  >
                    STATUS: {entitlement.status}
                    {entitlement.cancelAtPeriodEnd ? ' (CANCELLING)' : ''}
                  </span>
                </div>

                <hr className="border-[#1E2228]" />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] font-mono">
                  <div>
                    <span className="text-[#646A73] block text-[10px]">INTERVAL</span>
                    <span className="text-[#F4F3EF]">{currentPlanConfig.periodLabel || 'Forever'}</span>
                  </div>
                  <div>
                    <span className="text-[#646A73] block text-[10px]">PRICE</span>
                    <span className="text-[#F4F3EF]">€{currentPlanConfig.price} / cycle</span>
                  </div>
                  <div>
                    <span className="text-[#646A73] block text-[10px]">
                      {entitlement.cancelAtPeriodEnd ? 'ACCESS EXPIRES' : 'NEXT RENEWAL'}
                    </span>
                    <span className="text-[#F4F3EF]">{formattedPeriodEnd}</span>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {isPro ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenStripePortal}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-[#171A20] hover:bg-[#20252E] text-[#F4F3EF] border border-[#2D333F] font-mono rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#D6AF62]" />
                      <span>Manage in Stripe Portal</span>
                    </button>

                    {entitlement.cancelAtPeriodEnd ? (
                      <button
                        onClick={handleResume}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-[#D6AF62] hover:bg-[#E7C77F] text-[#08090B] font-semibold font-mono rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Resume Pro Subscription</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleCancel}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-[#14171B] hover:bg-[#1B1F24] text-[#E56B6B] border border-[#E56B6B]/30 font-medium font-mono rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        <span>Cancel Subscription</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={onUpgradeClick}
                    className="px-5 py-2.5 bg-[#D6AF62] hover:bg-[#E7C77F] text-[#08090B] font-semibold font-mono rounded-lg text-xs transition cursor-pointer flex items-center gap-2 shadow-md shadow-[#D6AF62]/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>UPGRADE TO PRO STUDIO (€19/MO OR €169/YR)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Billing & Invoices */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              {/* Payment Method */}
              <div className="bg-[#08090B] p-4 rounded-xl border border-[#1E2228] space-y-2">
                <span className="text-[10px] text-[#646A73] uppercase font-mono block">SAVED PAYMENT METHOD</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="px-2.5 py-1.5 rounded bg-[#14171B] border border-[#24282D] text-[#D6AF62] font-mono font-bold text-xs">
                      {user.paymentMethod?.brand || 'CARD'}
                    </div>
                    <div>
                      <span className="text-xs text-[#F4F3EF] font-mono font-semibold">
                        •••• •••• •••• {user.paymentMethod?.last4 || '4242'}
                      </span>
                      <span className="text-[10px] text-[#9A9EA6] font-mono block">
                        Expires {user.paymentMethod?.expMonth}/{user.paymentMethod?.expYear}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenStripePortal}
                    className="text-[10px] text-[#D6AF62] hover:underline flex items-center gap-1 font-mono"
                  >
                    Update in Stripe <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#F4F3EF] font-mono">Billing History &amp; Invoices</span>
                {invoices.length === 0 ? (
                  <div className="p-6 text-center text-[#9A9EA6] bg-[#08090B] rounded-xl border border-[#1E2228] font-mono text-xs">
                    No invoices generated yet for this account.
                  </div>
                ) : (
                  <div className="divide-y divide-[#1E2228] bg-[#08090B] rounded-xl border border-[#1E2228] overflow-hidden font-mono">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="p-3 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-[#F4F3EF]">{inv.number}</span>
                          <span className="text-[10px] text-[#9A9EA6] block">
                            {new Date(inv.created).toLocaleDateString()} · {inv.interval}ly
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-[#F4F3EF]">€{inv.amount.toFixed(2)}</span>
                          <span className="px-2 py-0.5 rounded bg-[#1C170E] text-[#6FCF97] text-[10px] font-bold border border-[#6FCF97]/30">
                            PAID
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Usage & Quotas */}
          {activeTab === 'usage' && (
            <div className="space-y-4">
              <UsageMeter usage={usage} isPro={isPro} onUpgradeClick={onUpgradeClick} />

              <div className="bg-[#08090B] p-4 rounded-xl border border-[#1E2228] space-y-2 text-[11px] text-[#9A9EA6]">
                <strong className="text-[#F4F3EF] font-mono">Tier Entitlement Limits:</strong>
                <ul className="list-disc list-inside space-y-1 text-[#9A9EA6]">
                  <li>Free: 5 Standard 16-bit PCM exports per 30-day period</li>
                  <li>Pro: Unlimited 16-bit, 24-bit Studio, and 32-bit Float master renders</li>
                  <li>Processing: Non-blocking client-side Web Worker pipeline</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: Export History */}
          {activeTab === 'exports' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F4F3EF] font-mono">Recent Master Audio Exports</span>
                <span className="text-[10px] text-[#9A9EA6] font-mono">{exportHistory.length} tracks rendered</span>
              </div>

              {exportHistory.length === 0 ? (
                <div className="p-6 text-center text-[#9A9EA6] bg-[#08090B] rounded-xl border border-[#1E2228] font-mono text-xs">
                  No audio tracks exported yet. Load a track and export to see logs here.
                </div>
              ) : (
                <div className="divide-y divide-[#1E2228] bg-[#08090B] rounded-xl border border-[#1E2228] overflow-hidden font-mono">
                  {exportHistory.map((exp) => (
                    <div key={exp.id} className="p-3 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-[#F4F3EF]">{exp.filename}</span>
                        <div className="flex items-center gap-2 text-[10px] text-[#9A9EA6]">
                          <span>{exp.format}</span>
                          <span>•</span>
                          <span>{new Date(exp.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="text-[#D6AF62]">{exp.profileName}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#14171B] text-[#D6AF62] text-[10px] font-bold border border-[#24282D]">
                        {exp.tier}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Privacy & GDPR Rights */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#08090B] border border-[#1E2228] space-y-2 text-[#9A9EA6]">
                <div className="font-semibold text-[#F4F3EF] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#6FCF97]" />
                  <span>GDPR Compliance &amp; Data Rights</span>
                </div>
                <p>
                  Because audio mastering is executed in-browser, no audio files or waveforms are stored on our servers. You have complete rights to access, export, or delete your account records at any time.
                </p>
                {onNavigateToDataRequest && (
                  <button
                    type="button"
                    onClick={() => { onClose(); onNavigateToDataRequest(); }}
                    className="text-[#D6AF62] underline font-medium block pt-1"
                  >
                    Submit formal GDPR Data Subject Access / Portability Request &rarr;
                  </button>
                )}
              </div>

              {/* Account Deletion */}
              <div className="p-4 rounded-xl bg-[#171012] border border-[#3D1E22] space-y-3">
                <div className="flex items-center gap-2 text-[#E56B6B] font-semibold">
                  <Trash2 className="w-4 h-4" />
                  <span>Permanent Account Deletion (GDPR Art. 17)</span>
                </div>
                <p className="text-[11px] text-[#9A9EA6]">
                  Deleting your account will immediately terminate your subscription access, purge your profile records from local storage, and schedule removal of all personal identifiers. Statutory tax invoices are retained in anonymized form as required by EU law.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-2 bg-[#2D161A] hover:bg-[#3D1E24] text-[#E56B6B] border border-[#E56B6B]/40 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Request Account Deletion
                  </button>
                ) : (
                  <div className="p-3 bg-[#0E0C0D] rounded-lg border border-[#E56B6B]/40 space-y-2">
                    <div className="text-xs text-[#F4F3EF]">
                      Type <strong className="text-[#E56B6B]">DELETE</strong> to confirm permanent erasure:
                    </div>
                    <input
                      type="text"
                      value={deleteConfirmationInput}
                      onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full px-3 py-1.5 bg-[#171012] border border-[#3D1E22] rounded text-xs text-[#F4F3EF] outline-none"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={deleteConfirmationInput !== 'DELETE' || isDeleting}
                        onClick={handleDeleteAccount}
                        className="px-3 py-1.5 bg-[#E56B6B] disabled:opacity-50 text-[#0E0C0D] font-bold rounded text-xs transition cursor-pointer"
                      >
                        {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmationInput(''); }}
                        className="px-3 py-1.5 bg-[#171A20] text-[#9A9EA6] rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#24282D] bg-[#08090B] flex items-center justify-between text-[11px] text-[#646A73] font-mono">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#6FCF97]" />
            <span>MasteringLocal.Pro Security &amp; Entitlement Invariant</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#9A9EA6] hover:text-[#F4F3EF] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
