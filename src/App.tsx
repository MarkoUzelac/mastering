import React, { useState, useEffect, useCallback } from 'react';
import { audioEngine } from './utils/audio-engine';
import { DEFAULT_PARAMS, MASTERING_PRESETS } from './utils/presets';
import {
  MasteringParams,
  MasteringPreset,
  MeterData,
  AudioTrackInfo,
} from './types';

// Header & Navigation
import { Header, ActiveTab } from './components/Header';
import { TrackHeader } from './components/TrackHeader';

// Studio Workspace Components
import { WaveformHero } from './components/WaveformHero';
import { MasterAnalysisPanel } from './components/MasterAnalysisPanel';
import { DynamicsMeters } from './components/DynamicsMeters';
import { TransportBar } from './components/TransportBar';
import { EqualizerModule } from './components/EqualizerModule';
import { CompressorModule } from './components/CompressorModule';
import { LimiterModule } from './components/LimiterModule';
import { MasterActionFooter } from './components/MasterActionFooter';

// Alternative Views
import { DashboardView } from './components/DashboardView';
import { AnalysisView } from './components/AnalysisView';
import { PresetsView } from './components/PresetsView';
import { LandingView } from './components/LandingView';

// Educational SEO Guides View
import { LearnGuidesView, GuideSlug } from './learn/LearnGuidesView';

// Legal & Compliance Views
import { PrivacyPolicyView } from './legal/PrivacyPolicyView';
import { TermsOfServiceView } from './legal/TermsOfServiceView';
import { SubscriptionTermsView } from './legal/SubscriptionTermsView';
import { CookiePolicyView } from './legal/CookiePolicyView';
import { RefundPolicyView } from './legal/RefundPolicyView';
import { ImprintView } from './legal/ImprintView';
import { ContactView } from './legal/ContactView';
import { DataRequestView } from './legal/DataRequestView';

// Cookie Consent Banner
import { CookieConsentBanner } from './components/CookieConsentBanner';

// Modals
import { ParityModal } from './components/ParityModal';
import { RuntimeAuditModal } from './components/RuntimeAuditModal';
import { ExportModal } from './components/ExportModal';
import { PricingModal } from './components/PricingModal';
import { CheckoutModal } from './components/CheckoutModal';
import { AccountModal } from './components/AccountModal';
import { UpgradeModal } from './components/UpgradeModal';

