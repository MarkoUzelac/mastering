import React, { useState } from 'react';
import { BookOpen, Sparkles, Volume2, Music, Radio, Disc, ArrowRight } from 'lucide-react';

export type GuideSlug =
  | 'how-to-master-music-online'
  | 'lufs-guide'
  | '24-bit-vs-16-bit'
  | 'master-for-spotify'
  | 'master-for-youtube';

interface GuideData {
  slug: GuideSlug;
  title: string;
  subtitle: string;
  readTime: string;
  category: string;
  icon: React.ElementType;
  sections: Array<{
    heading: string;
    content: string[];
    tips?: string[];
  }>;
}

export const GUIDES: Record<GuideSlug, GuideData> = {
  'how-to-master-music-online': {
    slug: 'how-to-master-music-online',
    title: 'How to Master Music Online: Studio Principles in Your Browser',
    subtitle: 'A comprehensive guide to EQ balance, dynamic range control, and loudness optimization without uploading your audio to remote servers.',
    readTime: '6 min read',
    category: 'Audio Engineering 101',
    icon: Music,
    sections: [
      {
        heading: '1. What is Audio Mastering?',
        content: [
          'Mastering is the final creative and technical step in the audio post-production pipeline. Its primary purpose is to balance sonic elements across a stereo mix, optimize spectral consistency across playback environments (from high-end club sound systems to smartphone speakers), and ensure commercial competitive loudness without audible distortion.',
          'Traditional online mastering services require uploading uncompressed multi-gigabyte audio files to third-party cloud servers. MasteringLocal.Pro revolutionizes this workflow by executing double-precision 64-bit DSP directly within your client browser using WebAssembly and Web Audio.',
        ],
        tips: [
          'Leave at least -3 dB to -6 dB of headroom on your pre-master mix before mastering.',
          'Never put a brickwall limiter on your master bus before exporting your mix for mastering.',
        ],
      },
      {
        heading: '2. The 3 Core Stages of Mastering DSP',
        content: [
          'Stage 1: Parametric Equalization (EQ) — Cleaning up muddy sub-bass (120 Hz low-shelf), sculpting melodic vocal clarity (1.2 kHz peaking), and introducing airy shimmer (8.5 kHz high-shelf).',
          'Stage 2: Stereo Dynamic Range Compression — Taming erratic micro-transients, gluing rhythmic elements together, and providing smooth makeup gain.',
          'Stage 3: Brickwall Safety Limiting — Ensuring zero digital sample inter-peaks exceed the commercial streaming ceiling (-1.0 dBFS).',
        ],
      },
    ],
  },
  'lufs-guide': {
    slug: 'lufs-guide',
    title: 'Understanding LUFS: The Complete Loudness Guide for Modern Streaming',
    subtitle: 'How ITU-R BS.1770 and EBU R128 loudness standards govern commercial streaming distribution on Spotify, Apple Music, and YouTube.',
    readTime: '5 min read',
    category: 'Loudness Standards',
    icon: Radio,
    sections: [
      {
        heading: '1. What is LUFS (Loudness Units Full Scale)?',
        content: [
          'LUFS (or LKFS) is an international standard for audio loudness measurement designed to match human acoustic perception. Unlike standard RMS (Root Mean Square) meters which treat all frequencies equally, LUFS incorporates K-weighting curves to emphasize mid-high frequencies where the human ear is most sensitive.',
        ],
      },
      {
        heading: '2. Commercial Streaming Loudness Targets',
        content: [
          '• Spotify: -14 LUFS Integrated (-1.0 dBTP ceiling)',
          '• Apple Music: -16 LUFS Integrated (-1.0 dBTP ceiling)',
          '• YouTube Music: -14 LUFS Integrated',
          '• Club / Electronic Dance Masters: -9 to -6 LUFS Integrated (prioritizing maximum density over dynamic range)',
        ],
        tips: [
          'Mastering hotter than -14 LUFS is completely fine if your genre demands it (e.g. EDM, Trap, Metal), but be aware streaming platforms will apply negative gain normalization upon playback.',
        ],
      },
    ],
  },
  '24-bit-vs-16-bit': {
    slug: '24-bit-vs-16-bit',
    title: '24-Bit vs 16-Bit Audio: Dynamic Range, Noise Floors & Export Formats',
    subtitle: 'Why 24-bit PCM and 32-bit Float are essential for studio preservation and high-resolution commercial delivery.',
    readTime: '4 min read',
    category: 'Digital Audio Theory',
    icon: Disc,
    sections: [
      {
        heading: '1. Bit Depth & Quantization Noise',
        content: [
          'Bit depth determines the dynamic range and noise floor of a digital audio recording. Every 1 bit provides approximately 6 dB of dynamic range.',
          '• 16-Bit Audio (CD Standard): 96 dB theoretical dynamic range. Ideal for consumer distribution files.',
          '• 24-Bit Studio Masters: 144 dB theoretical dynamic range. Captures micro-dynamics, reverb tails, and room acoustics with zero perceptible quantization noise.',
          '• 32-Bit Floating Point: Over 1500 dB dynamic range. Completely immune to internal digital clipping and precision truncation during processing.',
        ],
      },
    ],
  },
  'master-for-spotify': {
    slug: 'master-for-spotify',
    title: 'How to Master Music Specifically for Spotify (2026 Guidelines)',
    subtitle: 'Avoid unwanted limiting distortion and maximize loudness normalization on Spotify playback algorithms.',
    readTime: '5 min read',
    category: 'Streaming Optimization',
    icon: Volume2,
    sections: [
      {
        heading: '1. Spotify Normalization Mechanics',
        content: [
          'Spotify applies volume normalization using the ITU-R BS.1770 standard. If your master is louder than -14 LUFS, Spotify turns down the entire track with linear gain reduction without altering dynamics.',
          'However, if your track has a true peak close to 0.0 dBFS, lossy Ogg Vorbis and AAC transcoders will create inter-sample clipping distortion on consumer devices. This is why a -1.0 dBFS safety ceiling is universally recommended.',
        ],
        tips: [
          'Set your Brickwall Limiter ceiling to -1.0 dBFS.',
          'Aim for -14 LUFS for acoustic, jazz, and indie music; -10 to -8 LUFS for electronic and hip-hop.',
        ],
      },
    ],
  },
  'master-for-youtube': {
    slug: 'master-for-youtube',
    title: 'Mastering Audio for YouTube Videos and Music Content',
    subtitle: 'Calibrate your audio for YouTube’s loudness penalty and OPUS/AAC compression matrix.',
    readTime: '4 min read',
    category: 'Video & Audio Production',
    icon: Sparkles,
    sections: [
      {
        heading: '1. YouTube Loudness Penalty & OPUS Codec',
        content: [
          'YouTube normalizes video soundtracks and music to approximately -14 LUFS. You can check the exact gain reduction applied to any YouTube video by right-clicking and selecting "Stats for Nerds" (inspecting the Volume / Normalized percentage).',
        ],
        tips: [
          'Maintain vocal dialogue between -18 and -14 LUFS.',
          'Ensure high-frequency clarity above 10 kHz is clean before OPUS/AAC compression.',
        ],
      },
    ],
  },
};

