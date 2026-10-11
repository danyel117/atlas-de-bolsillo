import countries from './countries.json' with { type: 'json' };
export { countries };
export const continents = [
  { id: 'eu', name: 'Europa', subtitle: 'Un viejo mundo por descubrir', center: [16, 53], scale: 630, color: '#d7dfc9' },
  { id: 'af', name: 'África', subtitle: 'Una tierra de mil contrastes', center: [19, 2], scale: 350, color: '#edd6ad' },
  { id: 'as', name: 'Asia', subtitle: 'De los desiertos al Pacífico', center: [91, 31], scale: 330, color: '#e4c5ba' },
  { id: 'na', name: 'Norteamérica', subtitle: 'Del Ártico al Caribe', center: [-99, 33], scale: 330, color: '#ccdce0' },
  { id: 'sa', name: 'Sudamérica', subtitle: 'Un viaje de selva y cordillera', center: [-60, -22], scale: 420, color: '#d3dbc5' },
  { id: 'oc', name: 'Oceanía', subtitle: 'Un océano de posibilidades', center: [155, -22], scale: 390, color: '#dfd5e7' },
];
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function createRound(continent, length = 10, pool = countries, random = Math.random) {
  const candidates = pool.filter(c => c.continent === continent);
  if (!candidates.length) throw new Error('No countries in selected continent');
  return shuffle(candidates, random).slice(0, length === 'all' ? candidates.length : length);
}
export function answerOptions(country, random = Math.random) {
  const distractors = shuffle(countries.filter(c => c.continent === country.continent && c.id !== country.id), random).slice(0, 3);
  return shuffle([country, ...distractors], random);
}
export function summarize(answers) {
  const correct = answers.filter(a => a.selected === a.country.id).length;
  return { correct, total: answers.length, percentage: answers.length ? Math.round(correct / answers.length * 100) : 0, mistakes: answers.filter(a => a.selected !== a.country.id) };
}
