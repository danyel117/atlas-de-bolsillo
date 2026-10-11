import { countries, continents } from './game.js';
export const modes = ['quick', 'full', 'practice'];
export function validateAttempt(input) {
  if (!continents.some(c => c.id === input.continent) || !modes.includes(input.mode)) throw new Error('Partida inválida');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.attemptId)) throw new Error('Identificador inválido');
  if (!Number.isInteger(input.duration) || input.duration < 0 || input.duration > 604800) throw new Error('Duración inválida');
  const pool = countries.filter(c => c.continent === input.continent);
  if (!Array.isArray(input.answers) || !input.answers.length || input.answers.length > pool.length) throw new Error('Respuestas inválidas');
  if (input.mode === 'quick' && input.answers.length !== 10) throw new Error('La partida rápida requiere 10 países');
  if (input.mode === 'full' && input.answers.length !== pool.length) throw new Error('El continente debe estar completo');
  const seen = new Set();
  for (const a of input.answers) {
    if (seen.has(a.countryId) || !pool.some(c => c.id === a.countryId)) throw new Error('País repetido o fuera del continente');
    seen.add(a.countryId);
    if (a.selectedId !== null && !pool.some(c => c.id === a.selectedId)) throw new Error('Respuesta desconocida');
  }
  const correct = input.answers.filter(a => a.countryId === a.selectedId).length;
  return { correct, total: input.answers.length, percentage: Math.round(100 * correct / input.answers.length) };
}
export function regionProgress(games, continent, mode) {
  const records = games.filter(g => g.continent === continent && g.mode === mode).sort((a,b) => a.completedAt - b.completedAt);
  if (!records.length) return { records: [], count: 0, best: null, average: null, improvement: null, recentAverage: null };
  const avg = rows => Math.round(rows.reduce((sum,g) => sum + g.percentage, 0) / rows.length);
  const baseline = records.slice(0, Math.min(5, records.length));
  const recent = records.slice(-5);
  return { records, count: records.length, best: Math.max(...records.map(g => g.percentage)), average: avg(records), recentAverage: avg(recent), improvement: records.length < 2 ? null : records.length < 10 ? records.at(-1).percentage - records[0].percentage : avg(recent) - avg(baseline) };
}
