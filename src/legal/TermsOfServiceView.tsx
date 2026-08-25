import React from 'react';
import { LEGAL_CONFIG } from './legal-config';
import { FileText, Shield, DollarSign, Award, AlertCircle } from 'lucide-react';

export interface TermsOfServiceViewProps {
  onNavigateToPrivacy?: () => void;
  onNavigateToSubscriptions?: () => void;
  onNavigateToRefunds?: () => void;
}

export const TermsOfServiceView: React.FC<TermsOfServiceViewProps> = ({
  onNavigateToPrivacy,
  onNavigateToSubscriptions,
  onNavigateToRefunds,
}) => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 md:px-8 text-left space-y-8 animate-fade-in">
      <div className="border-b border-[#242830] pb-6">
        <div className="flex items-center gap-2.5 text-[#B7F000] mb-2">
          <FileText className="w-5 h-5" />
          <span className="text-xs uppercase tracking-wider font-semibold">User Agreement</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#F2F2EE]">Terms of Service</h1>
        <p className="text-sm text-[#8E95A2] mt-1.5">
          Last updated: August 2026 · Governed by {LEGAL_CONFIG.governingLaw}
        </p>
      </div>

      {/* 1. Introduction and Scope */}
      <section className="space-y-3 text-sm text-[#A0A6B2] leading-relaxed">
        <h2 className="text-lg font-semibold text-[#F2F2EE]">1. Overview & Service Description</h2>
        <p>
          These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you and <strong>{LEGAL_CONFIG.businessName}</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), governing your access to and use of the MasteringLocal.Pro application and related web audio mastering software.
        </p>
        <p>
          MasteringLocal.Pro provides local-first digital audio mastering tools, parametric equalizers, dynamic range compressors, brickwall safety ceiling limiters, and telemetry analytics running directly within client web browsers.
        </p>
      </section>

      {/* 2. Subscriptions, Fees, and Renewals */}
      <section className="space-y-3 text-sm text-[#A0A6B2] leading-relaxed">
        <h2 className="text-lg font-semibold text-[#F2F2EE]">2. Subscriptions, Pricing & Automatic Renewal</h2>
        <div className="p-4 rounded-sm bg-[#121418] border border-[#2A2E35] space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-[#F2F2EE]">
            <DollarSign className="w-4 h-4 text-[#B7F000]" />
            <span>Subscription Plans & Pricing Structure</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[#8E95A2] pl-2">
            <li><strong>MasteringPro Free:</strong> €0.00 / month. Includes up to 5 standard 16-bit PCM master exports per monthly cycle.</li>
            <li><strong>MasteringPro Pro Monthly:</strong> €19.00 / month. Recurring monthly subscription unlocking unlimited 24-bit PCM & 32-bit Float WAV exports, advanced presets, and commercial licensing.</li>
            <li><strong>MasteringPro Pro Annual:</strong> €169.00 / year (equivalent to €14.08/month, saving €59/year). Recurring annual subscription with priority features and full commercial rights.</li>
          </ul>
        </div>
        <p>
          Paid subscriptions renew automatically at the end of each billing cycle (monthly or yearly) unless canceled prior to the renewal date. You may cancel your subscription at any time via your Account Dashboard or the Stripe Customer Portal.
        </p>
      </section>

      {/* 3. Audio Ownership & Commercial Release Rights */}
      <section className="space-y-3 text-sm text-[#A0A6B2] leading-relaxed">
        <h2 className="text-lg font-semibold text-[#F2F2EE]">3. User Content & 100% Commercial Release Rights</h2>
        <div className="p-4 rounded-sm bg-[#121418] border border-[#2E3540] space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-[#6FCF97]">
            <Award className="w-4 h-4 text-[#6FCF97]" />
            <span>Full Intellectual Property Ownership</span>
          </div>
          <p className="text-[#E1E4EA] leading-relaxed">
            You retain 100% exclusive intellectual property rights, copyright, and master recording ownership of all audio uploaded, processed, and exported through MasteringLocal.Pro. We claim zero ownership, royalties, or licensing claims over your musical compositions or sound recordings.
          </p>
          <p className="text-[#8E95A2]">
            Masters generated with an active Pro subscription are fully cleared for worldwide commercial distribution across streaming platforms (Spotify, Apple Music, Tidal), physical media (Vinyl, CD), broadcast television, and sync licensing.
          </p>
        </div>
      </section>

      {/* 4. Acceptable Use and Warranties */}
      <section className="space-y-3 text-sm text-[#A0A6B2] leading-relaxed">
        <h2 className="text-lg font-semibold text-[#F2F2EE]">4. Acceptable Use Policy</h2>
        <p>You agree not to use the service to:</p>
        <ul className="list-disc list-inside space-y-1 text-xs text-[#8E95A2] pl-2">
          <li>Infringe upon the copyright, patent, trademark, or trade secret rights of third parties.</li>
          <li>Reverse-engineer, decompile, or disassemble proprietary WebAssembly binary modules.</li>
          <li>Circumvent or attempt to tamper with client-side quota controls, subscription checks, or payment gateways.</li>
          <li>Transmit malicious payloads, viruses, or corrupted audio streams intended to cause denial of service.</li>
        </ul>
      </section>

      {/* 5. Limitation of Liability */}
      <section className="space-y-3 text-sm text-[#A0A6B2] leading-relaxed">
        <h2 className="text-lg font-semibold text-[#F2F2EE]">5. Limitation of Liability & Disclaimers</h2>
        <p className="text-xs text-[#8E95A2]">
          The software is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind, whether express or implied. To the maximum extent permitted by applicable law, the Company shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or loss of profits or revenue arising out of the use or inability to use the mastering software.
        </p>
      </section>

      {/* 6. Governing Law & Dispute Resolution */}
      <section className="space-y-3 text-sm text-[#A0A6B2] leading-relaxed">
        <h2 className="text-lg font-semibold text-[#F2F2EE]">6. Governing Law & Jurisdiction</h2>
        <p className="text-xs text-[#8E95A2]">
          These Terms and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with the <strong>{LEGAL_CONFIG.governingLaw}</strong>. In the event of disputes, the parties submit to the exclusive jurisdiction of the competent courts of {LEGAL_CONFIG.country}.
        </p>
      </section>

      {/* 7. Contact */}
      <section className="p-4 rounded-sm bg-[#14171D] border border-[#242830] text-xs text-[#8E95A2] space-y-1">
        <div className="font-semibold text-[#F2F2EE]">Legal Notice & Inquiries</div>
        <div>Entity: {LEGAL_CONFIG.businessName}</div>
        <div>Support: <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-[#B7F000] underline">{LEGAL_CONFIG.supportEmail}</a></div>
      </section>
    </div>
  );
};
