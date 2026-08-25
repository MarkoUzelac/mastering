/**
 * Theme & Skin Manager for MasteringLocal.Pro
 * 
 * Supports high-end studio mastering hardware aesthetics:
 * - 'obsidian-gold': High-end Gold & Obsidian Carbon Chassis (Default)
 * - 'titanium-slate': Anodized Titanium & Ice Cyan Studio Instrumentation
 * - 'cyber-matrix': Vintage Phosphor Green CRT Rack Station
 * - 'midnight-studio': Editorial Minimalist Monochromatic Carbon
 */

export type StudioSkinId = 'obsidian-gold' | 'titanium-slate' | 'cyber-matrix' | 'midnight-studio';

export interface StudioSkin {
  id: StudioSkinId;
  name: string;
  category: string;
  description: string;
  accentColor: string;
  bgBase: string;
  bgSurface: string;
  borderCol: string;
  previewGradient: string;
}

export const STUDIO_SKINS: StudioSkin[] = [
  {
    id: 'obsidian-gold',
    name: 'Obsidian Gold',
    category: 'Flagship Mastering Console',
    description: 'Deep carbon obsidian chassis, brushed gold indicators, amber tube glow meters, and precision milled bezels.',
    accentColor: '#D6AF62',
    bgBase: '#08090B',
    bgSurface: '#0E1013',
    borderCol: '#24282D',
    previewGradient: 'from-[#D6AF62] via-[#8E733D] to-[#0E1013]',
  },
  {
    id: 'titanium-slate',
    name: 'Titanium Slate',
    category: 'Precision Laboratory Rack',
    description: 'Anodized brushed silver aluminum casing with ice cyan indicators and modern high-contrast telemetry.',
    accentColor: '#38BDF8',
    bgBase: '#0B111A',
    bgSurface: '#111A24',
    borderCol: '#1E2D3D',
    previewGradient: 'from-[#38BDF8] via-[#0284C7] to-[#111A24]',
  },
  {
    id: 'cyber-matrix',
    name: 'Phosphor Matrix',
    category: 'Analog CRT Station',
    description: 'Vintage high-persistence green CRT oscilloscopes, glowing green LED arrays, and analog hardware dials.',
    accentColor: '#00FF66',
    bgBase: '#050E07',
    bgSurface: '#091A0D',
    borderCol: '#12381C',
    previewGradient: 'from-[#00FF66] via-[#00AA44] to-[#091A0D]',
  },
  {
    id: 'midnight-studio',
    name: 'Midnight Monolith',
    category: 'Editorial Minimalist',
    description: 'Monochromatic satin carbon chassis, ultra-pure white precision readouts, and surgical studio focus.',
    accentColor: '#E2E8F0',
    bgBase: '#070709',
    bgSurface: '#0F0F12',
    borderCol: '#202026',
    previewGradient: 'from-[#E2E8F0] via-[#94A3B8] to-[#0F0F12]',
  },
];

class ThemeSkinService {
  private activeSkin: StudioSkinId = 'obsidian-gold';

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mastering_studio_skin') as StudioSkinId;
      if (saved && STUDIO_SKINS.some((s) => s.id === saved)) {
        this.activeSkin = saved;
      }
      this.applyToDocument(this.activeSkin);
    }
  }

  public getActiveSkin(): StudioSkinId {
    return this.activeSkin;
  }

  public getSkinDefinition(id?: StudioSkinId): StudioSkin {
    const target = id || this.activeSkin;
    return STUDIO_SKINS.find((s) => s.id === target) || STUDIO_SKINS[0];
  }

  public setSkin(skinId: StudioSkinId): void {
    this.activeSkin = skinId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mastering_studio_skin', skinId);
      this.applyToDocument(skinId);
      window.dispatchEvent(new CustomEvent('studio_skin_changed', { detail: { skinId } }));
    }
  }

  private applyToDocument(skinId: StudioSkinId): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-studio-skin', skinId);
  }
}

export const themeSkinService = new ThemeSkinService();
