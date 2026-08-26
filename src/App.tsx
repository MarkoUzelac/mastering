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
import { HeroEmptyState } from './components/HeroEmptyState';
import { MobileBottomNav } from './components/MobileBottomNav';

// Workstation DSP Components
import { WaveformHero } from './components/WaveformHero';
import { ProcessingChain, AdvancedParamsState } from './components/ProcessingChain';
import { BottomCards, HistorySnapshotItem } from './components/BottomCards';
import { RightAnalysisPanel } from './components/RightAnalysisPanel';
import { TransportBar } from './components/TransportBar';
import { DSPStateCompare, DSPStateSlot } from './components/DSPStateCompare';

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
import { AuthModal } from './components/AuthModal';
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
import { ArrowLeft, Download, Upload, Sparkles, ChevronDown } from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';

export const App: React.FC = () => {
  // Navigation & View State
  const [showSplash, setShowSplash] = useState(true);
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

  // A/B DSP State Comparison Slots
  const [activeDspSlot, setActiveDspSlot] = useState<'A' | 'B'>('A');
  const [slotA, setSlotA] = useState<DSPStateSlot>({
    params: { ...DEFAULT_PARAMS },
    advancedParams: {
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
    },
    presetName: 'Modern Streaming',
    timestamp: Date.now(),
  });
  const [slotB, setSlotB] = useState<DSPStateSlot>({
    params: { ...DEFAULT_PARAMS, low: 1.5, mid: -0.5, high: 1.2, threshold: -16.0, ratio: 3.5, gain: 1.0 },
    advancedParams: {
      lowFreq: 80,
      midFreq: 1200,
      highFreq: 8000,
      lowQ: 0.707,
      midQ: 1.0,
      highQ: 0.707,
      knee: 4.0,
      attack: 25.0,
      release: 120.0,
      drive: 45.0,
      warmth: 50.0,
      mix: 100.0,
      width: 125.0,
      balance: 0.0,
      phaseInvert: false,
      ceiling: -1.0,
      limiterRelease: 80.0,
      lookahead: 3.0,
      truePeak: true,
    },
    presetName: 'Warm Analog Push',
    timestamp: Date.now(),
  });

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
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
    if (!showSplash) {
      loadDemoTrack('synthwave');
    }
  }, [showSplash]);

  useEffect(() => {
    const unsubscribe = entitlementService.subscribe((newEnt, newUsage) => {
      setEntitlement(newEnt);
      setUsage(newUsage);
    });

    entitlementService.fetchServerEntitlements().catch(console.error);

    audioEngine.setTimeUpdateCallback((time, totalDuration) => {
      // setCurrentTime(time); // THROTLED / REMOVED to prevent 60fps re-renders
      if (totalDuration && totalDuration > 0) setDuration(totalDuration);
    });

    audioEngine.setMeterUpdateCallback((meters) => {
      // setMeterData(meters); // THROTLED / REMOVED to prevent rapid re-renders
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

  const handleSelectDspSlot = useCallback((slot: 'A' | 'B') => {
    if (slot === activeDspSlot) return;
    setActiveDspSlot(slot);
    const targetSlot = slot === 'A' ? slotA : slotB;
    setParams({ ...targetSlot.params });
    setAdvancedParams({ ...targetSlot.advancedParams });
    audioEngine.setParams({ ...targetSlot.params });
    pushHistory({ ...targetSlot.params });
    soundHaptics.playButtonTap();
  }, [activeDspSlot, slotA, slotB]);

  const handleCaptureToOppositeSlot = useCallback(() => {
    const opposite = activeDspSlot === 'A' ? 'B' : 'A';
    const currentSlotData: DSPStateSlot = {
      params: { ...params },
      advancedParams: { ...advancedParams },
      presetName: MASTERING_PRESETS.find((p) => p.id === activePresetId)?.name || 'Custom',
      timestamp: Date.now(),
    };
    if (opposite === 'B') {
      setSlotB(currentSlotData);
    } else {
      setSlotA(currentSlotData);
    }
  }, [activeDspSlot, params, advancedParams, activePresetId]);

  const handleCopyDspSlot = useCallback((from: 'A' | 'B', to: 'A' | 'B') => {
    const source = from === 'A' ? slotA : slotB;
    const copied: DSPStateSlot = {
      params: { ...source.params },
      advancedParams: { ...source.advancedParams },
      presetName: source.presetName,
      timestamp: Date.now(),
    };
    if (to === 'B') {
      setSlotB(copied);
      if (activeDspSlot === 'B') {
        setParams({ ...copied.params });
        setAdvancedParams({ ...copied.advancedParams });
        audioEngine.setParams({ ...copied.params });
      }
    } else {
      setSlotA(copied);
      if (activeDspSlot === 'A') {
        setParams({ ...copied.params });
        setAdvancedParams({ ...copied.advancedParams });
        audioEngine.setParams({ ...copied.params });
      }
    }
  }, [slotA, slotB, activeDspSlot]);

  const handleSwapDspSlots = useCallback(() => {
    const tempA = { ...slotA };
    const tempB = { ...slotB };
    setSlotA(tempB);
    setSlotB(tempA);
    const activeNow = activeDspSlot === 'A' ? tempB : tempA;
    setParams({ ...activeNow.params });
    setAdvancedParams({ ...activeNow.advancedParams });
    audioEngine.setParams({ ...activeNow.params });
  }, [slotA, slotB, activeDspSlot]);

  const handleResetDspSlot = useCallback((slot: 'A' | 'B') => {
    const resetData: DSPStateSlot = {
      params: { ...DEFAULT_PARAMS },
      advancedParams: {
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
      },
      presetName: 'Default',
      timestamp: Date.now(),
    };
    if (slot === 'A') {
      setSlotA(resetData);
      if (activeDspSlot === 'A') {
        setParams({ ...DEFAULT_PARAMS });
        setAdvancedParams(resetData.advancedParams);
        audioEngine.setParams({ ...DEFAULT_PARAMS });
        pushHistory({ ...DEFAULT_PARAMS });
      }
    } else {
      setSlotB(resetData);
      if (activeDspSlot === 'B') {
        setParams({ ...DEFAULT_PARAMS });
        setAdvancedParams(resetData.advancedParams);
        audioEngine.setParams({ ...DEFAULT_PARAMS });
        pushHistory({ ...DEFAULT_PARAMS });
      }
    }
  }, [activeDspSlot]);

  const handleParamChange = useCallback((param: keyof MasteringParams, value: number) => {
    setParams((prev) => {
      const updated = { ...prev, [param]: value };
      audioEngine.setParams(updated);
      pushHistory(updated);
      return updated;
    });
    if (activeDspSlot === 'A') {
      setSlotA((prev) => ({
        ...prev,
        params: { ...prev.params, [param]: value },
        timestamp: Date.now(),
      }));
    } else {
      setSlotB((prev) => ({
        ...prev,
        params: { ...prev.params, [param]: value },
        timestamp: Date.now(),
      }));
    }
  }, [activeDspSlot]);

  const handleAdvancedParamChange = useCallback(
    <K extends keyof AdvancedParamsState>(key: K, value: AdvancedParamsState[K]) => {
      setAdvancedParams((prev) => ({ ...prev, [key]: value }));
      if (activeDspSlot === 'A') {
        setSlotA((prev) => ({
          ...prev,
          advancedParams: { ...prev.advancedParams, [key]: value },
          timestamp: Date.now(),
        }));
      } else {
        setSlotB((prev) => ({
          ...prev,
          advancedParams: { ...prev.advancedParams, [key]: value },
          timestamp: Date.now(),
        }));
      }
    },
    [activeDspSlot]
  );

  const handleResetParams = () => {
    setParams({ ...DEFAULT_PARAMS });
    audioEngine.setParams({ ...DEFAULT_PARAMS });
    pushHistory({ ...DEFAULT_PARAMS });
    soundHaptics.playResetSound();
    if (activeDspSlot === 'A') {
      setSlotA((prev) => ({
        ...prev,
        params: { ...DEFAULT_PARAMS },
        timestamp: Date.now(),
      }));
    } else {
      setSlotB((prev) => ({
        ...prev,
        params: { ...DEFAULT_PARAMS },
        timestamp: Date.now(),
      }));
    }
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

    if (activeDspSlot === 'A') {
      setSlotA((prev) => ({
        ...prev,
        params: { ...preset.params },
        presetName: preset.name,
        timestamp: Date.now(),
      }));
    } else {
      setSlotB((prev) => ({
        ...prev,
        params: { ...preset.params },
        presetName: preset.name,
        timestamp: Date.now(),
      }));
    }

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

  
  // Sync Media Session and Document Title
  useEffect(() => {
    if (isPlaying) {
      const trackTitle = currentTrack?.name || 'Audio Session';
      document.title = `▶ ${trackTitle} - MasteringLocal.Pro`;
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: trackTitle,
          artist: 'MasteringLocal.Pro',
          album: 'Studio Editor',
          artwork: [
            { src: 'https://masteringlocal.pro/icon.png', sizes: '512x512', type: 'image/png' }
          ]
        });
        navigator.mediaSession.playbackState = 'playing';
      }
    } else {
      document.title = getSeoInfo().title;
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    }
  }, [isPlaying, currentTrack, getSeoInfo().title]);

  const seo = getSeoInfo();

  return (
    <HelmetProvider>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Helmet>
        <title>{getSeoInfo().title}</title>
        <meta name="description" content={seo.description} />
        <meta property="og:title" content={getSeoInfo().title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content="https://masteringlocal.pro" />
        <meta name="twitter:title" content={getSeoInfo().title} />
        <meta name="twitter:description" content={seo.description} />
      </Helmet>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-[var(--accent-lime)]/30 selection:text-[var(--accent-lime)]">
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
        onOpenAdmin={() => {}}
        onOpenBilling={() => handleOpenAccount('subscription')}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        hasAudio={!!currentTrack}
        isPlaying={isPlaying}
        entitlement={entitlement}
        usage={usage}
        onUploadClick={() => loadDemoTrack('synthwave')}
      />

      {/* Main Container Layout */}
      <div className="flex-1 flex w-full">
        {/* Left Sidebar (2 cols) */}
        <div className="">
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
        </div>

        {/* Center Workspace & Right Column (10 cols) */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-10 xl:p-16 pb-24 md:pb-10 overflow-y-auto w-full max-w-[100vw]">
          {/* Back button for legal pages */}
          {isLegalView && (
            <div className="max-w-4xl mx-auto mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('mastering')}
                className="px-3.5 py-1.5 rounded-sm bg-[var(--bg-elevated)] hover:bg-[#1C2028] text-xs font-mono text-[var(--accent-lime)] border border-[var(--border-subtle)] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Mastering Workstation
              </button>
            </div>
          )}

          {/* VIEW 1: MASTERING STUDIO WORKSPACE */}
          {activeTab === 'mastering' && !currentTrack ? (
            <HeroEmptyState onFileUpload={handleFileUpload} />
          ) : activeTab === 'mastering' && (
            <div className="grid grid-cols-1 lg:grid-cols-9 xl:grid-cols-10 gap-6 lg:gap-8 items-start">
              {/* Center Main Console (Left 7 columns on XL, 6 on LG) */}
              <div className="lg:col-span-6 xl:col-span-7 space-y-6">
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

                {/* 2.5 A/B DSP Parameter State Comparison Bar */}
                <DSPStateCompare
                  activeSlot={activeDspSlot}
                  slotA={slotA}
                  slotB={slotB}
                  currentParams={params}
                  currentAdvancedParams={advancedParams}
                  onSelectSlot={handleSelectDspSlot}
                  onCaptureToOppositeSlot={handleCaptureToOppositeSlot}
                  onCopySlot={handleCopyDspSlot}
                  onSwapSlots={handleSwapDspSlots}
                  onResetSlot={handleResetDspSlot}
                />

                {/* 3. 5-Module Processing Chain (EQ, Dynamics, Saturation, Stereo, Limiter) */}
                <ProcessingChain
                  params={params}
                  advancedParams={advancedParams}
                  meterData={meterData}
                  isBypassed={isBypassed}
                  onParamChange={handleParamChange}
                  onAdvancedParamChange={handleAdvancedParamChange}
                  onOpenAdvancedModal={(mod) => setActiveAdvancedModal(mod)}
                />
                {/* Massive Export Master Button */}
                <button
                  onClick={() => {
                    soundHaptics.playMasterStart();
                    handleTriggerMaster();
                  }}
                  disabled={isMasteringInProgress}
                  className={`w-full flex items-center justify-between px-8 py-5 min-h-[72px] transition cursor-pointer active:scale-[0.99] select-none ${
                    isMasteringInProgress
                      ? 'bg-[var(--text-tertiary)] cursor-wait'
                      : 'bg-[var(--accent-lime)] hover:bg-[#c9ff2e]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-black/20 flex items-center justify-center">
                      {false ? (
                        <Download className="w-5 h-5 text-black" />
                      ) : isMasteringInProgress ? (
                        <Sparkles className="w-5 h-5 animate-spin text-black" style={{ animationDuration: '2s' }} />
                      ) : (
                        <Upload className="w-5 h-5 text-black" />
                      )}
                    </div>
                    <span className="tracking-widest uppercase font-mono font-bold text-black text-2xl">
                      {false ? 'EXPORT MASTER' : isMasteringInProgress ? 'MASTERING...' : 'EXPORT MASTER'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-black font-bold tracking-widest px-2 py-1 border border-black/20">
                      24-BIT WAV
                    </span>
                    <ChevronDown className="w-5 h-5 text-black opacity-50" />
                  </div>
                </button>


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
                <div className="sticky bottom-16 md:static z-30"><TransportBar
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
                /></div>
              </div>

              {/* Right Analysis Panel (Right 3 columns) */}
              <div className="lg:col-span-3 xl:col-span-3 space-y-6">
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
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-6 py-4 text-xs text-[var(--text-tertiary)] select-none">
        <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-[var(--accent-lime)] font-semibold">MASTERINGLOCAL.PRO</span>
            <span>·</span>
            <span>Client-Side 64-bit Audio DSP</span>
            <span>·</span>
            <span className="text-[#10B981]">100% In-Browser Privacy</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('learn')}
              className="hover:text-[var(--accent-lime)] transition-colors cursor-pointer"
            >
              Guides &amp; LUFS
            </button>
            <button
              type="button"
              onClick={() => setIsPricingModalOpen(true)}
              className="hover:text-[var(--accent-lime)] transition-colors cursor-pointer"
            >
              Pricing &amp; Plans
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className="hover:text-[var(--accent-lime)] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className="hover:text-[var(--accent-lime)] transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('subscriptions')}
              className="hover:text-[var(--accent-lime)] transition-colors cursor-pointer"
            >
              Subscription Terms
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cookies')}
              className="hover:text-[var(--accent-lime)] transition-colors cursor-pointer"
            >
              Cookie Policy
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('refunds')}
              className="hover:text-[var(--accent-lime)] transition-colors cursor-pointer"
            >
              Refund Policy
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('legal')}
              className="hover:text-[var(--accent-lime)] transition-colors cursor-pointer"
            >
              Imprint / Legal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('contact')}
              className="hover:text-[var(--accent-lime)] transition-colors cursor-pointer"
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

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <AccountModal isOpen={isAccountModalOpen}
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