interface LearnGuidesViewProps {
  initialSlug?: GuideSlug;
  onTryMastering: () => void;
}

export const LearnGuidesView: React.FC<LearnGuidesViewProps> = ({
  initialSlug = 'how-to-master-music-online',
  onTryMastering,
}) => {
  const [activeSlug, setActiveSlug] = useState<GuideSlug>(initialSlug);
  const guide = GUIDES[activeSlug];

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 md:px-8 text-left space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-[var(--accent-lime)] mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wider font-semibold">Mastering Academy & Knowledge Base</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Audio Mastering Guides</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1.5">
            Practical, studio-grade guides on loudness standards, digital audio formats, and streaming optimization.
          </p>
        </div>

        <button
          type="button"
          onClick={onTryMastering}
          className="px-4 py-2 bg-[var(--accent-lime)] hover:bg-[var(--accent-lime-hover)] text-[var(--bg-secondary)] text-xs font-semibold rounded-sm transition-colors flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          Try MasteringLocal Free
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Guide Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {(Object.keys(GUIDES) as GuideSlug[]).map((slug) => {
          const item = GUIDES[slug];
          const Icon = item.icon;
          const isActive = slug === activeSlug;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => setActiveSlug(slug)}
              className={`px-3.5 py-2 rounded-sm text-xs font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${
                isActive
                  ? 'bg-[var(--accent-lime)] text-[var(--bg-secondary)] font-semibold'
                  : 'bg-[var(--bg-elevated)] hover:bg-[#1B2028] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.title.split(':')[0]}
            </button>
          );
        })}
      </div>

      {/* Active Guide Content */}
      <article className="p-6 md:p-8 rounded-sm bg-[#121418] border border-[var(--border-subtle)] space-y-6">
        <div className="space-y-2 border-b border-[var(--border-subtle)] pb-6">
          <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
            <span className="text-[var(--accent-lime)] font-semibold">{guide.category}</span>
            <span>·</span>
            <span>{guide.readTime}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">{guide.title}</h2>
          <p className="text-sm text-[var(--text-secondary)]">{guide.subtitle}</p>
        </div>

        <div className="space-y-8 text-sm text-[var(--text-secondary)] leading-relaxed">
          {guide.sections.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">{section.heading}</h3>
              {section.content.map((p, pIdx) => (
                <p key={pIdx}>{p}</p>
              ))}

              {section.tips && section.tips.length > 0 && (
                <div className="p-4 rounded-sm bg-[#171A20] border border-[#2A313D] space-y-1.5 mt-3">
                  <div className="text-xs font-semibold text-[var(--accent-lime)]">Engineering Pro-Tip:</div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-[#E1E4EA] pl-1">
                    {section.tips.map((tip, tIdx) => (
                      <li key={tIdx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA banner inside guide */}
        <div className="p-5 rounded-sm bg-gradient-to-r from-[#171B22] to-[#121418] border border-[#2E3542] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8">
          <div>
            <div className="text-sm font-bold text-[var(--text-primary)]">Ready to master your tracks?</div>
            <div className="text-xs text-[var(--text-tertiary)]">100% browser-based. Zero audio uploads. Instant WAV download.</div>
          </div>
          <button
            type="button"
            onClick={onTryMastering}
            className="px-4 py-2 bg-[var(--accent-lime)] hover:bg-[var(--accent-lime-hover)] text-[var(--bg-secondary)] text-xs font-semibold rounded-sm transition-colors flex items-center gap-2"
          >
            Start Free Master
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </article>
    </div>
  );
};
