import type {
  MasteringAiRequest,
  MasteringAiResponse,
  ReleaseAssistantRequest,
  ReleaseAssistantResponse,
} from './contracts';
import { getApiAuthHeaders } from '../lib/firebase';

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', ...(await getApiAuthHeaders()) },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.error || `AI request failed (${response.status})`);
  }

  return payload as T;
}

export function askMasteringEngineer(request: MasteringAiRequest): Promise<MasteringAiResponse> {
  return postJson<MasteringAiResponse>('/api/ai/mastering', request);
}

export function generateReleasePackage(request: ReleaseAssistantRequest): Promise<ReleaseAssistantResponse> {
  return postJson<ReleaseAssistantResponse>('/api/ai/release', request);
}
