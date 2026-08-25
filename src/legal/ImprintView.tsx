import React from 'react';
import { LEGAL_CONFIG } from './legal-config';
import { Building2, Mail, Globe, Scale, AlertCircle } from 'lucide-react';

export const ImprintView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 md:px-8 text-left space-y-8 animate-fade-in">
      <div className="border-b border-[#242830] pb-6">
        <div className="flex items-center gap-2.5 text-[#B7F000] mb-2">
          <Building2 className="w-5 h-5" />
          <span className="text-xs uppercase tracking-wider font-semibold">Legal Notice / Impressum</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#F2F2EE]">Legal Notice / Imprint</h1>
        <p className="text-sm text-[#8E95A2] mt-1.5">
          Information pursuant to statutory e-commerce and commercial disclosure obligations (e.g. EU E-Commerce Directive 2000/31/EC).
        </p>
      </div>

      {/* Configuration Status Notice if placeholders are present */}
      {!LEGAL_CONFIG.isConfigurationComplete && (
        <div className="p-4 rounded-xl bg-[#171A20] border border-[#2D333F] flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#B7F000] shrink-0 mt-0.5" />
          <div className="text-xs text-[#8E95A2] space-y-1">
            <span className="font-semibold text-[#F2F2EE]">Statutory Compliance Disclosure:</span>
            <p>
              The business registry, address, and VAT entity details below reflect the configuration template. Any values marked <code className="text-[#B7F000] bg-[#111317] px-1 py-0.5 rounded">REQUIRED_CONFIGURATION</code> must be configured via production environment variables prior to commercial deployment.
            </p>
          </div>
        </div>
      )}

      {/* Main Entity Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-5 rounded-xl bg-[#121418] border border-[#242830] space-y-3">
          <div className="font-semibold text-[#F2F2EE] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#B7F000]" />
            <span>Service Provider & Legal Entity</span>
          </div>
          <div className="space-y-1.5 text-[#A0A6B2]">
            <div><strong className="text-[#F2F2EE]">Legal Entity:</strong> {LEGAL_CONFIG.businessName}</div>
            <div><strong className="text-[#F2F2EE]">Trading Name:</strong> {LEGAL_CONFIG.tradingName}</div>
            <div><strong className="text-[#F2F2EE]">Registered Address:</strong> {LEGAL_CONFIG.registeredAddress}</div>
            <div><strong className="text-[#F2F2EE]">Country:</strong> {LEGAL_CONFIG.country}</div>
            <div><strong className="text-[#F2F2EE]">Commercial Register ID:</strong> {LEGAL_CONFIG.registrationNumber}</div>
            <div><strong className="text-[#F2F2EE]">VAT Identification (OIB / UID):</strong> {LEGAL_CONFIG.vatId}</div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#121418] border border-[#242830] space-y-3">
          <div className="font-semibold text-[#F2F2EE] flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#B7F000]" />
            <span>Contact & Representative</span>
          </div>
          <div className="space-y-1.5 text-[#A0A6B2]">
            <div><strong className="text-[#F2F2EE]">Authorized Representative:</strong> {LEGAL_CONFIG.legalRepresentative}</div>
            <div><strong className="text-[#F2F2EE]">Customer Support:</strong> <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-[#B7F000]">{LEGAL_CONFIG.supportEmail}</a></div>
            <div><strong className="text-[#F2F2EE]">Data Protection Officer:</strong> <a href={`mailto:${LEGAL_CONFIG.privacyEmail}`} className="text-[#B7F000]">{LEGAL_CONFIG.privacyEmail}</a></div>
            <div><strong className="text-[#F2F2EE]">Platform URL:</strong> https://masteringlocal.pro</div>
          </div>
        </div>
      </div>

      {/* Online Dispute Resolution */}
      <section className="space-y-3 text-sm text-[#A0A6B2] leading-relaxed">
        <h2 className="text-lg font-semibold text-[#F2F2EE]">EU Online Dispute Resolution (ODR)</h2>
        <p className="text-xs text-[#8E95A2]">
          The European Commission provides an online dispute resolution platform for consumers, which can be found at <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#B7F000] underline">https://ec.europa.eu/consumers/odr</a>. We are not obliged and generally not willing to participate in dispute settlement proceedings before a consumer arbitration board.
        </p>
      </section>
    </div>
  );
};
