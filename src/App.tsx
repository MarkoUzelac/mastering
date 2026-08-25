import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { audioEngine } from './utils/audio-engine';
import { DEFAULT_PARAMS, MASTERING_PRESETS } from './utils/presets';
import {
  MasteringParams,
  MasteringPreset,
  MeterData,
  AudioTrackInfo,
} from './types';

// Header & Navigation Components
import { Header, ActiveTab } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TrackHeader } from './components/TrackHeader';
import { MobileBottomNav } from './components/MobileBottomNav';

// Workstation DSP Components
import { WaveformHero } from './components/WaveformHero';
import { ProcessingChain, AdvancedParamsState } from './components/ProcessingChain';
import { BottomCards, HistorySnapshotItem } from './components/BottomCards';
import { RightAnalysisPanel } from './components/RightAnalysisPanel';
import { TransportBar } from './components/TransportBar';

// Alternative Views
import { DashboardView } from './components/DashboardView';
import { AnalysisView } from './components/AnalysisView';
import { PresetsView } from './components/PresetsView';
import { LandingView } from './components/LandingView';

// Educational Guides View
import { LearnGuidesView, GuideSlug } from './learn/LearnGuidesView';

// Admin Panel View
import { AdminPanelView } from './components/AdminPanelView';

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
import { AdvancedModuleModal } from './components/AdvancedModuleModal';
import { ReferenceTargetModal, REFERENCE_TARGETS, ReferenceTarget } from './components/ReferenceTargetModal';
import { LoudnessDetailsModal } from './components/LoudnessDetailsModal';
import { StemsModal } from './components/StemsModal';
import { HistoryModal } from './components/HistoryModal';

