import React, { useMemo, useState } from 'react';
import { Bot, Copy, Loader2, Sparkles, X } from 'lucide-react';
import { askMasteringEngineer, generateReleasePackage } from '../ai/client';
import type { MasteringAiResponse, ReleaseAssistantResponse, StructuredAudioSnapshot } from '../ai/contracts';

interface StudioAiReleaseModalProps {
  mode: 'assistant' | 'release';
  onClose: () => void;
  audioSnapshot?: StructuredAudioSnapshot | null;
}

const inputClass = 'w-full bg-[#07090C] border border-[var(--border-subtle)] rounded-sm px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-lime)]';

export const StudioAiReleaseModal: React.FC<StudioAiReleaseModalProps> = ({ mode, onClose, audioSnapshot }) => {
  const [question, setQuestion] = useState('Why does my mix sound quiet?');
  const [assistantResult, setAssistantResult] = useState<MasteringAiResponse | null>(null);
  const [releaseResult, setReleaseResult] = useState<ReleaseAssistantResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [bpm, setBpm] = useState('');
  const [key, setKey] = useState('');
  const [producer, setProducer] = useState('');

  const titleText = mode === 'assistant' ? 'ASK THE MASTERING ENGINEER' : 'RELEASE ASSISTANT';

  const measuredLines = useMemo(() => {
    if (!audioSnapshot) return ['No measured audio snapshot is available. The assistant will not invent measurements.'];
    return [
      `Integrated LUFS: ${audioSnapshot.integratedLufs == null ? 'n/a' : audioSnapshot.integratedLufs.toFixed(1)}`,
      `True peak: ${audioSnapshot.truePeakDbtp == null ? 'n/a' : `${audioSnapshot.truePeakDbtp.toFixed(1)} dBTP`}`,
      `RMS: ${audioSnapshot.rmsDb == null ? 'n/a' : `${audioSnapshot.rmsDb.toFixed(1)} dBFS`}`,
      `Crest factor: ${audioSnapshot.crestFactorDb == null ? 'n/a' : `${audioSnapshot.crestFactorDb.toFixed(1)} dB`}`,
      `Clipping: ${audioSnapshot.clippingDetected == null ? 'n/a' : audioSnapshot.clippingDetected ? 'detected' : 'not detected'}`,
    ];
  }, [audioSnapshot]);

  const handleAsk = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await askMasteringEngineer({ question, audio: audioSnapshot || null });
      setAssistantResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateReleasePackage({
        artist,
        title,
        genre,
        mood,
        bpm: bpm ? Number(bpm) : null,
        key,
        producer,
      });
      setReleaseResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed.');
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string) => {
    await navigator.clipboard?.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-[var(--accent-lime)]/10 border border-[var(--accent-lime)]/30 flex items-center justify-center">
              {mode === 'assistant' ? <Bot className="w-4 h-4 text-[var(--accent-lime)]" /> : <Sparkles className="w-4 h-4 text-[var(--accent-lime)]" />}
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-[0.22em] text-[var(--accent-lime)]">MASTERINGLOCAL STUDIO AI</div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">{titleText}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {mode === 'assistant' ? (
            <>
              <div className="grid lg:grid-cols-[1fr_220px] gap-5">
                <div className="space-y-3">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-secondary)]">Question</label>
                  <textarea value={question} onChange={(e) => setQuestion(e.target.value)} className={`${inputClass} min-h-28 resize-y`} />
                  <button onClick={handleAsk} disabled={loading || !question.trim()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-[var(--accent-lime)] text-black font-semibold disabled:opacity-50">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loading ? 'ANALYZING…' : 'ASK ENGINEER'}
                  </button>
                </div>
                <div className="border border-[var(--border-subtle)] bg-[#07090C] rounded-sm p-3">
                  <div className="text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] mb-2">MEASURED DATA</div>
                  <div className="space-y-1.5 text-[11px] font-mono text-[var(--text-secondary)]">
                    {measuredLines.map((line) => <div key={line}>{line}</div>)}
                  </div>
                </div>
              </div>

              {assistantResult && (
                <div className="space-y-4">
                  <div className="border border-[var(--border-subtle)] rounded-sm p-4 bg-[#07090C]">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-[10px] font-mono tracking-widest text-[var(--accent-lime)]">ANSWER</span>
                      <span className="text-[10px] font-mono text-[var(--text-tertiary)]">CONFIDENCE: {assistantResult.confidence.toUpperCase()}</span>
                    </div>
                    <p className="text-sm leading-6 text-[var(--text-primary)]">{assistantResult.answer}</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    {[
                      ['MEASURED', assistantResult.measuredData],
                      ['INTERPRETATION', assistantResult.interpretation],
                      ['GENERAL ADVICE', assistantResult.generalAdvice],
                    ].map(([label, items]) => (
                      <div key={label as string} className="border border-[var(--border-subtle)] rounded-sm p-3">
                        <div className="text-[10px] font-mono tracking-widest text-[var(--text-secondary)] mb-2">{label as string}</div>
                        <div className="space-y-2 text-xs text-[var(--text-primary)]">
                          {(items as string[]).map((item) => <div key={item}>• {item}</div>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-3">
                <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist name" className={inputClass} />
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Track title" className={inputClass} />
                <input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Genre" className={inputClass} />
                <input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="Mood" className={inputClass} />
                <input value={bpm} onChange={(e) => setBpm(e.target.value)} placeholder="BPM" inputMode="decimal" className={inputClass} />
                <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Key" className={inputClass} />
                <input value={producer} onChange={(e) => setProducer(e.target.value)} placeholder="Producer" className={`${inputClass} md:col-span-2`} />
              </div>
              <button onClick={handleGenerate} disabled={loading || !artist.trim() || !title.trim()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-[var(--accent-lime)] text-black font-semibold disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'GENERATING…' : 'GENERATE RELEASE PACKAGE'}
              </button>

              {releaseResult && (
                <div className="space-y-3">
                  <ResultBlock label="DESCRIPTION" value={releaseResult.description} onCopy={copy} />
                  <ResultBlock label="SHORT BIO" value={releaseResult.shortBio} onCopy={copy} />
                  <ResultBlock label="SOCIAL CAPTION" value={releaseResult.socialCaption} onCopy={copy} />
                  <ResultBlock label="COVER ART PROMPT" value={releaseResult.coverArtPrompt} onCopy={copy} />
                  <ResultBlock label="COPYRIGHT LINE" value={releaseResult.copyrightLine} onCopy={copy} />
                  <div className="border border-[var(--border-subtle)] rounded-sm p-3">
                    <div className="text-[10px] font-mono tracking-widest text-[var(--text-secondary)] mb-2">METADATA NOTES</div>
                    <div className="space-y-1.5 text-xs text-[var(--text-primary)]">
                      {releaseResult.metadataNotes.map((item) => <div key={item}>• {item}</div>)}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {error && <div className="border border-red-500/30 bg-red-500/5 rounded-sm p-3 text-xs text-red-300">{error}</div>}
        </div>
      </div>
    </div>
  );
};

const ResultBlock: React.FC<{ label: string; value: string; onCopy: (text: string) => void }> = ({ label, value, onCopy }) => (
  <div className="border border-[var(--border-subtle)] rounded-sm p-3 bg-[#07090C]">
    <div className="flex items-center justify-between gap-3 mb-2">
      <div className="text-[10px] font-mono tracking-widest text-[var(--text-secondary)]">{label}</div>
      <button onClick={() => onCopy(value)} className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><Copy className="w-3 h-3" /> COPY</button>
    </div>
    <div className="text-xs leading-5 text-[var(--text-primary)] whitespace-pre-wrap">{value}</div>
  </div>
);
