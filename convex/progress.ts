import { query, mutation } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { continent, mode, answer } from './schema';
import { validateAttempt } from '../src/progress-data.js';
export const save = mutation({
  args: { attemptId:v.string(), continent, mode, duration:v.number(), answers:v.array(answer) },
  handler: async (ctx,args) => {
    const identity=await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError('Inicia sesión para guardar tu progreso.');
    let score;
    try {score=validateAttempt(args);} catch {throw new ConvexError('La partida no es válida.');}
    const existing=await ctx.db.query('games').withIndex('by_user_attempt',q=>q.eq('userId',identity.subject).eq('attemptId',args.attemptId)).unique();
    if(existing) return existing._id;
    const recent=await ctx.db.query('games').withIndex('by_user',q=>q.eq('userId',identity.subject)).order('desc').take(2001);
    if(recent.length>=2000) throw new ConvexError('Tu historial está completo. Puedes exportarlo desde Mi progreso.');
    if(recent.filter(g=>g.completedAt>Date.now()-86400000).length>=100) throw new ConvexError('Has guardado muchas partidas hoy. Vuelve mañana.');
    return await ctx.db.insert('games',{...args,...score,userId:identity.subject,completedAt:Date.now()});
  },
});
export const list = query({
  args:{},
  handler:async ctx=>{
    const identity=await ctx.auth.getUserIdentity();
    if(!identity) throw new ConvexError('Inicia sesión para ver tu progreso.');
    const games=await ctx.db.query('games').withIndex('by_user',q=>q.eq('userId',identity.subject)).order('desc').take(2000);
    // The dashboard only needs summaries; keep full answers server-side.
    return games.map(({userId,answers,...game})=>game);
  },
});
export const configuration = query({args:{},handler:()=>({
  github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  magicLink: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
})});
