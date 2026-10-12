/** Typed client for the Django API (/api). Every rule is enforced by the server; this only carries the token. */

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

const TOKEN_KEY = 'edusaas_token';
let token: string | null = null;
try { token = localStorage.getItem(TOKEN_KEY); } catch { /* storage blocked: stay signed out */ }

export function getToken() { return token; }
export function setToken(t: string | null) {
  token = t;
  try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

/** Called when the server says the session is no longer valid (401). The app shell signs out. */
let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(fn: () => void) { onUnauthorized = fn; }

export async function call<T>(method: string, path: string, body?: unknown, opts?: { keepalive?: boolean }): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = 'Bearer ' + token;
  let r: Response;
  try {
    r = await fetch('/api/' + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined,
      keepalive: !!opts?.keepalive });
  } catch {
    throw new ApiError(0, 'network', navigator.onLine === false ? 'Check your internet connection.' : 'Cannot reach the server.');
  }
  const data = await r.json().catch(() => ({}));
  if (r.ok) return data as T;
  if (r.status === 401 && token) { setToken(null); onUnauthorized(); }
  throw new ApiError(r.status, data.error || 'error', data.message || `Request failed (${r.status})`);
}
export const get = <T>(p: string) => call<T>('GET', p);
export const post = <T>(p: string, b: unknown = {}, o?: { keepalive?: boolean }) => call<T>('POST', p, b, o);
export const del = <T>(p: string) => call<T>('DELETE', p);

/** Media paths come back relative ("media/phy11/…"); the app lives under /app/, so make them absolute. */
export const media = (p: string) => (p.startsWith('/') || p.startsWith('http') ? p : '/' + p);

// ---------- response types ----------
export type Role = 'student' | 'teacher' | 'parent' | 'college_admin';
export interface Me {
  id: string; name: string; role: Role; gender: string; language: 'en' | 'ur'; college: string | null; phone: string;
  class?: string; roll?: string;
}
export interface Progress {
  heardShare: number; heardShareMix?: number; heardShareUr?: number; unlocked: boolean; passed: boolean;
  best: number | null; heardSecs: number[]; heardSecsUr?: number[];
}
export interface LessonSummary {
  id: string; topic: string; title: string; pages: number[]; minutes: number; duration: number; audioBytes: number;
  unit: number; unitTitle: string; subject: string; subjectCode: string; review: string; progress: Progress; missed?: boolean;
}
export interface ScriptLine { pg: number; x: string; t: number }
export interface LessonFull extends LessonSummary {
  images: string[]; imagesSmall: string[]; audio: string; script: ScriptLine[]; missed: boolean;
  urdu: { audio: string; duration: number; review: string; script: ScriptLine[] } | null;
}
export interface ClearanceLesson { id: string; topic: string; title: string; subject: string; subjectCode: string }
export interface Clearance {
  id: number; student: string; studentId: string; roll: string; lesson: ClearanceLesson; date: string;
  status: 'pending' | 'cleared'; clearedBy: string; attempts: number; best: number | null; lastAttempt: string | null;
  clearedAt: string | null; overrideReason: string;
  whatsapp?: { phone: string; parent: string; text: string; notifiedAt: string | null } | null;
}
export interface SubjectCard { code: string; name: string; grade: string; status: 'live' | 'coming_soon'; total: number; done: number; pending: number }
export interface StudentHome {
  me: Me; subjects: SubjectCard[]; lessons: LessonSummary[]; clearances: Clearance[];
  nextGrade: { grade: string; subjects: string[] } | null;
}
export interface UnitRow { number: number; title: string; status: 'live' | 'coming_soon'; lessons: LessonSummary[] }
export interface SubjectDetail { subject: { code: string; name: string; grade: string; status: string }; units: UnitRow[] }
export interface QuizStart {
  attempt: string; passMark: number; size: number; lesson: { id: string; topic: string; title: string; subject: string };
  questions: { question: string; options: string[] }[];
}
export interface QuizResult {
  score: number; size: number; passMark: number; passed: boolean; cleared: boolean; attempts: number; retryAfter: number;
  review: { question: string; options: string[]; chosen: number | null; correct: number; ok: boolean; explanation: string }[];
}
export interface Message {
  id: number; to: string; toRole: string; phone: string; channel: string; type: string; body: string; status: string;
  error: string; at: string; student: string; manual: boolean; pushed: { ok: number; total: number } | null;
}
