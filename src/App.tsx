import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { audioEngine } from './utils/audio-engine';
import { DEFAULT_PARAMS, MASTERING_PRESETS } from './utils/presets';
import { MasteringParams, MasteringPreset, MeterData, AudioTrackInfo } from './types';
import { Header, ActiveTab } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TrackHeader } from './components/TrackHeader';
import { HeroEmptyState } from './components/HeroEmptyState';
import { MobileBottomNav } from './components/MobileBottomNav';
import { WaveformHero } from './components/WaveformHero';
import { ProcessingChain, AdvancedParamsState } from './components/ProcessingChain';
import { BottomCards, HistorySnapshotItem } from './components/BottomCards';
import { RightAnalysisPanel } from './components/RightAnalysisPanel';
import { TransportBar } from './components/TransportBar';
import { DSPStateCompare, DSPStateSlot } from './components/DSPStateCompare';
import { DashboardView } from './components/DashboardView';
import { AnalysisView } from './components/AnalysisView';
import { PresetsView } from './components/PresetsView';
import { LandingView } from './components/LandingView';
import { LearnGuidesView, GuideSlug } from './learn/LearnGuidesView';
import { AdminPanelView } from './components/AdminPanelView';
import { PrivacyPolicyView } from './legal/PrivacyPolicyView';
import { TermsOfServiceView } from './legal/TermsOfServiceView';
import { SubscriptionTermsView } from './legal/SubscriptionTermsView';
import { CookiePolicyView } from './legal/CookiePolicyView';
import { RefundPolicyView } from './legal/RefundPolicyView';
import { ImprintView } from './legal/ImprintView';
import { ContactView } from './legal/ContactView';
import { DataRequestView } from './legal/DataRequestView';
import { CookieConsentBanner } from './components/CookieConsentBanner';
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
import { entitlementService, UserEntitlement, UserUsage } from './billing/entitlement-service';
import { PlanId, FeatureKey } from './billing/billing-config';
import { FeatureGates } from './billing/feature-gates';
import { soundHaptics } from './utils/sound-haptics';
import { ArrowLeft, Upload, Sparkles, ChevronDown } from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('mastering');
  const [initialGuideSlug, setInitialGuideSlug] = useState<GuideSlug>('how-to-master-music-online');
  const [params, setParams] = useState<MasteringParams>({ ...DEFAULT_PARAMS });
  const [advancedParams, setAdvancedParams] = useState<AdvancedParamsState>({
    lowFreq: 80, midFreq: 1200, highFreq: 8000, lowQ: 0.707, midQ: 1.0, highQ: 0.707,
    knee: 4.0, attack: 25.0, release: 120.0, drive: 35.0, warmth: 40.0, mix: 100.0,
    width: 110.0, balance: 0.0, phaseInvert: false, ceiling: -1.0, limiterRelease: 80.0,
    lookahead: 3.0, truePeak: true,
  });
  const [isBypassed, setIsBypassed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(225.782);
  const [isLooping, setIsLooping] = useState(false);
  const [isMono, setIsMono] = useState(false);
  const [loopRegion, setLoopRegion] = useState({ start: 30, end: 75, enabled: false });
  const [currentTrack, setCurrentTrack] = useState<AudioTrackInfo | null>(null);
  const [activePresetId, setActivePresetId] = useState<string>('modern-streaming');
  const [selectedTarget, setSelectedTarget] = useState<ReferenceTarget>(REFERENCE_TARGETS[0]);
  const [isMasteringInProgress, setIsMasteringInProgress] = useState(false);
  const [activeDspSlot, setActiveDspSlot] = useState<'A' | 'B'>('A');
  const [slotA, setSlotA] = useState<DSPStateSlot>({ params: { ...DEFAULT_PARAMS }, advancedParams: { ...advancedParams }, presetName: 'Modern Streaming', timestamp: Date.now() });
  const [slotB, setSlotB] = useState<DSPStateSlot>({ params: { ...DEFAULT_PARAMS, low: 1.5, mid: -0.5, high: 1.2, threshold: -16.0, ratio: 3.5, gain: 1.0 }, advancedParams: { ...advancedParams, drive: 45.0, warmth: 50.0, width: 125.0 }, presetName: 'Warm Analog Push', timestamp: Date.now() });
  const historyStack = useRef<MasteringParams[]>([{ ...DEFAULT_PARAMS }]);
  const historyIndex = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [entitlement, setEntitlement] = useState<UserEntitlement>(entitlementService.getEntitlement());
  const [usage, setUsage] = useState<UserUsage>(entitlementService.getUsage());
  const [meterData, setMeterData] = useState<MeterData>({ inputPeakL: -3.2, inputPeakR: -3.4, inputRmsL: -14.6, inputRmsR: -14.8, outputPeakL: -0.9, outputPeakR: -0.9, outputRmsL: -11.2, outputRmsR: -11.4, gainReductionDb: 2.1, limiterActive: true, momentaryLufs: -9.7, integratedLufs: -10.8, crestFactor: 8.4 });
  const [snapshots, setSnapshots] = useState<HistorySnapshotItem[]>([
    { id: '1', time: '14:23:05', name: 'EQ Low Shelf Boost', target: 'Spotify (-14 LUFS)', params: { ...DEFAULT_PARAMS } },
    { id: '2', time: '14:20:12', name: 'Dynamics Glue VCA', target: 'Club/EDM (-9 LUFS)', params: { ...DEFAULT_PARAMS } },
    { id: '3', time: '14:15:48', name: 'Tape Harmonics Mix', target: 'Spotify (-14 LUFS)', params: { ...DEFAULT_PARAMS } },
  ]);
  const [activeAdvancedModal, setActiveAdvancedModal] = useState<'eq' | 'dynamics' | 'saturation' | 'stereo' | 'limiter' | null>(null);
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
  const [isLoudnessModalOpen, setIsLoudnessModalOpen] = useState(false);
  const [isStemsModalOpen, setIsStemsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isParityModalOpen, setIsParityModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountInitialTab, setAccountInitialTab] = useState<'subscription' | 'billing' | 'usage' | 'exports' | 'privacy'>('subscription');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanId>('pro_monthly');
  const [upgradeTargetFeature, setUpgradeTargetFeature] = useState<FeatureKey>('HIGH_RES_EXPORT');

  const pushHistory = (newParams: MasteringParams) => {
    const currentHistory = historyStack.current.slice(0, historyIndex.current + 1); currentHistory.push({ ...newParams }); historyStack.current = currentHistory; historyIndex.current = currentHistory.length - 1; setCanUndo(historyIndex.current > 0); setCanRedo(false);
  };
  const handleUndo = () => { if (historyIndex.current <= 0) return; soundHaptics.playSwitchSound(false); historyIndex.current -= 1; const target = historyStack.current[historyIndex.current]; setParams({ ...target }); audioEngine.setParams({ ...target }); setCanUndo(historyIndex.current > 0); setCanRedo(true); };
  const handleRedo = () => { if (historyIndex.current >= historyStack.current.length - 1) return; soundHaptics.playSwitchSound(true); historyIndex.current += 1; const target = historyStack.current[historyIndex.current]; setParams({ ...target }); audioEngine.setParams({ ...target }); setCanUndo(true); setCanRedo(historyIndex.current < historyStack.current.length - 1); };

  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/privacy/data-request')) setActiveTab('data-request'); else if (path.includes('/privacy')) setActiveTab('privacy'); else if (path.includes('/terms')) setActiveTab('terms'); else if (path.includes('/subscriptions') || path.includes('/subscription-terms')) setActiveTab('subscriptions'); else if (path.includes('/cookies')) setActiveTab('cookies'); else if (path.includes('/refunds')) setActiveTab('refunds'); else if (path.includes('/legal') || path.includes('/imprint')) setActiveTab('legal'); else if (path.includes('/contact')) setActiveTab('contact'); else if (path.includes('/pricing')) setIsPricingModalOpen(true); else if (path.includes('/learn/lufs-guide')) { setInitialGuideSlug('lufs-guide'); setActiveTab('learn'); } else if (path.includes('/learn/24-bit-vs-16-bit')) { setInitialGuideSlug('24-bit-vs-16-bit'); setActiveTab('learn'); } else if (path.includes('/learn/master-for-spotify')) { setInitialGuideSlug('master-for-spotify'); setActiveTab('learn'); } else if (path.includes('/learn/master-for-youtube')) { setInitialGuideSlug('master-for-youtube'); setActiveTab('learn'); } else if (path.includes('/learn')) setActiveTab('learn');
  }, []);
  useEffect(() => { if (!showSplash) loadDemoTrack('synthwave'); }, [showSplash]);
  useEffect(() => { const unsubscribe = entitlementService.subscribe((newEnt, newUsage) => { setEntitlement(newEnt); setUsage(newUsage); }); entitlementService.fetchServerEntitlements().catch(console.error); audioEngine.setTimeUpdateCallback((_time, totalDuration) => { if (totalDuration > 0) setDuration(totalDuration); }); audioEngine.setMeterUpdateCallback((meters) => setMeterData(meters)); return () => { unsubscribe(); audioEngine.stop(); }; }, []);

  const loadDemoTrack = (type: 'synthwave' | 'acoustic' | 'parity') => { audioEngine.stop(); setIsPlaying(false); setCurrentTime(0); const buffer = audioEngine.createDemoTrack(type); audioEngine.setAudioBuffer(buffer); const names = { synthwave: 'Synthwave Neon Horizon Master.wav', acoustic: 'Acoustic Resonance & Harmonics.wav', parity: 'Production Parity 100k Benchmark.wav' }; setCurrentTrack({ name: names[type], duration: buffer.duration, sampleRate: buffer.sampleRate, channels: buffer.numberOfChannels, buffer, sourceType: type === 'parity' ? 'synthetic' : 'demo' }); setDuration(buffer.duration); };
  const handleFileUpload = async (file: File) => { try { audioEngine.stop(); setIsPlaying(false); setCurrentTime(0); const buffer = await audioEngine.loadAudioFile(file); setCurrentTrack({ name: file.name, duration: buffer.duration, sampleRate: buffer.sampleRate, channels: buffer.numberOfChannels, buffer, sourceType: 'file', fileSize: file.size }); setDuration(buffer.duration); setActiveTab('mastering'); } catch (err) { console.error('Failed to load audio file:', err); } };
  const handleSelectDspSlot = useCallback((slot: 'A' | 'B') => { if (slot === activeDspSlot) return; setActiveDspSlot(slot); const target = slot === 'A' ? slotA : slotB; setParams({ ...target.params }); setAdvancedParams({ ...target.advancedParams }); audioEngine.setParams({ ...target.params }); pushHistory({ ...target.params }); soundHaptics.playButtonTap(); }, [activeDspSlot, slotA, slotB]);
  const handleCaptureToOppositeSlot = useCallback(() => { const opposite = activeDspSlot === 'A' ? 'B' : 'A'; const data: DSPStateSlot = { params: { ...params }, advancedParams: { ...advancedParams }, presetName: MASTERING_PRESETS.find((p) => p.id === activePresetId)?.name || 'Custom', timestamp: Date.now() }; if (opposite === 'B') setSlotB(data); else setSlotA(data); }, [activeDspSlot, params, advancedParams, activePresetId]);
  const handleCopyDspSlot = useCallback((from: 'A' | 'B', to: 'A' | 'B') => { const source = from === 'A' ? slotA : slotB; const copied = { params: { ...source.params }, advancedParams: { ...source.advancedParams }, presetName: source.presetName, timestamp: Date.now() }; if (to === 'B') setSlotB(copied); else setSlotA(copied); if (activeDspSlot === to) { setParams({ ...copied.params }); setAdvancedParams({ ...copied.advancedParams }); audioEngine.setParams({ ...copied.params }); } }, [slotA, slotB, activeDspSlot]);
  const handleSwapDspSlots = useCallback(() => { setSlotA(slotB); setSlotB(slotA); const activeNow = activeDspSlot === 'A' ? slotB : slotA; setParams({ ...activeNow.params }); setAdvancedParams({ ...activeNow.advancedParams }); audioEngine.setParams({ ...activeNow.params }); }, [slotA, slotB, activeDspSlot]);
  const handleResetDspSlot = useCallback((slot: 'A' | 'B') => { const reset: DSPStateSlot = { params: { ...DEFAULT_PARAMS }, advancedParams: { ...advancedParams }, presetName: 'Default', timestamp: Date.now() }; if (slot === 'A') setSlotA(reset); else setSlotB(reset); if (slot === activeDspSlot) { setParams({ ...DEFAULT_PARAMS }); setAdvancedParams(reset.advancedParams); audioEngine.setParams({ ...DEFAULT_PARAMS }); pushHistory({ ...DEFAULT_PARAMS }); } }, [activeDspSlot, advancedParams]);
  const handleParamChange = useCallback((param: keyof MasteringParams, value: number) => { setParams((prev) => { const updated = { ...prev, [param]: value }; audioEngine.setParams(updated); pushHistory(updated); return updated; }); const updateSlot = (prev: DSPStateSlot) => ({ ...prev, params: { ...prev.params, [param]: value }, timestamp: Date.now() }); if (activeDspSlot === 'A') setSlotA(updateSlot); else setSlotB(updateSlot); }, [activeDspSlot]);
  const handleAdvancedParamChange = useCallback(<K extends keyof AdvancedParamsState>(key: K, value: AdvancedParamsState[K]) => { setAdvancedParams((prev) => ({ ...prev, [key]: value })); const updateSlot = (prev: DSPStateSlot) => ({ ...prev, advancedParams: { ...prev.advancedParams, [key]: value }, timestamp: Date.now() }); if (activeDspSlot === 'A') setSlotA(updateSlot); else setSlotB(updateSlot); }, [activeDspSlot]);
  const handleResetParams = () => { setParams({ ...DEFAULT_PARAMS }); audioEngine.setParams({ ...DEFAULT_PARAMS }); pushHistory({ ...DEFAULT_PARAMS }); soundHaptics.playResetSound(); if (activeDspSlot === 'A') setSlotA((prev) => ({ ...prev, params: { ...DEFAULT_PARAMS }, timestamp: Date.now() })); else setSlotB((prev) => ({ ...prev, params: { ...DEFAULT_PARAMS }, timestamp: Date.now() })); };
  const handleApplyPreset = (preset: MasteringPreset) => { if ((preset.proOnly || preset.isPro) && !FeatureGates.isProUser()) { setUpgradeTargetFeature('ADVANCED_PRESETS'); setIsUpgradeModalOpen(true); return; } soundHaptics.playPresetClick(); setActivePresetId(preset.id); setParams({ ...preset.params }); audioEngine.setParams({ ...preset.params }); pushHistory({ ...preset.params }); const updater = (prev: DSPStateSlot) => ({ ...prev, params: { ...preset.params }, presetName: preset.name, timestamp: Date.now() }); if (activeDspSlot === 'A') setSlotA(updater); else setSlotB(updater); const now = new Date(); const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`; setSnapshots((prev) => [{ id: Date.now().toString(), time: timeStr, name: preset.name, target: `${selectedTarget.platform} (${selectedTarget.targetLufs} LUFS)`, params: { ...preset.params } }, ...prev.slice(0, 4)]); };
  const handleRestoreSnapshot = (snapshot: HistorySnapshotItem) => { if (!snapshot.params) return; soundHaptics.playPresetClick(); setParams({ ...snapshot.params }); audioEngine.setParams({ ...snapshot.params }); pushHistory({ ...snapshot.params }); };
  const handleToggleBypass = () => { const next = !isBypassed; setIsBypassed(next); audioEngine.setBypass(next); };
  const handlePlay = () => { void audioEngine.play(); setIsPlaying(true); };
  const handlePause = () => { audioEngine.pause(); setIsPlaying(false); };
  const handleStop = () => { audioEngine.stop(); setIsPlaying(false); setCurrentTime(0); };
  const handleSeek = (time: number) => { audioEngine.seek(time); setCurrentTime(time); };
  const handleToggleMono = () => setIsMono((prev) => { const next = !prev; handleAdvancedParamChange('width', next ? 0 : 100); return next; });
  const handleToggleLoop = () => { setIsLooping((prev) => !prev); setLoopRegion((prev) => ({ ...prev, enabled: !prev.enabled })); };
  const handleTriggerMaster = () => { soundHaptics.playSwitchSound(true); setIsMasteringInProgress(true); setTimeout(() => { setIsMasteringInProgress(false); soundHaptics.playSuccessSound(); setIsExportModalOpen(true); }, 900); };
  const handleOpenAccount = (tab: 'subscription' | 'billing' | 'usage' | 'exports' | 'privacy' = 'subscription') => { setAccountInitialTab(tab); setIsAccountModalOpen(true); };
  const handleOpenCheckout = (planId: PlanId) => { setSelectedPlanForCheckout(planId); setIsPricingModalOpen(false); setIsUpgradeModalOpen(false); setIsCheckoutModalOpen(true); };
  const handleOpenUpgradePrompt = (featureKey: FeatureKey | string = 'HIGH_RES_EXPORT') => { setUpgradeTargetFeature(featureKey as FeatureKey); setIsUpgradeModalOpen(true); };

  const isLegalView = ['privacy','terms','subscriptions','cookies','refunds','legal','contact','data-request'].includes(activeTab);
  const getSeoInfo = () => { if (isPricingModalOpen) return { title: 'Pricing & Pro Plans | MasteringLocal.Pro', description: 'Upgrade to MasteringLocal.Pro for high-resolution exports and advanced dynamics processing.' }; if (isLegalView) { const titles: Record<string,string> = { privacy:'Privacy Policy', terms:'Terms of Service', subscriptions:'Subscription Terms', cookies:'Cookie Policy', refunds:'Refund Policy', legal:'Legal Imprint', contact:'Contact Support', 'data-request':'Data Request' }; const title = titles[activeTab] || 'Legal'; return { title: `${title} | MasteringLocal.Pro`, description: `View the ${title} for MasteringLocal.Pro.` }; } switch (activeTab) { case 'landing': return { title: 'MasteringLocal.Pro — Professional Audio Mastering', description: 'Studio-grade audio mastering console. 100% in your browser. No audio uploads, zero server processing.' }; case 'mastering': return { title: 'Mastering Workspace | MasteringLocal.Pro', description: 'Professional audio mastering workstation with zero latency DSP.' }; case 'analysis': return { title: 'Loudness & Analysis | MasteringLocal.Pro', description: 'Real-time true peak and LUFS analysis for audio mastering.' }; case 'presets': return { title: 'Mastering Presets | MasteringLocal.Pro', description: 'Professional mastering presets for Spotify, Apple Music, and Club.' }; case 'learn': return { title: 'Learn Audio Mastering | MasteringLocal.Pro', description: 'Educational guides on LUFS, True Peak, and audio dynamics.' }; case 'admin': return { title: 'Admin Control Panel | MasteringLocal.Pro', description: 'Platform administration.' }; default: return { title: 'MasteringLocal.Pro — Professional Audio Mastering', description: 'Studio-grade audio mastering console.' }; } };
  const seo = getSeoInfo();
  useEffect(() => { document.title = isPlaying ? `▶ ${currentTrack?.name || 'Audio Session'} - MasteringLocal.Pro` : getSeoInfo().title; }, [isPlaying, currentTrack, activeTab, isPricingModalOpen]);

  return (
    <HelmetProvider>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Helmet><title>{seo.title}</title><meta name="description" content={seo.description} /><meta property="og:title" content={seo.title} /><meta property="og:description" content={seo.description} /></Helmet>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-[var(--accent-lime)]/30 selection:text-[var(--accent-lime)]">
        <Header activeTab={activeTab as ActiveTab} onSelectTab={setActiveTab} onOpenParityModal={() => setIsParityModalOpen(true)} onOpenAuditModal={() => setIsAuditModalOpen(true)} onOpenExportModal={() => setIsExportModalOpen(true)} onOpenPricingModal={() => setIsPricingModalOpen(true)} onOpenAccountModal={handleOpenAccount} onOpenSettingsModal={() => handleOpenAccount('subscription')} onOpenAdmin={() => {}} onOpenBilling={() => handleOpenAccount('subscription')} onUndo={handleUndo} onRedo={handleRedo} canUndo={canUndo} canRedo={canRedo} hasAudio={!!currentTrack} isPlaying={isPlaying} entitlement={entitlement} usage={usage} onUploadClick={() => loadDemoTrack('synthwave')} />
        <div className="flex-1 flex w-full">
          <Sidebar activeItem={activeTab} onSelectItem={(item) => { if (item === 'stems') setIsStemsModalOpen(true); else if (item === 'loudness') setIsLoudnessModalOpen(true); else if (item === 'history') setIsHistoryModalOpen(true); else if (item === 'settings') handleOpenAccount('subscription'); else setActiveTab(item); }} onUpgradeClick={() => setIsPricingModalOpen(true)} />
          <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-10 xl:p-16 pb-24 md:pb-10 overflow-y-auto w-full max-w-[100vw]">
            {isLegalView && <div className="max-w-4xl mx-auto mb-4"><button type="button" onClick={() => setActiveTab('mastering')} className="px-3.5 py-1.5 rounded-sm bg-[var(--bg-elevated)] hover:bg-[#1C2028] text-xs font-mono text-[var(--accent-lime)] border border-[var(--border-subtle)] transition-colors flex items-center gap-2"><ArrowLeft className="w-3.5 h-3.5" />Return to Mastering Workstation</button></div>}
            {activeTab === 'mastering' && !currentTrack ? <HeroEmptyState onFileUpload={handleFileUpload} /> : activeTab === 'mastering' ? (
              <div className="grid grid-cols-1 lg:grid-cols-9 xl:grid-cols-10 gap-6 lg:gap-8 items-start">
                <div className="lg:col-span-6 xl:col-span-7 space-y-6">
                  <TrackHeader track={currentTrack} duration={duration} isMastering={isMasteringInProgress} onSelectDemo={loadDemoTrack} onFileUpload={handleFileUpload} onTriggerMaster={handleTriggerMaster} />
                  <WaveformHero currentTrack={currentTrack} currentTime={currentTime} duration={duration} isPlaying={isPlaying} isBypassed={isBypassed} onSeek={handleSeek} loopRegion={loopRegion} onToggleLoop={handleToggleLoop} />
                  <DSPStateCompare activeSlot={activeDspSlot} slotA={slotA} slotB={slotB} currentParams={params} currentAdvancedParams={advancedParams} onSelectSlot={handleSelectDspSlot} onCaptureToOppositeSlot={handleCaptureToOppositeSlot} onCopySlot={handleCopyDspSlot} onSwapSlots={handleSwapDspSlots} onResetSlot={handleResetDspSlot} />
                  <ProcessingChain params={params} advancedParams={advancedParams} meterData={meterData} isBypassed={isBypassed} onParamChange={handleParamChange} onAdvancedParamChange={handleAdvancedParamChange} onOpenAdvancedModal={setActiveAdvancedModal} />
                  <button onClick={handleTriggerMaster} disabled={isMasteringInProgress} className={`w-full flex items-center justify-between px-8 py-5 min-h-[72px] transition cursor-pointer active:scale-[0.99] select-none ${isMasteringInProgress ? 'bg-[var(--text-tertiary)] cursor-wait' : 'bg-[var(--accent-lime)] hover:bg-[#c9ff2e]'}`}><div className="flex items-center gap-4"><div className="w-10 h-10 border border-black/20 flex items-center justify-center">{isMasteringInProgress ? <Sparkles className="w-5 h-5 animate-spin text-black" style={{ animationDuration: '2s' }} /> : <Upload className="w-5 h-5 text-black" />}</div><span className="tracking-widest uppercase font-mono font-bold text-black text-2xl">{isMasteringInProgress ? 'MASTERING...' : 'EXPORT MASTER'}</span></div><div className="flex items-center gap-3"><span className="text-[10px] font-mono text-black font-bold tracking-widest px-2 py-1 border border-black/20">24-BIT WAV</span><ChevronDown className="w-5 h-5 text-black opacity-50" /></div></button>
                  <BottomCards params={params} presets={MASTERING_PRESETS} activePresetId={activePresetId} snapshots={snapshots} onParamChange={handleParamChange} onSelectPreset={handleApplyPreset} onRestoreSnapshot={handleRestoreSnapshot} onOpenFullPresets={() => setActiveTab('presets')} onOpenFullHistory={() => setIsHistoryModalOpen(true)} onOpenTargetModal={() => setIsReferenceModalOpen(true)} />
                  <div className="sticky bottom-16 md:static z-30"><TransportBar isPlaying={isPlaying} isBypassed={isBypassed} currentTime={currentTime} duration={duration} currentTrack={currentTrack} onPlay={handlePlay} onPause={handlePause} onStop={handleStop} onSeek={handleSeek} onToggleBypass={handleToggleBypass} isLooping={isLooping} onToggleLoop={handleToggleLoop} isMono={isMono} onToggleMono={handleToggleMono} /></div>
                </div>
                <div className="lg:col-span-3 xl:col-span-3 space-y-6"><RightAnalysisPanel meterData={meterData} isPlaying={isPlaying} targetLufs={selectedTarget.targetLufs} referencePlatform={selectedTarget.platform} onOpenReferenceModal={() => setIsReferenceModalOpen(true)} onOpenLoudnessDetails={() => setIsLoudnessModalOpen(true)} /></div>
              </div>
            ) : null}
            {activeTab === 'dashboard' && <DashboardView currentTrack={currentTrack} usage={usage} entitlement={entitlement} onOpenMastering={() => setActiveTab('mastering')} onOpenExportModal={() => setIsExportModalOpen(true)} onOpenPricingModal={() => setIsPricingModalOpen(true)} onOpenAccountModal={handleOpenAccount} onSelectDemoTrack={loadDemoTrack} onFileUpload={handleFileUpload} />}
            {activeTab === 'analysis' && <AnalysisView currentTrack={currentTrack} meterData={meterData} isPlaying={isPlaying} isBypassed={isBypassed} params={params} onParamChange={handleParamChange} onOpenParity={() => setIsParityModalOpen(true)} />}
            {activeTab === 'presets' && <PresetsView presets={MASTERING_PRESETS} activePresetId={activePresetId} currentAudioBuffer={currentTrack?.buffer || audioEngine.getLoadedBuffer()} onSelectPreset={handleApplyPreset} onOpenMastering={() => setActiveTab('mastering')} onOpenUpgradeModal={handleOpenUpgradePrompt} />}
            {activeTab === 'landing' && <LandingView onStartMastering={() => setActiveTab('mastering')} onOpenPricingModal={() => setIsPricingModalOpen(true)} />}
            {activeTab === 'learn' && <LearnGuidesView initialSlug={initialGuideSlug} onTryMastering={() => setActiveTab('mastering')} />}
            {activeTab === 'admin' && <AdminPanelView onBack={() => setActiveTab('mastering')} />}
            {activeTab === 'privacy' && <PrivacyPolicyView onNavigateToTerms={() => setActiveTab('terms')} onNavigateToCookies={() => setActiveTab('cookies')} onNavigateToDataRequest={() => setActiveTab('data-request')} />}
            {activeTab === 'terms' && <TermsOfServiceView onNavigateToPrivacy={() => setActiveTab('privacy')} onNavigateToSubscriptions={() => setActiveTab('subscriptions')} onNavigateToRefunds={() => setActiveTab('refunds')} />}
            {activeTab === 'subscriptions' && <SubscriptionTermsView onNavigateToTerms={() => setActiveTab('terms')} onNavigateToPrivacy={() => setActiveTab('privacy')} onNavigateToRefunds={() => setActiveTab('refunds')} />}
            {activeTab === 'cookies' && <CookiePolicyView />}
            {activeTab === 'refunds' && <RefundPolicyView onNavigateToTerms={() => setActiveTab('terms')} />}
            {activeTab === 'legal' && <ImprintView onBack={() => setActiveTab('mastering')} />}
            {activeTab === 'contact' && <ContactView />}
            {activeTab === 'data-request' && <DataRequestView />}
          </main>
        </div>
        <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} onOpenAccount={() => handleOpenAccount()} isPro={entitlement.plan !== 'free'} />
        <CookieConsentBanner />
      </div>
      {activeAdvancedModal && <AdvancedModuleModal module={activeAdvancedModal} params={params} advancedParams={advancedParams} onClose={() => setActiveAdvancedModal(null)} onParamChange={handleParamChange} onAdvancedParamChange={handleAdvancedParamChange} />}
      <ParityModal isOpen={isParityModalOpen} onClose={() => setIsParityModalOpen(false)} />
      <RuntimeAuditModal isOpen={isAuditModalOpen} onClose={() => setIsAuditModalOpen(false)} />
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} track={currentTrack} params={params} onUpgradeClick={handleOpenUpgradePrompt} />
      <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} onSelectPlan={handleOpenCheckout} currentPlan={entitlement.plan} />
      <CheckoutModal isOpen={isCheckoutModalOpen} onClose={() => setIsCheckoutModalOpen(false)} initialPlanId={selectedPlanForCheckout} onSuccess={() => setIsCheckoutModalOpen(false)} />
      <AccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} initialTab={accountInitialTab} onUpgradeClick={() => handleOpenUpgradePrompt('ADVANCED_PRESETS')} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} featureKey={upgradeTargetFeature} onUpgradeClick={() => handleOpenCheckout(selectedPlanForCheckout)} />
      {isReferenceModalOpen && <ReferenceTargetModal selectedTargetId={selectedTarget.id} onSelectTarget={setSelectedTarget} onClose={() => setIsReferenceModalOpen(false)} />}
      {isLoudnessModalOpen && <LoudnessDetailsModal meterData={meterData} targetLufs={selectedTarget.targetLufs} onClose={() => setIsLoudnessModalOpen(false)} />}
      {isStemsModalOpen && <StemsModal onClose={() => setIsStemsModalOpen(false)} />}
      {isHistoryModalOpen && <HistoryModal historyList={snapshots} onRestore={(item) => handleRestoreSnapshot(item as HistorySnapshotItem)} onClose={() => setIsHistoryModalOpen(false)} />}
    </HelmetProvider>
  );
};