// Entitlement & Billing
import { entitlementService, UserEntitlement, UserUsage } from './billing/entitlement-service';
import { PlanId, FeatureKey } from './billing/billing-config';
import { FeatureGates } from './billing/feature-gates';
import { soundHaptics } from './utils/sound-haptics';
import { ArrowLeft } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<string>('mastering');
  const [initialGuideSlug, setInitialGuideSlug] = useState<GuideSlug>('how-to-master-music-online');

  // DSP & Track State
  const [params, setParams] = useState<MasteringParams>({ ...DEFAULT_PARAMS });
  const [advancedParams, setAdvancedParams] = useState<AdvancedParamsState>({
    lowFreq: 80,
    midFreq: 1200,
    highFreq: 8000,
    lowQ: 0.707,
    midQ: 1.0,
    highQ: 0.707,
    knee: 4.0,
    attack: 25.0,
    release: 120.0,
    drive: 35.0,
    warmth: 40.0,
    mix: 100.0,
    width: 110.0,
    balance: 0.0,
    phaseInvert: false,
    ceiling: -1.0,
    limiterRelease: 80.0,
    lookahead: 3.0,
    truePeak: true,
  });

  const [isBypassed, setIsBypassed] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(225.782);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isMono, setIsMono] = useState<boolean>(false);
  const [loopRegion, setLoopRegion] = useState<{ start: number; end: number; enabled: boolean }>({
    start: 30,
    end: 75,
    enabled: false,
  });
  const [currentTrack, setCurrentTrack] = useState<AudioTrackInfo | null>(null);
  const [activePresetId, setActivePresetId] = useState<string>('modern-streaming');
  const [selectedTarget, setSelectedTarget] = useState<ReferenceTarget>(REFERENCE_TARGETS[0]);
  const [isMasteringInProgress, setIsMasteringInProgress] = useState<boolean>(false);

  // Undo / Redo History Stack
  const historyStack = useRef<MasteringParams[]>([{ ...DEFAULT_PARAMS }]);
  const historyIndex = useRef<number>(0);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Entitlement & Billing State
  const [entitlement, setEntitlement] = useState<UserEntitlement>(entitlementService.getEntitlement());
  const [usage, setUsage] = useState<UserUsage>(entitlementService.getUsage());

  // Meter Data
  const [meterData, setMeterData] = useState<MeterData>({
    inputPeakL: -3.2,
    inputPeakR: -3.4,
    inputRmsL: -14.6,
    inputRmsR: -14.8,
    outputPeakL: -0.9,
    outputPeakR: -0.9,
    outputRmsL: -11.2,
    outputRmsR: -11.4,
    gainReductionDb: 2.1,
    limiterActive: true,
    momentaryLufs: -9.7,
    integratedLufs: -10.8,
    crestFactor: 8.4,
  });

  // History snapshots list
  const [snapshots, setSnapshots] = useState<HistorySnapshotItem[]>([
    { id: '1', time: '14:23:05', name: 'EQ Low Shelf Boost', target: 'Spotify (-14 LUFS)', params: { ...DEFAULT_PARAMS } },
    { id: '2', time: '14:20:12', name: 'Dynamics Glue VCA', target: 'Club/EDM (-9 LUFS)', params: { ...DEFAULT_PARAMS } },
    { id: '3', time: '14:15:48', name: 'Tape Harmonics Mix', target: 'Spotify (-14 LUFS)', params: { ...DEFAULT_PARAMS } },
  ]);

  // Modal Visibility States
  const [activeAdvancedModal, setActiveAdvancedModal] = useState<'eq' | 'dynamics' | 'saturation' | 'stereo' | 'limiter' | null>(null);
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState<boolean>(false);
  const [isLoudnessModalOpen, setIsLoudnessModalOpen] = useState<boolean>(false);
  const [isStemsModalOpen, setIsStemsModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
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

  // Push to Undo history
  const pushHistory = (newParams: MasteringParams) => {
    const currentHistory = historyStack.current.slice(0, historyIndex.current + 1);
    currentHistory.push({ ...newParams });
    historyStack.current = currentHistory;
    historyIndex.current = currentHistory.length - 1;
    setCanUndo(historyIndex.current > 0);
    setCanRedo(false);
  };

  const handleUndo = () => {
    if (historyIndex.current > 0) {
      soundHaptics.playSwitchSound(false);
      historyIndex.current -= 1;
      const targetParams = historyStack.current[historyIndex.current];
      setParams({ ...targetParams });
      audioEngine.setParams({ ...targetParams });
      setCanUndo(historyIndex.current > 0);
      setCanRedo(true);
    }
  };

  const handleRedo = () => {
    if (historyIndex.current < historyStack.current.length - 1) {
      soundHaptics.playSwitchSound(true);
      historyIndex.current += 1;
      const targetParams = historyStack.current[historyIndex.current];
      setParams({ ...targetParams });
      audioEngine.setParams({ ...targetParams });
      setCanUndo(true);
      setCanRedo(historyIndex.current < historyStack.current.length - 1);
    }
  };

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
      if (totalDuration && totalDuration > 0) setDuration(totalDuration);
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
      pushHistory(updated);
      return updated;
    });
  }, []);

  const handleAdvancedParamChange = useCallback(
    <K extends keyof AdvancedParamsState>(key: K, value: AdvancedParamsState[K]) => {
      setAdvancedParams((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleResetParams = () => {
    setParams({ ...DEFAULT_PARAMS });
    audioEngine.setParams({ ...DEFAULT_PARAMS });
    pushHistory({ ...DEFAULT_PARAMS });
    soundHaptics.playResetSound();
  };

  const handleApplyPreset = (preset: MasteringPreset) => {
    const isProPreset = preset.proOnly || preset.isPro;
    if (isProPreset && !FeatureGates.isProUser()) {
      setUpgradeTargetFeature('ADVANCED_PRESETS');
      setIsUpgradeModalOpen(true);
      return;
    }
    soundHaptics.playPresetClick();
    setActivePresetId(preset.id);
    setParams({ ...preset.params });
    audioEngine.setParams({ ...preset.params });
    pushHistory({ ...preset.params });

    // Add to history snapshots
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setSnapshots((prev) => [
      { id: Date.now().toString(), time: timeStr, name: preset.name, target: `${selectedTarget.platform} (${selectedTarget.targetLufs} LUFS)`, params: { ...preset.params } },
      ...prev.slice(0, 4),
    ]);
  };

  const handleRestoreSnapshot = (snapshot: HistorySnapshotItem) => {
    if (snapshot.params) {
      soundHaptics.playPresetClick();
      setParams({ ...snapshot.params });
      audioEngine.setParams({ ...snapshot.params });
      pushHistory({ ...snapshot.params });
    }
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

  const handleToggleMono = () => {
    setIsMono((prev) => {
      const next = !prev;
      handleAdvancedParamChange('width', next ? 0 : 100);
      return next;
    });
  };

  const handleToggleLoop = () => {
    setIsLooping((prev) => !prev);
    setLoopRegion((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleTriggerMaster = () => {
    soundHaptics.playSwitchSound(true);
    setIsMasteringInProgress(true);
    setTimeout(() => {
      setIsMasteringInProgress(false);
      soundHaptics.playSuccessSound();
      setIsExportModalOpen(true);
    }, 900);
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

  const getSeoInfo = () => {
    if (isPricingModalOpen) {
      return { title: 'Pricing & Pro Plans | MasteringLocal.Pro', description: 'Upgrade to MasteringLocal.Pro for high-resolution exports and advanced dynamics processing.' };
    }

    if (isLegalView) {
      const legalTitles: Record<string, string> = {
        'privacy': 'Privacy Policy',
        'terms': 'Terms of Service',
        'subscriptions': 'Subscription Terms',
        'cookies': 'Cookie Policy',
        'refunds': 'Refund Policy',
        'legal': 'Legal Imprint',
        'contact': 'Contact Support',
        'data-request': 'Data Request'
      };
      const pageTitle = legalTitles[activeTab] || 'Legal';
      return { title: `${pageTitle} | MasteringLocal.Pro`, description: `View the ${pageTitle} for MasteringLocal.Pro.` };
    }

    switch(activeTab) {
      case 'landing':
        return { title: 'MasteringLocal.Pro — Professional Audio Mastering', description: 'Studio-grade audio mastering console. 100% in your browser. No audio uploads, zero server processing.' };
      case 'mastering':
        return { title: 'Mastering Workspace | MasteringLocal.Pro', description: 'Professional audio mastering workstation with zero latency DSP.' };
      case 'analysis':
        return { title: 'Loudness & Analysis | MasteringLocal.Pro', description: 'Real-time true peak and LUFS analysis for audio mastering.' };
      case 'presets':
        return { title: 'Mastering Presets | MasteringLocal.Pro', description: 'Professional mastering presets for Spotify, Apple Music, and Club.' };
      case 'learn':
        return { title: 'Learn Audio Mastering | MasteringLocal.Pro', description: 'Educational guides on LUFS, True Peak, and audio dynamics.' };
      case 'admin':
        return { title: 'Admin Control Panel | MasteringLocal.Pro', description: 'Platform administration.' };
      default:
        return { title: 'MasteringLocal.Pro — Professional Audio Mastering', description: 'Studio-grade audio mastering console.' };
    }
  };

  const seo = getSeoInfo();

  return (
    <HelmetProvider>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content="https://masteringlocal.pro" />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.description} />
      </Helmet>
      <div className="min-h-screen bg-[#090A08] text-[#F2F2EE] flex flex-col font-sans selection:bg-[#B7F000]/30 selection:text-[#B7F000]">
      {/* Top Header */}
      <Header
        activeTab={activeTab as ActiveTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenParityModal={() => setIsParityModalOpen(true)}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenPricingModal={() => setIsPricingModalOpen(true)}
        onOpenAccountModal={handleOpenAccount}
        onOpenSettingsModal={() => handleOpenAccount('subscription')}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        hasAudio={!!currentTrack}
        entitlement={entitlement}
        usage={usage}
        onUploadClick={() => loadDemoTrack('synthwave')}
      />

      {/* Main Container Layout */}
      <div className="flex-1 flex w-full max-w-[1920px] mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          activeItem={activeTab}
          onSelectItem={(item) => {
            if (item === 'stems') {
              setIsStemsModalOpen(true);
            } else if (item === 'loudness') {
              setIsLoudnessModalOpen(true);
            } else if (item === 'history') {
              setIsHistoryModalOpen(true);
            } else if (item === 'settings') {
              handleOpenAccount('subscription');
            } else {
              setActiveTab(item);
            }
          }}
          onUpgradeClick={() => setIsPricingModalOpen(true)}
        />

        {/* Center Workspace & Right Column */}
        <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-5 pb-24 md:pb-5 overflow-y-auto">
          {/* Back button for legal pages */}
          {isLegalView && (
            <div className="max-w-4xl mx-auto mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('mastering')}
                className="px-3.5 py-1.5 rounded-lg bg-[#14171D] hover:bg-[#1C2028] text-xs font-mono text-[#B7F000] border border-[#242830] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Mastering Workstation
              </button>
            </div>
          )}

          {/* VIEW 1: MASTERING STUDIO WORKSPACE */}
          {activeTab === 'mastering' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              {/* Center Main Console (Left 9 columns on XL screens) */}
              <div className="xl:col-span-9 space-y-4">
                {/* 1. Track Meta Header */}
                <TrackHeader
                  track={currentTrack}
                  duration={duration}
                  isMastering={isMasteringInProgress}
                  onSelectDemo={loadDemoTrack}
                  onFileUpload={handleFileUpload}
                  onTriggerMaster={handleTriggerMaster}
                />

                {/* 2. Hero Waveform Canvas Scrubber */}
                <WaveformHero
                  currentTrack={currentTrack}
                  currentTime={currentTime}
                  duration={duration}
                  isPlaying={isPlaying}
                  isBypassed={isBypassed}
                  onSeek={handleSeek}
                  loopRegion={loopRegion}
                  onToggleLoop={handleToggleLoop}
                />

                {/* 3. 5-Module Processing Chain (EQ, Dynamics, Saturation, Stereo, Limiter) */}
                <ProcessingChain
                  params={params}
                  advancedParams={advancedParams}
                  meterData={meterData}
                  isBypassed={isBypassed}
                  onParamChange={handleParamChange}
                  onAdvancedParamChange={handleAdvancedParamChange}
                  onOpenModuleModal={(mod) => setActiveAdvancedModal(mod)}
                />

                {/* 4. Bottom Cards: Global Controls, Presets, History */}
                <BottomCards
                  params={params}
                  presets={MASTERING_PRESETS}
                  activePresetId={activePresetId}
                  snapshots={snapshots}
                  onParamChange={handleParamChange}
                  onSelectPreset={handleApplyPreset}
                  onRestoreSnapshot={handleRestoreSnapshot}
                  onOpenFullPresets={() => setActiveTab('presets')}
                  onOpenFullHistory={() => setIsHistoryModalOpen(true)}
                  onOpenTargetModal={() => setIsReferenceModalOpen(true)}
                />

                {/* 5. Bottom Transport Bar & Trust Footer */}
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
                  isLooping={isLooping}
                  onToggleLoop={handleToggleLoop}
                  isMono={isMono}
                  onToggleMono={handleToggleMono}
                />
              </div>

              {/* Right Analysis Panel (Right 3 columns on XL screens) */}
              <div className="xl:col-span-3 space-y-4">
                <RightAnalysisPanel
                  meterData={meterData}
                  isPlaying={isPlaying}
                  targetLufs={selectedTarget.targetLufs}
                  referencePlatform={selectedTarget.platform}
                  onOpenReferenceModal={() => setIsReferenceModalOpen(true)}
                  onOpenLoudnessDetails={() => setIsLoudnessModalOpen(true)}
                />
              </div>
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
              params={params}
              onParamChange={handleParamChange}
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

          {/* VIEW 5: LANDING & WORKSTATION SHOWCASE */}
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

          {/* VIEW ADMIN: Admin Control Panel */}
          {activeTab === 'admin' && (
            <AdminPanelView
              onBack={() => setActiveTab('mastering')}
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
      </div>

      {/* Footer Legal & Navigation Bar */}
      <footer className="border-t border-[#222420] bg-[#0A0C0F] px-6 py-4 text-xs text-[#8E95A2] select-none">
        <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-[#B7F000] font-semibold">MASTERINGLOCAL.PRO</span>
            <span>·</span>
            <span>Client-Side 64-bit Audio DSP</span>
            <span>·</span>
            <span className="text-[#10B981]">100% In-Browser Privacy</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('learn')}
              className="hover:text-[#B7F000] transition-colors cursor-pointer"
            >
              Guides &amp; LUFS
            </button>
            <button
              type="button"
              onClick={() => setIsPricingModalOpen(true)}
              className="hover:text-[#B7F000] transition-colors cursor-pointer"
            >
              Pricing &amp; Plans
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className="hover:text-[#B7F000] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className="hover:text-[#B7F000] transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('subscriptions')}
              className="hover:text-[#B7F000] transition-colors cursor-pointer"
            >
              Subscription Terms
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cookies')}
              className="hover:text-[#B7F000] transition-colors cursor-pointer"
            >
              Cookie Policy
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('refunds')}
              className="hover:text-[#B7F000] transition-colors cursor-pointer"
            >
              Refund Policy
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('legal')}
              className="hover:text-[#B7F000] transition-colors cursor-pointer"
            >
              Imprint / Legal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('contact')}
              className="hover:text-[#B7F000] transition-colors cursor-pointer"
            >
              Contact &amp; Support
            </button>
          </div>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      <CookieConsentBanner onOpenPolicy={() => setActiveTab('cookies')} />

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isPro={FeatureGates.isProUser()}
        onOpenAccount={() => handleOpenAccount('subscription')}
      />

      {/* MODALS */}
      <AdvancedModuleModal
        module={activeAdvancedModal}
        params={params}
        advancedParams={advancedParams}
        onClose={() => setActiveAdvancedModal(null)}
        onParamChange={handleParamChange}
        onAdvancedParamChange={handleAdvancedParamChange}
      />

      {isReferenceModalOpen && (
        <ReferenceTargetModal
          selectedTargetId={selectedTarget.id}
          onSelectTarget={(target) => {
            setSelectedTarget(target);
            handleAdvancedParamChange('ceiling', target.truePeakCeiling);
          }}
          onClose={() => setIsReferenceModalOpen(false)}
        />
      )}

      {isLoudnessModalOpen && (
        <LoudnessDetailsModal
          meterData={meterData}
          targetLufs={selectedTarget.targetLufs}
          onClose={() => setIsLoudnessModalOpen(false)}
        />
      )}

      {isStemsModalOpen && (
        <StemsModal
          onClose={() => setIsStemsModalOpen(false)}
        />
      )}

      {isHistoryModalOpen && (
        <HistoryModal
          historyList={snapshots}
          onRestore={handleRestoreSnapshot}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}

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
    </HelmetProvider>
  );
};
