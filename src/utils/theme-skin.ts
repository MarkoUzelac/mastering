export type StudioSkinId = 'phosphor-dark' | 'phosphor-light';

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
    id: 'phosphor-dark',
    name: 'Phosphor Dark',
    category: 'Flagship Aesthetic',
    description: 'Deep carbon obsidian chassis, precision neon lime indicators, and sharp typographic layouts.',
    accentColor: '#B7F000',
    bgBase: '#090A08',
    bgSurface: '#151714',
    borderCol: '#222420',
    previewGradient: 'from-[#B7F000] via-[#5C7A00] to-[#090A08]',
  },
  {
    id: 'phosphor-light',
    name: 'Phosphor Light',
    category: 'Daylight Layout',
    description: 'Crisp bright environment, minimal borders, and high-contrast typography.',
    accentColor: '#B7F000',
    bgBase: '#F5F5F3',
    bgSurface: '#FFFFFF',
    borderCol: '#EBE0E6',
    previewGradient: 'from-[#B7F000] via-[#D9F99D] to-[#F5F5F3]',
  }
];

class ThemeSkinService {
  private activeSkin: StudioSkinId = 'phosphor-dark';

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
