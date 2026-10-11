import { account, fetchGames, uploadGame } from './lib/account.js';
import { validateAttempt } from './progress-data.js';
const key='atlas-history-v1';
let memory=[],remote=[],remoteOwner=null,flushing=false,memoryOnly=false;
function read(){if(memoryOnly)return memory;try{const rows=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(rows)?rows:memory;}catch{return memory;}}
function write(rows){memory=rows;try{localStorage.setItem(key,JSON.stringify(rows));memoryOnly=false;return true;}catch{memoryOnly=true;return false;}}
export function visibleHistory(){
  const owner=account.user?.id??null;
  const merged=new Map((remoteOwner===owner?remote:[]).map(g=>[g.attemptId,g]));
  for(const game of read().filter(g=>g.owner===owner)){if(!merged.has(game.attemptId))merged.set(game.attemptId,game);}
  return [...merged.values()].sort((a,b)=>a.completedAt-b.completedAt);
}
export function guestCount(){return read().filter(g=>g.owner===null).length;}
export function createAttempt({attemptId,continent,mode,duration,answers}){
  const input={attemptId,continent,mode,duration,answers:answers.map(a=>({countryId:a.country.id,selectedId:a.selected}))};
  return {...input,...validateAttempt(input),owner:account.user?.id??null,completedAt:Date.now(),pending:Boolean(account.user)};
}
export async function recordAttempt(game){
  const rows=read();if(!rows.some(g=>g.attemptId===game.attemptId))rows.push(game);
  const persisted=write(rows.slice(-2000));
  if(!account.user)return {state:persisted?'local':'memory'};
  try{await flushHistory();return {state:read().find(g=>g.attemptId===game.attemptId)?.pending?'pending':'saved'};}catch(error){return {state:'pending',error:persisted?historyError(error):'No pudimos guardar en tu cuenta ni en el navegador. Mantén esta página abierta y reintenta desde Mi progreso.'};}
}
export async function flushHistory(){
  if(flushing||!account.user)return;
  flushing=true;const owner=account.user.id;
  try{
    for(const game of read().filter(g=>g.owner===owner&&g.pending)){
      if(account.user?.id!==owner)break;
      await uploadGame(game);
      write(read().map(g=>g.attemptId===game.attemptId&&g.owner===owner?{...g,pending:false}:g));
    }
    if(account.user?.id===owner){remote=await fetchGames();remoteOwner=owner;}
  }finally{flushing=false;}
}
export async function refreshHistory(){
  if(!account.user){remote=[];remoteOwner=null;return visibleHistory();}
  await flushHistory();return visibleHistory();
}
export async function importGuestHistory(){
  if(!account.user)throw new Error('Inicia sesión primero.');
  write(read().map(g=>g.owner===null?{...g,owner:account.user.id,pending:true}:g));
  await flushHistory();
}
export function historyError(error){return typeof error?.data==='string'?error.data:'No pudimos sincronizar. Tu partida queda pendiente en este navegador. Comprueba tu conexión o vuelve a entrar.';}
