import { createAuthClient } from 'better-auth/client';
import { magicLinkClient } from 'better-auth/client/plugins';
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
const url=import.meta.env.VITE_CONVEX_URL;
const site=import.meta.env.VITE_CONVEX_SITE_URL;
export const configured=Boolean(url&&site);
export const authClient=configured?createAuthClient({baseURL:site,plugins:[convexClient(),crossDomainClient({storagePrefix:'atlas-auth'}),magicLinkClient()]}):null;
const db=configured?new ConvexHttpClient(url):null;
export const account={user:null,loading:true,error:null,capabilities:{github:false,magicLink:false}};
const listeners=new Set();
function notify(){listeners.forEach(fn=>fn());}
export function observeAccount(fn){listeners.add(fn);return()=>listeners.delete(fn);}
export async function initializeAccount(){
  account.loading=true;account.error=null;
  const capabilities=configured?db.query(api.progress.configuration,{}).catch(()=>null):Promise.resolve(null);
  try{
    if(!configured)return;
    const callback=new URL(location.href);
    const oneTimeToken=callback.searchParams.get('ott');
    if(oneTimeToken){
      callback.searchParams.delete('ott');history.replaceState({},'',callback);
      const result=await authClient.crossDomain.oneTimeToken.verify({token:oneTimeToken});
      if(result.error)throw new Error('El enlace ha caducado. Solicita uno nuevo.');
      if(result.data?.session)await authClient.getSession({fetchOptions:{headers:{Authorization:`Bearer ${result.data.session.token}`}}});
    }
    const result=await authClient.getSession();
    if(result.error)throw new Error('No pudimos comprobar tu sesión.');
    account.user=result.data?.user??null;
    if(callback.searchParams.has('auth_error')){
      account.error='El enlace no es válido o ha caducado. Solicita uno nuevo.';
      callback.searchParams.delete('auth_error');history.replaceState({},'',callback);
    }
  }catch{account.error='No pudimos conectar con tu cuenta. Puedes seguir jugando y reintentar más tarde.';}
  finally{const available=await capabilities;if(available)account.capabilities=available;account.loading=false;notify();}
}
async function authenticated(){
  if(!account.user||!db)throw new Error('Inicia sesión para guardar tu progreso.');
  const {data,error}=await authClient.convex.token();
  if(error||!data?.token)throw new Error('Tu sesión ha caducado. Vuelve a entrar.');
  db.setAuth(data.token);return db;
}
export async function logout(){const result=await authClient.signOut();if(result.error)throw new Error('No pudimos cerrar la sesión.');db.clearAuth();account.user=null;notify();}
export async function githubLogin(){return authClient.signIn.social({provider:'github',callbackURL:`${location.origin}/?view=progress`});}
export async function emailLogin(email){return authClient.signIn.magicLink({email,callbackURL:`${location.origin}/?view=progress`,errorCallbackURL:`${location.origin}/?auth_error=1`});}
export async function fetchGames(){return (await authenticated()).query(api.progress.list,{});}
export async function uploadGame(game){return (await authenticated()).mutation(api.progress.save,{attemptId:game.attemptId,continent:game.continent,mode:game.mode,duration:game.duration,answers:game.answers});}
