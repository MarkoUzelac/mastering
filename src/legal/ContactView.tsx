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
    
    // Use mailto for client-side sending without backend API keys
    const subject = encodeURIComponent(`[${topic.toUpperCase()}] Inquiry from ${name || 'User'}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\nMessage:\n${message}`);
    window.location.href = `mailto:info@markouzelacuzy.com?subject=${subject}&body=${body}`;
    
    setIsSubmitted(true);
  };


  return (
    <div className="max-w-4xl mx-auto py-10 px-4 md:px-8 text-left space-y-8 animate-fade-in">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <div className="flex items-center gap-2.5 text-[var(--accent-lime)] mb-2">
          <Mail className="w-5 h-5" />
          <span className="text-xs uppercase tracking-wider font-semibold">Direct Communication</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Contact & Customer Support</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1.5">
          Get in touch with our engineering, billing, or privacy compliance teams.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Cards */}
        <div className="space-y-3 md:col-span-1">
          <div className="p-4 rounded-sm bg-[#121418] border border-[var(--border-subtle)] space-y-1.5">
            <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Customer & Audio Support</div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Technical Assistance</div>
            <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-xs text-[var(--accent-lime)] underline block">
              {LEGAL_CONFIG.supportEmail}
            </a>
            <div className="text-[11px] text-[var(--text-tertiary)]">Response time: &lt; 24 business hours</div>
          </div>

          <div className="p-4 rounded-sm bg-[#121418] border border-[var(--border-subtle)] space-y-1.5">
            <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Billing & Invoices</div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Subscription Inquiries</div>
            <a href={`mailto:${LEGAL_CONFIG.supportEmail}?subject=Billing`} className="text-xs text-[var(--accent-lime)] underline block">
              {LEGAL_CONFIG.supportEmail}
            </a>
            <div className="text-[11px] text-[var(--text-tertiary)]">Stripe VAT receipts & refunds</div>
          </div>

          <div className="p-4 rounded-sm bg-[#121418] border border-[var(--border-subtle)] space-y-1.5">
            <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Data Protection Officer</div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">GDPR & Privacy Requests</div>
            <a href={`mailto:${LEGAL_CONFIG.privacyEmail}`} className="text-xs text-[var(--accent-lime)] underline block">
              {LEGAL_CONFIG.privacyEmail}
            </a>
            <div className="text-[11px] text-[var(--text-tertiary)]">Data subject access & erasure</div>
          </div>

          <div className="p-4 rounded-sm bg-[#121418] border border-[var(--border-subtle)] space-y-1.5">
            <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Direct Chat</div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">WhatsApp Support</div>
            <a href="https://wa.me/385989630462" target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent-lime)] underline block flex items-center gap-1 mt-1">
              <MessageSquare className="w-3.5 h-3.5" /> +385 98 963 0462
            </a>
            <div className="text-[11px] text-[var(--text-tertiary)]">Fast text support</div>
          </div>

        </div>

        {/* Contact Form */}
        <div className="md:col-span-2 p-6 rounded-sm bg-[#121418] border border-[#2A2E35]">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">Send a Direct Inquiry</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[var(--text-secondary)]">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Producer / Artist name"
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm text-[var(--text-primary)] focus:border-[var(--accent-lime)] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[var(--text-secondary)]">Email Address <span className="text-[var(--accent-lime)]">*</span></label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm text-[var(--text-primary)] focus:border-[var(--accent-lime)] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--text-secondary)]">Topic Category</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm text-[var(--text-primary)] focus:border-[var(--accent-lime)] outline-none cursor-pointer"
                >
                  <option value="support">Mastering & Technical Audio Support</option>
                  <option value="billing">Stripe Billing, Invoices & Subscriptions</option>
                  <option value="privacy">GDPR Privacy & Data Request</option>
                  <option value="commercial">Commercial Licensing & Enterprise</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--text-secondary)]">Your Message <span className="text-[var(--accent-lime)]">*</span></label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can our engineering or support team help you?"
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm text-[var(--text-primary)] focus:border-[var(--accent-lime)] outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-[var(--accent-lime)] hover:bg-[var(--accent-lime-hover)] text-[var(--bg-secondary)] font-semibold rounded-sm transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Message
              </button>
            </form>
          ) : (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#6FCF97] mx-auto" />
              <div className="text-base font-semibold text-[var(--text-primary)]">Inquiry Received</div>
              <p className="text-xs text-[var(--text-tertiary)] max-w-sm mx-auto">
                Thank you! Your message regarding <strong className="text-[var(--text-primary)]">{topic}</strong> has been logged. Our team will follow up at <strong className="text-[var(--text-primary)]">{email}</strong> within 24 business hours.
              </p>
              <button
                type="button"
                onClick={() => { setIsSubmitted(false); setMessage(''); }}
                className="mt-2 text-xs text-[var(--accent-lime)] underline"
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
