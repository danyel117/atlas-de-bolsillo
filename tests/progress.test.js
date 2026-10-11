import test from 'node:test';
import assert from 'node:assert/strict';
import { countries } from '../src/game.js';
import { validateAttempt, regionProgress } from '../src/progress-data.js';
const input=()=>({attemptId:crypto.randomUUID(),continent:'eu',mode:'quick',duration:25,answers:countries.filter(c=>c.continent==='eu').slice(0,10).map(c=>({countryId:c.id,selectedId:c.id}))});
test('Score ignores client supplied percentage and counts skips',()=>{const game=input();game.answers[0].selectedId=null;assert.deepEqual(validateAttempt({...game,percentage:100}),{correct:9,total:10,percentage:90});});
test('Country and selected answer must belong to region',()=>{const game=input();game.answers[0].selectedId=countries.find(c=>c.continent==='af').id;assert.throws(()=>validateAttempt(game));});
test('UUID and full rounds are validated; practice can contain one missed country',()=>{assert.throws(()=>validateAttempt({...input(),attemptId:'-'.repeat(36)}));assert.throws(()=>validateAttempt({...input(),mode:'full'}));const game=input();assert.equal(validateAttempt({...game,mode:'practice',answers:game.answers.slice(0,1)}).total,1);});
test('Improvement separates continents and round modes and sorts chronologically',()=>{
 const games=[{continent:'eu',mode:'quick',completedAt:2,percentage:70},{continent:'eu',mode:'quick',completedAt:1,percentage:30},{continent:'eu',mode:'practice',completedAt:3,percentage:100},{continent:'as',mode:'quick',completedAt:4,percentage:100}];
 const stats=regionProgress(games,'eu','quick');assert.equal(stats.count,2);assert.equal(stats.improvement,40);assert.equal(stats.recentAverage,50);assert.equal(stats.best,70);assert.equal(regionProgress(games,'af','quick').best,null);assert.equal(regionProgress(games,'eu','practice').improvement,null);
});
test('With ten games improvement compares first and last five',()=>{const games=Array.from({length:10},(_,i)=>({continent:'eu',mode:'quick',completedAt:i,percentage:i<5?20:80}));assert.equal(regionProgress(games,'eu','quick').improvement,60);});
