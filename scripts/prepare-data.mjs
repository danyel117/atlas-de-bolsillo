import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const source = JSON.parse(await readFile(require.resolve('world-countries/countries.json'), 'utf8'));
const countries = source.filter(c => c.unMember || ['VAT', 'PSE'].includes(c.cca3)).map(c => ({
  id: c.ccn3, code: c.cca3, name: c.translations.spa.common,
  continent: c.cca3 === 'CYP' ? 'as' : c.cca3 === 'RUS' ? 'eu' : c.region === 'Europe' ? 'eu' : c.region === 'Africa' ? 'af' : c.region === 'Asia' ? 'as' : c.region === 'Oceania' ? 'oc' : c.subregion === 'South America' ? 'sa' : 'na',
  location: c.cca3 === 'RUS' ? [38, 57] : [c.latlng[1], c.latlng[0]],
}));
if (countries.length !== 195) throw new Error(`Expected 195 countries, got ${countries.length}`);
await writeFile('src/countries.json', JSON.stringify(countries));
await copyFile(require.resolve('world-atlas/countries-50m.json'), 'public/world-50m.json');
console.log(`Prepared ${countries.length} countries and local map.`);
