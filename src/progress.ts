import { missions } from './data';
export type Attempt = { id: string; missionSlug: string; version: string; createdAt: string; completedAt?: string; answers: string[]; confirmed: boolean[]; index: number; evidence: string };
export type DemoState = { schema: 1; attempts: Attempt[]; reducedMotion: boolean };
export const initialState: DemoState = { schema: 1, attempts: [], reducedMotion: false };
export const STORAGE_KEY = 'tpplay-demo-v1';
export function scoreAttempt(attempt: Attempt) {
  const mission = missions.find(item => item.slug === attempt.missionSlug && item.version === attempt.version);
  if (!mission) return 0;
  return mission.steps.reduce((score, step, index) => score + (attempt.confirmed[index] && attempt.answers[index]?.trim() !== '' && Number(attempt.answers[index]) === step.correct ? 1 : 0), 0);
}
export function summarize(attempts: Attempt[]) {
  const completed = [...new Map(attempts.filter(a => a.completedAt).map(a => [a.id, a])).values()]
    .sort((a, b) => a.completedAt!.localeCompare(b.completedAt!));
  const milestones = missions.map(mission => {
    const items = completed.filter(a => a.missionSlug === mission.slug && a.version === mission.version);
    const first = items[0];
    const best = items.reduce((value, a) => Math.max(value, scoreAttempt(a)), 0);
    const improved = !!first && best > scoreAttempt(first);
    return { slug: mission.slug, completed: !!first, best, improved, xp: first ? 100 + (improved ? 50 : 0) : 0 };
  });
  const xp = milestones.reduce((sum, item) => sum + item.xp, 0);
  return { milestones, xp, level: Math.floor(xp / 200) + 1, completedCount: milestones.filter(m => m.completed).length, improved: milestones.some(m => m.improved) };
}
export function makeAttempt(slug: string): Attempt {
  const mission = missions.find(m => m.slug === slug);
  if (!mission) throw new Error('Misión no encontrada');
  return { id: crypto.randomUUID(), missionSlug: slug, version: mission.version, createdAt: new Date().toISOString(), answers: [], confirmed: [], index: 0, evidence: '' };
}
export function parseDemoState(value: string): DemoState {
  const parsed = JSON.parse(value);
  if (parsed.schema !== 1 || !Array.isArray(parsed.attempts)) throw new Error('Formato de avance incompatible');
  for (const attempt of parsed.attempts) {
    const mission = missions.find(m => m.slug === attempt.missionSlug && m.version === attempt.version);
    if (!mission || typeof attempt.id !== 'string' || typeof attempt.createdAt !== 'string' ||
        !Array.isArray(attempt.answers) || !attempt.answers.every((v: unknown) => typeof v === 'string') ||
        !Array.isArray(attempt.confirmed) || !attempt.confirmed.every((v: unknown) => typeof v === 'boolean') ||
        !Number.isInteger(attempt.index) || attempt.index < 0 || attempt.index > mission.steps.length ||
        typeof attempt.evidence !== 'string' || (attempt.completedAt && typeof attempt.completedAt !== 'string')) throw new Error('No se pudo leer un intento guardado');
  }
  return { schema: 1, attempts: parsed.attempts, reducedMotion: parsed.reducedMotion === true };
}
