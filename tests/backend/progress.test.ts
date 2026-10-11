import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import schema from '../../convex/schema';
import { api } from '../../convex/_generated/api';
import { countries } from '../../src/game.js';
const modules=import.meta.glob('../../convex/**/*.ts');
function attempt(overrides={}){
  return {attemptId:crypto.randomUUID(),continent:'eu' as const,mode:'quick' as const,duration:30,answers:countries.filter(c=>c.continent==='eu').slice(0,10).map((c,i)=>({countryId:c.id,selectedId:i<7?c.id:null})),...overrides};
}
describe('Personal progress',()=>{
  test('Guests cannot save or read persisted results',async()=>{
    const t=convexTest(schema,modules);
    await expect(t.mutation(api.progress.save,attempt())).rejects.toThrow('Inicia sesión');
    await expect(t.query(api.progress.list,{})).rejects.toThrow('Inicia sesión');
  });
  test('Results belong to authenticated user and scores are calculated from answers',async()=>{
    const t=convexTest(schema,modules),alice=t.withIdentity({subject:'alice'}),bob=t.withIdentity({subject:'bob'});
    await alice.mutation(api.progress.save,attempt());await bob.mutation(api.progress.save,attempt());
    const aliceGames=await alice.query(api.progress.list,{}),bobGames=await bob.query(api.progress.list,{});
    expect(aliceGames).toHaveLength(1);expect(bobGames).toHaveLength(1);
    expect(aliceGames[0]).toMatchObject({correct:7,total:10,percentage:70});
    expect(aliceGames[0]._id).not.toBe(bobGames[0]._id);expect(aliceGames[0]).not.toHaveProperty('userId');
  });
  test('Replaying a pending upload saves only one result, including across users',async()=>{
    const t=convexTest(schema,modules),alice=t.withIdentity({subject:'alice'}),input=attempt();
    const first=await alice.mutation(api.progress.save,input),second=await alice.mutation(api.progress.save,input);
    expect(first).toBe(second);expect(await alice.query(api.progress.list,{})).toHaveLength(1);
    await t.withIdentity({subject:'bob'}).mutation(api.progress.save,input);
    expect(await alice.query(api.progress.list,{})).toHaveLength(1);
  });
  test('Malformed/incomplete rounds cannot be saved',async()=>{
    const t=convexTest(schema,modules).withIdentity({subject:'alice'}),input=attempt();
    await expect(t.mutation(api.progress.save,{...input,answers:input.answers.slice(1)})).rejects.toThrow('no es válida');
    await expect(t.mutation(api.progress.save,{...input,answers:Array(10).fill(input.answers[0])})).rejects.toThrow('no es válida');
    await expect(t.mutation(api.progress.save,{...input,mode:'full'})).rejects.toThrow('no es válida');
    await expect(t.mutation(api.progress.save,{...input,duration:-1})).rejects.toThrow('no es válida');
    expect(await t.query(api.progress.list,{})).toHaveLength(0);
  });
  test('Daily upload limit rejects additional games but permits idempotent retry',async()=>{
    const t=convexTest(schema,modules),alice=t.withIdentity({subject:'alice'}),input=attempt();
    await alice.mutation(api.progress.save,input);
    await t.run(async ctx=>{for(let i=0;i<99;i++)await ctx.db.insert('games',{...attempt(),userId:'alice',completedAt:Date.now(),correct:7,total:10,percentage:70});});
    await expect(alice.mutation(api.progress.save,attempt())).rejects.toThrow('muchas partidas');
    await expect(alice.mutation(api.progress.save,input)).resolves.toBeDefined();
    await expect(t.withIdentity({subject:'bob'}).mutation(api.progress.save,attempt())).resolves.toBeDefined();
  });
});
