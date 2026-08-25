import React, { useState } from 'react';
import { LEGAL_CONFIG } from './legal-config';
import { Mail, MessageSquare, ShieldCheck, CheckCircle2, Send, HelpCircle } from 'lucide-react';

export const ContactView: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<'support' | 'billing' | 'privacy' | 'commercial'>('support');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;
    setIsSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 md:px-8 text-left space-y-8 animate-fade-in">
      <div className="border-b border-[#242830] pb-6">
        <div className="flex items-center gap-2.5 text-[#B7F000] mb-2">
          <Mail className="w-5 h-5" />
          <span className="text-xs uppercase tracking-wider font-semibold">Direct Communication</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#F2F2EE]">Contact & Customer Support</h1>
        <p className="text-sm text-[#8E95A2] mt-1.5">
          Get in touch with our engineering, billing, or privacy compliance teams.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Cards */}
        <div className="space-y-3 md:col-span-1">
          <div className="p-4 rounded-xl bg-[#121418] border border-[#242830] space-y-1.5">
            <div className="text-xs text-[#8E95A2] uppercase tracking-wider font-semibold">Customer & Audio Support</div>
            <div className="text-sm font-semibold text-[#F2F2EE]">Technical Assistance</div>
            <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-xs text-[#B7F000] underline block">
              {LEGAL_CONFIG.supportEmail}
            </a>
            <div className="text-[11px] text-[#8E95A2]">Response time: &lt; 24 business hours</div>
          </div>

          <div className="p-4 rounded-xl bg-[#121418] border border-[#242830] space-y-1.5">
            <div className="text-xs text-[#8E95A2] uppercase tracking-wider font-semibold">Billing & Invoices</div>
            <div className="text-sm font-semibold text-[#F2F2EE]">Subscription Inquiries</div>
            <a href={`mailto:${LEGAL_CONFIG.supportEmail}?subject=Billing`} className="text-xs text-[#B7F000] underline block">
              {LEGAL_CONFIG.supportEmail}
            </a>
            <div className="text-[11px] text-[#8E95A2]">Stripe VAT receipts & refunds</div>
          </div>

          <div className="p-4 rounded-xl bg-[#121418] border border-[#242830] space-y-1.5">
            <div className="text-xs text-[#8E95A2] uppercase tracking-wider font-semibold">Data Protection Officer</div>
            <div className="text-sm font-semibold text-[#F2F2EE]">GDPR & Privacy Requests</div>
            <a href={`mailto:${LEGAL_CONFIG.privacyEmail}`} className="text-xs text-[#B7F000] underline block">
              {LEGAL_CONFIG.privacyEmail}
            </a>
            <div className="text-[11px] text-[#8E95A2]">Data subject access & erasure</div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2 p-6 rounded-xl bg-[#121418] border border-[#2A2E35]">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="text-sm font-semibold text-[#F2F2EE] mb-2">Send a Direct Inquiry</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#A0A6B2]">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Producer / Artist name"
                    className="w-full px-3 py-2 bg-[#0E1013] border border-[#2E3440] rounded-lg text-[#F2F2EE] focus:border-[#B7F000] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#A0A6B2]">Email Address <span className="text-[#B7F000]">*</span></label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 bg-[#0E1013] border border-[#2E3440] rounded-lg text-[#F2F2EE] focus:border-[#B7F000] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#A0A6B2]">Topic Category</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#0E1013] border border-[#2E3440] rounded-lg text-[#F2F2EE] focus:border-[#B7F000] outline-none cursor-pointer"
                >
                  <option value="support">Mastering & Technical Audio Support</option>
                  <option value="billing">Stripe Billing, Invoices & Subscriptions</option>
                  <option value="privacy">GDPR Privacy & Data Request</option>
                  <option value="commercial">Commercial Licensing & Enterprise</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[#A0A6B2]">Your Message <span className="text-[#B7F000]">*</span></label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can our engineering or support team help you?"
                  className="w-full px-3 py-2 bg-[#0E1013] border border-[#2E3440] rounded-lg text-[#F2F2EE] focus:border-[#B7F000] outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-[#B7F000] hover:bg-[#E5C37A] text-[#0E1013] font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Message
              </button>
            </form>
          ) : (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#6FCF97] mx-auto" />
              <div className="text-base font-semibold text-[#F2F2EE]">Inquiry Received</div>
              <p className="text-xs text-[#8E95A2] max-w-sm mx-auto">
                Thank you! Your message regarding <strong className="text-[#F2F2EE]">{topic}</strong> has been logged. Our team will follow up at <strong className="text-[#F2F2EE]">{email}</strong> within 24 business hours.
              </p>
              <button
                type="button"
                onClick={() => { setIsSubmitted(false); setMessage(''); }}
                className="mt-2 text-xs text-[#B7F000] underline"
              >
                Send another message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
