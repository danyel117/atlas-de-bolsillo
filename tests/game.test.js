import test from 'node:test';
import assert from 'node:assert/strict';
import { countries, continents, createRound, answerOptions, summarize } from '../src/game.js';
import { geoAzimuthalEquidistant, geoDistance } from 'd3-geo';
test('All 195 countries have a unique id and exactly one playable region',()=>{
  assert.equal(countries.length,195); assert.equal(new Set(countries.map(c=>c.id)).size,195);
  for(const c of countries){assert.ok(continents.some(r=>r.id===c.continent));assert.ok(c.name);assert.equal(c.location.length,2);}
});
test('Quick and full rounds contain no repeated countries or foreign regions',()=>{
  for(const r of continents){for(const length of [10,'all']){const round=createRound(r.id,length);const n=countries.filter(c=>c.continent===r.id).length;assert.equal(round.length,length==='all'?n:Math.min(n,10));assert.equal(new Set(round.map(c=>c.id)).size,round.length);assert.ok(round.every(c=>c.continent===r.id));}}
});
test('Each question includes the right answer once and three unique distractors',()=>{
  for(const c of countries){const options=answerOptions(c);assert.equal(options.length,4);assert.equal(new Set(options.map(c=>c.id)).size,4);assert.equal(options.filter(o=>o.id===c.id).length,1);assert.ok(options.every(o=>o.continent===c.continent));}
});
test('Score counts wrong answers and skips and exposes the exact retry pool',()=>{
  const [a,b,c]=countries;const summary=summarize([{country:a,selected:a.id},{country:b,selected:a.id},{country:c,selected:null}]);assert.equal(summary.correct,1);assert.equal(summary.percentage,33);assert.deepEqual(summary.mistakes.map(a=>a.country),[b,c]);assert.equal(summarize([]).percentage,0);
});
test('Retry round only contains missed countries even when pool is smaller than 10',()=>{const pool=countries.filter(c=>c.continent==='eu').slice(0,2);assert.deepEqual(new Set(createRound('eu',10,pool).map(c=>c.id)),new Set(pool.map(c=>c.id)));});
test('Every country marker falls within its regional map',()=>{for(const c of countries){const r=continents.find(r=>r.id===c.continent);const p=geoAzimuthalEquidistant().rotate([-r.center[0],-r.center[1]]).clipAngle(85).scale(r.scale).translate([400,265]);const [x,y]=p(c.location);assert.ok(geoDistance(r.center,c.location)*180/Math.PI<85,`${c.name} is clipped`);assert.ok(x>14&&x<786&&y>14&&y<516,`${c.name} marker is outside frame: ${x},${y}`);}});
