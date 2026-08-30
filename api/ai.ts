import type { IncomingMessage, ServerResponse } from 'node:http';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

const masteringSchema = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    measuredData: { type: 'array', items: { type: 'string' } },
    interpretation: { type: 'array', items: { type: 'string' } },
    generalAdvice: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
  required: ['answer', 'measuredData', 'interpretation', 'generalAdvice', 'confidence'],
};

const releaseSchema = {
  type: 'object',
  properties: {
    genre: { type: 'string' },
    subgenre: { type: 'string' },
    mood: { type: 'string' },
    description: { type: 'string' },
    shortBio: { type: 'string' },
    socialCaption: { type: 'string' },
    copyrightLine: { type: 'string' },
    metadataNotes: { type: 'array', items: { type: 'string' } },
    coverArtPrompt: { type: 'string' },
  },
  required: ['genre', 'subgenre', 'mood', 'description', 'shortBio', 'socialCaption', 'copyrightLine', 'metadataNotes', 'coverArtPrompt'],
};

const MASTERING_SYSTEM = `You are the mastering engineer assistant inside MasteringLocal Studio AI.
Never invent measurements. Treat fields labelled measured as authoritative observations from the browser audio engine.
Clearly separate measured data, your interpretation of those measurements, and general production advice.
Do not claim to have listened to audio unless audio bytes were explicitly supplied to this request. In this endpoint, only structured measurements are provided.`;

const RELEASE_SYSTEM = `You are the release metadata assistant inside MasteringLocal Studio AI.
Create original, professional release copy for independent artists. Do not imitate living artists or protected brands.
Keep metadata factual based on user input and mark anything that still needs human confirmation.`;

async function readBody(req: IncomingMessage): Promise<unknown> {
  const parsedBody = (req as IncomingMessage & { body?: unknown }).body;
  if (parsedBody !== undefined) return parsedBody;

  return await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 128_000) {
        reject(new Error('Request too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON request.'));
      }
    });
    req.on('error', reject);
  });
}

async function runGemini(input: string, schema: Record<string, unknown>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('AI provider is not configured.');

  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({ model: DEFAULT_MODEL, input, store: false, response_format: { type: 'text', mime_type: 'application/json', schema } }),
  });

  const payload = await response.json() as { steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || `Gemini request failed (${response.status})`);

  const outputStep = [...(payload.steps || [])].reverse().find((step) => step.type === 'model_output');
  const text = outputStep?.content?.find((item) => item.type === 'text')?.text;
  if (!text) throw new Error('Gemini returned no structured output.');
  try { return JSON.parse(text); } catch { throw new Error('Gemini returned invalid structured JSON.'); }
}

function setJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    return setJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const body = await readBody(req) as Record<string, any>;
    const route = new URL(req.url || '/', 'http://localhost').pathname;

    if (route.endsWith('/mastering')) {
      const question = typeof body.question === 'string' ? body.question.trim().slice(0, 8000) : '';
      if (!question) return setJson(res, 400, { error: 'Question is required.' });
      const audio = body.audio && typeof body.audio === 'object' ? body.audio : null;
      const prompt = `${MASTERING_SYSTEM}\n\nUSER QUESTION:\n${question}\n\nMEASURED AUDIO SNAPSHOT (may be null):\n${JSON.stringify(audio)}\n\nREFERENCE TARGET:\n${JSON.stringify({ targetLufs: body.targetLufs ?? null, referencePlatform: body.referencePlatform ?? null })}`;
      return setJson(res, 200, await runGemini(prompt, masteringSchema));
    }

    if (route.endsWith('/release')) {
      const artist = typeof body.artist === 'string' ? body.artist.trim().slice(0, 500) : '';
      const title = typeof body.title === 'string' ? body.title.trim().slice(0, 500) : '';
      if (!artist || !title) return setJson(res, 400, { error: 'Artist and title are required.' });
      const prompt = `${RELEASE_SYSTEM}\n\nCreate a release package from this data:\n${JSON.stringify({ artist, title, genre: body.genre || '', subgenre: body.subgenre || '', mood: body.mood || '', bpm: body.bpm ?? null, key: body.key || '', producer: body.producer || '', mixingEngineer: body.mixingEngineer || '', masteringEngineer: body.masteringEngineer || '', copyright: body.copyright || '' })}`;
      return setJson(res, 200, await runGemini(prompt, releaseSchema));
    }

    return setJson(res, 404, { error: 'Unknown AI route.' });
  } catch (error) {
    console.error('[AI]', error);
    return setJson(res, 502, { error: error instanceof Error ? error.message : 'AI request failed.' });
  }
}
