import { geoNaturalEarth1, geoAzimuthalEquidistant, geoPath, geoGraticule10 } from 'd3-geo';
import { feature } from 'topojson-client';
let world;
export async function loadMap() {
  const response = await fetch('/world-50m.json');
  if (!response.ok) throw new Error('El mapa no se pudo descargar.');
  const topology = await response.json();
  world = feature(topology, topology.objects.countries).features;
}
function escape(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c])); }
export function worldMap() {
  const p = geoNaturalEarth1().fitExtent([[15, 15], [785, 405]], {type: 'Sphere'});
  const path = geoPath(p);
  return `<svg viewBox="0 0 800 420" aria-hidden="true"><path class="graticule" d="${path(geoGraticule10())}"/>${world.filter(f=>f.id!=='010').map(f=>`<path class="world-country" d="${path(f)}"/>`).join('')}</svg>`;
}
export function continentMap(continent, countries, highlighted, compact = false) {
  const w = compact ? 340 : 800, h = compact ? 180 : 530;
  // Regional projection keeps Pacific islands on the same side of the date line.
  const p = geoAzimuthalEquidistant().rotate([-continent.center[0], -continent.center[1]]).clipAngle(85).scale(continent.scale * w / 800).translate([w / 2, h / 2]);
  const path = geoPath(p);
  const ids = new Set(countries.filter(c=>c.continent===continent.id).map(c=>c.id));
  const paths = world.filter(f=>f.id!=='010').map(f=>`<path class="map-country ${ids.has(f.id)?'in-region':''} ${f.id===highlighted?.id?'highlighted':''}" d="${path(f)||''}"/>`).join('');
  let marker = '';
  if (highlighted) {
    // Every target has a visible locator, including islands and missing microstates.
    const location = p(highlighted.location);
    if (location && location.every(Number.isFinite)) {
      marker = `<circle class="locator-ring" cx="${location[0]}" cy="${location[1]}" r="13"/><circle class="locator-dot" cx="${location[0]}" cy="${location[1]}" r="4"/>`;
    }
  }
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${escape(highlighted?'Mapa de '+continent.name+'. Identifica el país resaltado y señalado por el círculo.':'Mapa de '+continent.name)}"><path class="graticule" d="${path(geoGraticule10())}"/>${paths}${marker}</svg>`;
}
