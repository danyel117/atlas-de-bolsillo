import { account, configured, githubLogin, emailLogin, logout } from './lib/account.js';
export const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function updateAccountButton(){
  const button=document.querySelector('#account-button');
  button.textContent=account.loading?'Conectando…':account.user?'Mi cuenta':'Entrar';
  button.disabled=account.loading;
}
export function accountDialog({inGame=false,onLogout=()=>{}}={}){
  const dialog=document.createElement('dialog');dialog.className='account-dialog';
  dialog.innerHTML=`<button class="text-button close" aria-label="Cerrar acceso">Cerrar ×</button><span class="eyebrow">TU MUNDO, PASO A PASO</span><h2>${account.user?'Tu cuenta de explorador':'Llévate tu progreso contigo.'}</h2>${account.user?`<p>Has entrado como <b>${esc(account.user.name||account.user.email)}</b>.</p><p>Tus partidas se guardan en tu cuenta para consultarlas desde otro dispositivo.</p><button class="pill signout">Cerrar sesión</button>`:`<p>Juega sin cuenta o entra para guardar tus partidas y ver cómo mejoras en cada continente.</p>${inGame?'<p class="form-warning">Entrar te llevará fuera de esta partida. Termínala primero si quieres conservar el resultado.</p>':''}<button class="primary github-login" ${!configured||!account.capabilities.github?'disabled':''}>Continuar con GitHub <span aria-hidden="true">↗</span></button><div class="login-divider">o con tu correo</div><form class="email-form"><label for="login-email">Correo electrónico</label><input id="login-email" type="email" name="email" autocomplete="email" placeholder="tu@correo.com" required maxlength="254" ${!account.capabilities.magicLink?'disabled':''}><button class="pill" type="submit" ${!account.capabilities.magicLink?'disabled':''}>Enviarme un enlace de acceso →</button></form><p class="login-note">Sin contraseña. Recibirás un enlace válido durante 10 minutos.</p>${!configured||(!account.capabilities.github&&!account.capabilities.magicLink)?'<p class="form-warning">El acceso aún no está disponible. Puedes jugar y consultar tu historial en este navegador.</p>':''}` }<p class="form-status" role="status" aria-live="polite">${esc(account.error||'')}</p>`;
  document.body.append(dialog);dialog.showModal();
  dialog.querySelector('.close').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>dialog.remove());
  const status=dialog.querySelector('.form-status');
  dialog.querySelector('.signout')?.addEventListener('click',async e=>{
    e.currentTarget.disabled=true;try{await logout();dialog.close();onLogout();}catch{status.textContent='No pudimos cerrar la sesión. Inténtalo de nuevo.';e.target.disabled=false;}
  });
  dialog.querySelector('.github-login')?.addEventListener('click',async e=>{
    const button=e.currentTarget;button.disabled=true;status.textContent='Abriendo GitHub…';
    try{const result=await githubLogin();if(result.error)throw new Error();}catch{status.textContent='No pudimos abrir GitHub. Inténtalo otra vez.';button.disabled=false;}
  });
  dialog.querySelector('form')?.addEventListener('submit',async e=>{
    e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;status.textContent='Preparando tu enlace…';
    try{const result=await emailLogin(e.target.elements.email.value.trim());if(result.error)throw new Error();status.textContent='Revisa tu correo, también la carpeta de spam. Si la dirección es válida, recibirás un enlace para entrar.';}
    catch{status.textContent='No pudimos enviar el enlace. Comprueba el correo o espera un minuto y reintenta.';}
    finally{button.disabled=false;}
  });
}
