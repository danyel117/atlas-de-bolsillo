import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex, crossDomain } from '@convex-dev/better-auth/plugins';
import { betterAuth } from 'better-auth/minimal';
import { magicLink } from 'better-auth/plugins/magic-link';
import { components } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import authConfig from './auth.config';
const siteUrl=process.env.SITE_URL || 'http://localhost:5173';
const trustedOrigins=siteUrl.startsWith('http://localhost:')?[siteUrl]:[siteUrl,'https://atlas-de-bolsillo.vercel.app'];
export const authComponent=createClient<DataModel>(components.betterAuth);
export const createAuth=(ctx:GenericCtx<DataModel>)=>betterAuth({
  appName:'Atlas de bolsillo',baseURL:process.env.CONVEX_SITE_URL,trustedOrigins,
  database:authComponent.adapter(ctx),
  socialProviders:process.env.GITHUB_CLIENT_ID&&process.env.GITHUB_CLIENT_SECRET?{
    github:{clientId:process.env.GITHUB_CLIENT_ID,clientSecret:process.env.GITHUB_CLIENT_SECRET,disableDefaultScope:process.env.GITHUB_APP_MODE==='true'},
  }:{},
  account:{accountLinking:{enabled:true}},
  rateLimit:{enabled:true,storage:'database',window:60,max:30},
  plugins:[crossDomain({siteUrl}),convex({authConfig}),magicLink({
    expiresIn:600,storeToken:'hashed',rateLimit:{window:60,max:3},
    sendMagicLink:async({email,url})=>{
      if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)throw new Error('El correo de acceso aún no está configurado.');
      const response=await fetch('https://api.resend.com/emails',{
        method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
        body:JSON.stringify({from:process.env.EMAIL_FROM,to:[email],subject:'Tu enlace para entrar a Atlas de bolsillo',
          text:`Tu próximo viaje empieza aquí.\n\nEntra a Atlas de bolsillo y consulta tu progreso:\n${url}\n\nEste enlace caduca en 10 minutos y solo se puede usar una vez. Si no lo solicitaste, puedes ignorar este correo.`,}),
      });
      if(!response.ok)throw new Error('No se pudo enviar el enlace. Inténtalo de nuevo más tarde.');
    },
  })],
});