// Entitlement & Billing
import { entitlementService, UserEntitlement, UserUsage } from './billing/entitlement-service';
import { PlanId, FeatureKey } from './billing/billing-config';
import { FeatureGates } from './billing/feature-gates';
import { ArrowLeft, Shield, Scale, Cookie, FileText, RotateCcw, Building2, Mail } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<string>('mastering');
  const [initialGuideSlug, setInitialGuideSlug] = useState<GuideSlug>('how-to-master-music-online');

  // DSP & Track State
  const [params, setParams] = useState<MasteringParams>({ ...DEFAULT_PARAMS });
  const [isBypassed, setIsBypassed] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [currentTrack, setCurrentTrack] = useState<AudioTrackInfo | null>(null);
  const [activePresetId, setActivePresetId] = useState<string>('modern-streaming');

  // Entitlement & Billing State
  const [entitlement, setEntitlement] = useState<UserEntitlement>(entitlementService.getEntitlement());
  const [usage, setUsage] = useState<UserUsage>(entitlementService.getUsage());

  // Meter Data
  const [meterData, setMeterData] = useState<MeterData>({
    inputPeakL: -30,
    inputPeakR: -30,
    inputRmsL: -36,
    inputRmsR: -36,
    outputPeakL: -30,
    outputPeakR: -30,
    outputRmsL: -36,
    outputRmsR: -36,
    gainReductionDb: 0,
    limiterActive: false,
    momentaryLufs: -24,
    integratedLufs: -14.2,
    crestFactor: 12.4,
  });

  // Modal Visibility States
  const [isParityModalOpen, setIsParityModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [accountInitialTab, setAccountInitialTab] = useState<'subscription' | 'billing' | 'usage' | 'exports' | 'privacy'>('subscription');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanId>('pro_monthly');
  const [upgradeTargetFeature, setUpgradeTargetFeature] = useState<FeatureKey>('HIGH_RES_EXPORT');

  // Check URL pathname for direct deep links if any
  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/privacy/data-request')) {
      setActiveTab('data-request');
    } else if (path.includes('/privacy')) {
      setActiveTab('privacy');
    } else if (path.includes('/terms')) {
      setActiveTab('terms');
    } else if (path.includes('/subscriptions') || path.includes('/subscription-terms')) {
      setActiveTab('subscriptions');
    } else if (path.includes('/cookies')) {
      setActiveTab('cookies');
    } else if (path.includes('/refunds')) {
      setActiveTab('refunds');
    } else if (path.includes('/legal') || path.includes('/imprint')) {
      setActiveTab('legal');
    } else if (path.includes('/contact')) {
      setActiveTab('contact');
    } else if (path.includes('/pricing')) {
      setIsPricingModalOpen(true);
    } else if (path.includes('/learn/lufs-guide')) {
      setInitialGuideSlug('lufs-guide');
      setActiveTab('learn');
    } else if (path.includes('/learn/24-bit-vs-16-bit')) {
      setInitialGuideSlug('24-bit-vs-16-bit');
      setActiveTab('learn');
    } else if (path.includes('/learn/master-for-spotify')) {
      setInitialGuideSlug('master-for-spotify');
      setActiveTab('learn');
    } else if (path.includes('/learn/master-for-youtube')) {
      setInitialGuideSlug('master-for-youtube');
      setActiveTab('learn');
    } else if (path.includes('/learn')) {
      setActiveTab('learn');
    }
  }, []);

  // Initialize engine and synchronize entitlements
  useEffect(() => {
    loadDemoTrack('synthwave');

    const unsubscribe = entitlementService.subscribe((newEnt, newUsage) => {
      setEntitlement(newEnt);
      setUsage(newUsage);
    });

    entitlementService.fetchServerEntitlements().catch(console.error);

    audioEngine.setTimeUpdateCallback((time, totalDuration) => {
      setCurrentTime(time);
      setDuration(totalDuration);
    });

    audioEngine.setMeterUpdateCallback((meters) => {
      setMeterData(meters);
    });

    return () => {
      unsubscribe();
      audioEngine.stop();
    };
  }, []);

  const loadDemoTrack = (type: 'synthwave' | 'acoustic' | 'parity') => {
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentTime(0);

    const buffer = audioEngine.createDemoTrack(type);
    audioEngine.setAudioBuffer(buffer);

    const names = {
      synthwave: 'Synthwave Neon Horizon Master.wav',
      acoustic: 'Acoustic Resonance & Harmonics.wav',
      parity: 'Production Parity 100k Benchmark.wav',
    };

    setCurrentTrack({
      name: names[type],
      duration: buffer.duration,
      sampleRate: buffer.sampleRate,
      channels: buffer.numberOfChannels,
      buffer,
      sourceType: type === 'parity' ? 'synthetic' : 'demo',
    });
    setDuration(buffer.duration);
  };

  const handleFileUpload = async (file: File) => {
    try {
      audioEngine.stop();
      setIsPlaying(false);
      setCurrentTime(0);

      const buffer = await audioEngine.loadAudioFile(file);
      setCurrentTrack({
        name: file.name,
        duration: buffer.duration,
        sampleRate: buffer.sampleRate,
        channels: buffer.numberOfChannels,
        buffer,
        sourceType: 'file',
        fileSize: file.size,
      });
      setDuration(buffer.duration);
      setActiveTab('mastering');
    } catch (err) {
      console.error('Failed to load audio file:', err);
    }
  };

  const handleParamChange = useCallback((param: keyof MasteringParams, value: number) => {
    setParams((prev) => {
      const updated = { ...prev, [param]: value };
      audioEngine.setParams(updated);
      return updated;
    });
  }, []);

  const handleResetParams = () => {
    setParams({ ...DEFAULT_PARAMS });
    audioEngine.setParams({ ...DEFAULT_PARAMS });
  };

  const handleApplyPreset = (preset: MasteringPreset) => {
    const isProPreset = preset.proOnly || preset.isPro;
    if (isProPreset && !FeatureGates.isProUser()) {
      setUpgradeTargetFeature('ADVANCED_PRESETS');
      setIsUpgradeModalOpen(true);
      return;
    }
    setActivePresetId(preset.id);
    setParams({ ...preset.params });
    audioEngine.setParams({ ...preset.params });
  };

  const handleToggleBypass = () => {
    const next = !isBypassed;
    setIsBypassed(next);
    audioEngine.setBypass(next);
  };

  const handlePlay = () => {
    audioEngine.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    audioEngine.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (time: number) => {
    audioEngine.seek(time);
    setCurrentTime(time);
  };

  const handleOpenAccount = (tab: 'subscription' | 'billing' | 'usage' | 'exports' | 'privacy' = 'subscription') => {
    setAccountInitialTab(tab);
    setIsAccountModalOpen(true);
  };

  const handleOpenCheckout = (planId: PlanId) => {
    setSelectedPlanForCheckout(planId);
    setIsPricingModalOpen(false);
    setIsUpgradeModalOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const handleOpenUpgradePrompt = (featureKey: FeatureKey = 'HIGH_RES_EXPORT') => {
    setUpgradeTargetFeature(featureKey);
    setIsUpgradeModalOpen(true);
  };

  const isLegalView = [
    'privacy',
    'terms',
    'subscriptions',
    'cookies',
    'refunds',
    'legal',
    'contact',
    'data-request',
  ].includes(activeTab);

  return (
    <div className="min-h-screen bg-[#08090B] text-[#F4F3EF] flex flex-col font-sans selection:bg-[#D6AF62]/20 selection:text-[#D6AF62]">
      {/* Editorial Luxury Header */}
      <Header
        activeTab={activeTab as ActiveTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenParityModal={() => setIsParityModalOpen(true)}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenPricingModal={() => setIsPricingModalOpen(true)}
        onOpenAccountModal={handleOpenAccount}
        hasAudio={!!currentTrack}
        entitlement={entitlement}
        usage={usage}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        {/* If in a legal page, provide a back to studio button */}
        {isLegalView && (
          <div className="max-w-4xl mx-auto pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('mastering')}
              className="px-3.5 py-1.5 rounded-lg bg-[#14171D] hover:bg-[#1C2028] text-xs font-mono text-[#D6AF62] border border-[#242830] transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Mastering Console
            </button>
          </div>
        )}

        {/* VIEW 1: MASTERING STUDIO WORKSPACE */}
        {activeTab === 'mastering' && (
          <div className="space-y-6 animate-fade-in">
            {/* 1. Track Meta Header */}
            <TrackHeader
              track={currentTrack}
              duration={duration}
              onSelectDemo={loadDemoTrack}
              onFileUpload={handleFileUpload}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onOpenParity={() => setIsParityModalOpen(true)}
            />

            {/* 2. Hero Waveform Scrubber */}
            <WaveformHero
              currentTrack={currentTrack}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              isBypassed={isBypassed}
              onSeek={handleSeek}
            />

            {/* 3. Transport Controls Bar */}
            <TransportBar
              isPlaying={isPlaying}
              isBypassed={isBypassed}
              currentTime={currentTime}
              duration={duration}
              currentTrack={currentTrack}
              onPlay={handlePlay}
              onPause={handlePause}
              onStop={handleStop}
              onSeek={handleSeek}
              onToggleBypass={handleToggleBypass}
              onSelectDemo={loadDemoTrack}
              onFileUpload={handleFileUpload}
            />

            {/* 4. Analysis & Telemetry Panel (LUFS, True Peak, Crest, Spectrum) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8">
                <MasterAnalysisPanel
                  track={currentTrack}
                  meterData={meterData}
                  isPlaying={isPlaying}
                  isBypassed={isBypassed}
                  onOpenParity={() => setIsParityModalOpen(true)}
                />
              </div>
              <div className="lg:col-span-4">
                <DynamicsMeters
                  meterData={meterData}
                  isBypassed={isBypassed}
                />
              </div>
            </div>

            {/* 5. Precision DSP Modules Grid (EQ + Compressor + Limiter) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <EqualizerModule
                params={params}
                onChange={handleParamChange}
                onReset={handleResetParams}
                isBypassed={isBypassed}
              />
              <CompressorModule
                params={params}
                gainReductionDb={meterData.gainReductionDb}
                onChange={handleParamChange}
                onReset={handleResetParams}
                isBypassed={isBypassed}
              />
              <LimiterModule
                params={params}
                limiterActive={meterData.limiterActive}
                onChange={handleParamChange}
                meterData={meterData}
                isBypassed={isBypassed}
              />
            </div>

            {/* 6. Master Action Footer (Preset selection + Quick Master CTA) */}
            <MasterActionFooter
              presets={MASTERING_PRESETS}
              activePresetId={activePresetId}
              onSelectPreset={handleApplyPreset}
              onExportClick={() => setIsExportModalOpen(true)}
              onResetParams={handleResetParams}
              isBypassed={isBypassed}
              onToggleBypass={handleToggleBypass}
              onOpenParityModal={() => setIsParityModalOpen(true)}
              onOpenUpgradeModal={(feature) => handleOpenUpgradePrompt('ADVANCED_PRESETS')}
            />
          </div>
        )}

        {/* VIEW 2: DASHBOARD & PROJECTS */}
        {activeTab === 'dashboard' && (
          <DashboardView
            currentTrack={currentTrack}
            usage={usage}
            entitlement={entitlement}
            onOpenMastering={() => setActiveTab('mastering')}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onOpenPricingModal={() => setIsPricingModalOpen(true)}
            onOpenAccountModal={handleOpenAccount}
            onSelectDemoTrack={loadDemoTrack}
            onFileUpload={handleFileUpload}
          />
        )}

        {/* VIEW 3: SPECTRUM & PHASE ANALYSIS */}
        {activeTab === 'analysis' && (
          <AnalysisView
            currentTrack={currentTrack}
            meterData={meterData}
            isPlaying={isPlaying}
            isBypassed={isBypassed}
            onOpenParity={() => setIsParityModalOpen(true)}
          />
        )}

        {/* VIEW 4: PRESETS GALLERY */}
        {activeTab === 'presets' && (
          <PresetsView
            presets={MASTERING_PRESETS}
            activePresetId={activePresetId}
            onSelectPreset={handleApplyPreset}
            onOpenMastering={() => setActiveTab('mastering')}
            onOpenUpgradeModal={() => handleOpenUpgradePrompt('ADVANCED_PRESETS')}
          />
        )}

        {/* VIEW 5: LANDING & FEATURES */}
        {activeTab === 'landing' && (
          <LandingView
            onStartMastering={() => setActiveTab('mastering')}
            onOpenPricingModal={() => setIsPricingModalOpen(true)}
          />
        )}

        {/* VIEW 6: SEO & ACADEMY GUIDES */}
        {activeTab === 'learn' && (
          <LearnGuidesView
            initialSlug={initialGuideSlug}
            onTryMastering={() => setActiveTab('mastering')}
          />
        )}

        {/* VIEW 7: PRIVACY POLICY */}
        {activeTab === 'privacy' && (
          <PrivacyPolicyView
            onNavigateToTerms={() => setActiveTab('terms')}
            onNavigateToCookies={() => setActiveTab('cookies')}
            onNavigateToDataRequest={() => setActiveTab('data-request')}
          />
        )}

        {/* VIEW 8: TERMS OF SERVICE */}
        {activeTab === 'terms' && (
          <TermsOfServiceView
            onNavigateToPrivacy={() => setActiveTab('privacy')}
            onNavigateToSubscriptions={() => setActiveTab('subscriptions')}
            onNavigateToRefunds={() => setActiveTab('refunds')}
          />
        )}

        {/* VIEW 9: SUBSCRIPTION TERMS */}
        {activeTab === 'subscriptions' && (
          <SubscriptionTermsView
            onNavigateToTerms={() => setActiveTab('terms')}
            onNavigateToPrivacy={() => setActiveTab('privacy')}
            onNavigateToRefunds={() => setActiveTab('refunds')}
          />
        )}

        {/* VIEW 10: COOKIE POLICY */}
        {activeTab === 'cookies' && (
          <CookiePolicyView
            onNavigateToPrivacy={() => setActiveTab('privacy')}
          />
        )}

        {/* VIEW 11: REFUND POLICY */}
        {activeTab === 'refunds' && (
          <RefundPolicyView />
        )}

        {/* VIEW 12: LEGAL NOTICE / IMPRESSUM */}
        {activeTab === 'legal' && (
          <ImprintView />
        )}

        {/* VIEW 13: CONTACT & SUPPORT */}
        {activeTab === 'contact' && (
          <ContactView />
        )}

        {/* VIEW 14: GDPR DATA SUBJECT REQUEST */}
        {activeTab === 'data-request' && (
          <DataRequestView />
        )}
      </main>

      {/* Footer Legal & Navigation Bar */}
      <footer className="border-t border-[#24282D] bg-[#08090B] px-6 py-6 mt-auto text-xs text-[#8E95A2]">
        <div className="max-w-[1600px] mx-auto space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[#D6AF62] font-semibold font-mono">MASTERINGLOCAL.PRO</span>
              <span>·</span>
              <span>100% In-Browser 64-bit Audio DSP</span>
              <span>·</span>
              <span className="text-[#6FCF97]">Zero Audio Uploads</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('learn')}
                className="hover:text-[#D6AF62] transition-colors"
              >
                Guides &amp; LUFS
              </button>
              <button
                type="button"
                onClick={() => setIsPricingModalOpen(true)}
                className="hover:text-[#D6AF62] transition-colors"
              >
                Pricing &amp; Plans
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className="hover:text-[#D6AF62] transition-colors"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('terms')}
                className="hover:text-[#D6AF62] transition-colors"
              >
                Terms of Service
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('subscriptions')}
                className="hover:text-[#D6AF62] transition-colors"
              >
                Subscription Terms
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cookies')}
                className="hover:text-[#D6AF62] transition-colors"
              >
                Cookie Policy
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('refunds')}
                className="hover:text-[#D6AF62] transition-colors"
              >
                Refund Policy
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('legal')}
                className="hover:text-[#D6AF62] transition-colors"
              >
                Imprint / Legal
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contact')}
                className="hover:text-[#D6AF62] transition-colors"
              >
                Contact &amp; Support
              </button>
            </div>
          </div>

          <div className="border-t border-[#1C2028] pt-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#646A73]">
            <div>© {new Date().getFullYear()} MasteringLocal.Pro · All rights reserved. Direct client-side WebAssembly mastering.</div>
            <div className="flex items-center gap-3 mt-2 sm:mt-0">
              <button
                type="button"
                onClick={() => setActiveTab('data-request')}
                className="hover:text-[#8E95A2] underline"
              >
                GDPR Data Request
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setIsParityModalOpen(true)}
                className="hover:text-[#8E95A2] underline"
              >
                100k Parity Test
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(true)}
                className="hover:text-[#6FCF97] text-[#6FCF97]/80 underline font-mono"
              >
                E2E Runtime Audit
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      <CookieConsentBanner onOpenPolicy={() => setActiveTab('cookies')} />

      {/* MODALS */}
      <ParityModal
        isOpen={isParityModalOpen}
        onClose={() => setIsParityModalOpen(false)}
      />

      <RuntimeAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        track={currentTrack}
        params={params}
        onUpgradeClick={handleOpenUpgradePrompt}
      />

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onSelectPlan={handleOpenCheckout}
        currentPlan={entitlement.plan}
        onNavigateToTerms={() => { setIsPricingModalOpen(false); setActiveTab('terms'); }}
        onNavigateToPrivacy={() => { setIsPricingModalOpen(false); setActiveTab('privacy'); }}
        onNavigateToRefunds={() => { setIsPricingModalOpen(false); setActiveTab('refunds'); }}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        initialPlanId={selectedPlanForCheckout}
        onSuccess={() => {
          setIsCheckoutModalOpen(false);
          setIsAccountModalOpen(true);
        }}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onUpgradeClick={() => {
          setIsAccountModalOpen(false);
          setIsPricingModalOpen(true);
        }}
        initialTab={accountInitialTab}
        onNavigateToDataRequest={() => setActiveTab('data-request')}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        featureKey={upgradeTargetFeature}
        onUpgradeClick={() => {
          setIsUpgradeModalOpen(false);
          handleOpenCheckout('pro_monthly');
        }}
      />
    </div>
  );
};
