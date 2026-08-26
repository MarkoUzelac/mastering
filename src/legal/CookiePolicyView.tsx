import React from 'react';
import { LEGAL_CONFIG, ACTUAL_COOKIE_INVENTORY } from './legal-config';
import { Cookie, Shield, CheckCircle2, Settings } from 'lucide-react';

export interface CookiePolicyViewProps {
  onNavigateToPrivacy?: () => void;
}

export const CookiePolicyView: React.FC<CookiePolicyViewProps> = ({ onNavigateToPrivacy }) => {
  const handleOpenConsentModal = () => {
    window.dispatchEvent(new CustomEvent('open-cookie-settings'));
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 md:px-8 text-left space-y-8 animate-fade-in">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <div className="flex items-center gap-2.5 text-[var(--accent-lime)] mb-2">
          <Cookie className="w-5 h-5" />
          <span className="text-xs uppercase tracking-wider font-semibold">Compliance & Transparency</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Cookie Policy</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1.5">
          Last updated: August 2026 · Compliant with EU ePrivacy Directive & GDPR Art. 13
        </p>
      </div>

      {/* Summary Box */}
      <div className="p-5 rounded-sm bg-[#121418] border border-[#2A2E35] space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Shield className="w-4 h-4 text-[var(--accent-lime)]" />
          <span>Core Privacy Principle</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          MasteringLocal.Pro is architected around local-first processing. Your audio files are processed inside your browser&apos;s WebAssembly / Web Audio runtime and are <strong className="text-[var(--text-primary)]">never uploaded to our servers</strong>. Cookies and local storage mechanisms on this website are strictly limited to session security, quota management, and optional preferences.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleOpenConsentModal}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-[#1F232B] hover:bg-[#282F3A] border border-[#343B48] text-xs font-semibold text-[var(--text-primary)] transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-[var(--accent-lime)]" />
            Manage Your Cookie Preferences
          </button>
        </div>
      </div>

      {/* Section 1 */}
      <section className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">1. What are Cookies and Local Storage?</h2>
        <p>
          Cookies are small text files placed on your device by websites you visit. In modern web applications, client-side storage technologies such as <code>localStorage</code> and <code>sessionStorage</code> are also used to store necessary operational states locally on your device without transmitting unnecessary tracking payloads to remote servers.
        </p>
      </section>

      {/* Section 2: Real Cookie Inventory Table */}
      <section className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">2. Inventory of Used Storage & Cookies</h2>
        <p className="text-xs text-[var(--text-tertiary)]">
          Below is the complete, transparent inventory of first-party storage keys used by the MasteringLocal.Pro application:
        </p>

        <div className="overflow-x-auto border border-[var(--border-subtle)] rounded-sm bg-[var(--bg-secondary)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                <th className="p-3 font-semibold">Key Name</th>
                <th className="p-3 font-semibold">Category</th>
                <th className="p-3 font-semibold">Purpose</th>
                <th className="p-3 font-semibold">Storage</th>
                <th className="p-3 font-semibold">Duration</th>
                <th className="p-3 font-semibold">Legal Basis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D2128]">
              {ACTUAL_COOKIE_INVENTORY.map((item) => (
                <tr key={item.name} className="hover:bg-[#12151B] transition-colors">
                  <td className="p-3 font-mono text-[var(--accent-lime)] text-[11px] whitespace-nowrap">{item.name}</td>
                  <td className="p-3 capitalize text-[var(--text-primary)]">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      item.category === 'necessary' ? 'bg-[#1C241E] text-[#6FCF97] border border-[#27402F]' :
                      item.category === 'preferences' ? 'bg-[#252219] text-[#E0B86B] border border-[#483B22]' :
                      'bg-[#1B212D] text-[#82AAFF] border border-[#253554]'
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="p-3 text-[var(--text-secondary)] min-w-[200px]">{item.purpose}</td>
                  <td className="p-3 text-[var(--text-tertiary)] font-mono text-[11px]">{item.storageType}</td>
                  <td className="p-3 text-[var(--text-tertiary)] whitespace-nowrap">{item.duration}</td>
                  <td className="p-3 text-[var(--text-tertiary)] text-[11px]">{item.legalBasis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Managing and Revoking Consent */}
      <section className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">3. How to Manage or Revoke Your Consent</h2>
        <p>
          You can adjust or revoke your optional cookie permissions at any time by clicking the <strong>Cookie Preferences</strong> link in the application footer or using the button at the top of this policy.
        </p>
        <p>
          Additionally, all modern browsers allow you to inspect, filter, or delete cookies and client-side storage keys via browser developer tools or settings menus (Settings &rarr; Privacy & Security &rarr; Clear Browsing Data).
        </p>
      </section>

      {/* Section 4: Contact */}
      <section className="p-4 rounded-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-tertiary)] space-y-1">
        <div className="font-semibold text-[var(--text-primary)]">Data Protection Questions</div>
        <div>Entity: {LEGAL_CONFIG.businessName}</div>
        <div>Support & Privacy Contact: <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-[var(--accent-lime)] underline">{LEGAL_CONFIG.supportEmail}</a></div>
      </section>
    </div>
  );
};
