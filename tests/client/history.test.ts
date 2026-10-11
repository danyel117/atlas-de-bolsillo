import { beforeEach, expect, test, vi } from 'vitest';
import { countries } from '../../src/game.js';
const mocks=vi.hoisted(()=>({account:{user:null as {id:string}|null},fetchGames:vi.fn(),uploadGame:vi.fn()}));
vi.mock('../../src/lib/account.js',()=>mocks);
let stored:string|null;
beforeEach(()=>{
 vi.resetModules();stored=null;mocks.account.user=null;mocks.fetchGames.mockReset().mockResolvedValue([]);mocks.uploadGame.mockReset().mockResolvedValue('saved');
 vi.stubGlobal('localStorage',{getItem:()=>stored,setItem:(_key:string,value:string)=>{stored=value;}});
});
function game(history:any){return history.createAttempt({attemptId:crypto.randomUUID(),continent:'eu',mode:'quick',duration:20,answers:countries.filter(c=>c.continent==='eu').slice(0,10).map(country=>({country,selected:country.id}))});}
test('Guest history stays local until the signed-in user explicitly imports it',async()=>{
 const history=await import('../../src/history.js');await history.recordAttempt(game(history));expect(history.visibleHistory()).toHaveLength(1);expect(mocks.uploadGame).not.toHaveBeenCalled();
 mocks.account.user={id:'alice'};expect(history.visibleHistory()).toHaveLength(0);expect(history.guestCount()).toBe(1);
 await history.importGuestHistory();expect(history.visibleHistory()).toHaveLength(1);expect(mocks.uploadGame).toHaveBeenCalledTimes(1);
 mocks.account.user={id:'bob'};expect(history.visibleHistory()).toHaveLength(0);
});
test('A failed upload retries once connectivity returns and does not upload again afterward',async()=>{
 const history=await import('../../src/history.js');mocks.account.user={id:'alice'};mocks.uploadGame.mockRejectedValueOnce(new Error('offline'));
 expect((await history.recordAttempt(game(history))).state).toBe('pending');expect(history.visibleHistory()[0].pending).toBe(true);
 await history.refreshHistory();expect(mocks.uploadGame).toHaveBeenCalledTimes(2);expect(history.visibleHistory()[0].pending).toBe(false);
 await history.refreshHistory();expect(mocks.uploadGame).toHaveBeenCalledTimes(2);
});
test('Full browser storage does not lose a new result before upload or claim a guest result persisted',async()=>{
 const history=await import('../../src/history.js');vi.stubGlobal('localStorage',{getItem:()=>stored,setItem:()=>{throw new Error('quota');}});
 expect((await history.recordAttempt(game(history))).state).toBe('memory');expect(history.visibleHistory()).toHaveLength(1);
 mocks.account.user={id:'alice'};expect((await history.recordAttempt(game(history))).state).toBe('saved');expect(mocks.uploadGame).toHaveBeenCalledTimes(1);
});
test('Pending results from another account are never uploaded under the current account',async()=>{
 const history=await import('../../src/history.js');mocks.account.user={id:'alice'};mocks.uploadGame.mockRejectedValueOnce(new Error('offline'));await history.recordAttempt(game(history));
 mocks.account.user={id:'bob'};await history.refreshHistory();expect(mocks.uploadGame).toHaveBeenCalledTimes(1);expect(history.visibleHistory()).toHaveLength(0);
});
