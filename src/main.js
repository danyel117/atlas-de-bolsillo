import './style.css';
import { countries, continents, createRound, answerOptions, summarize } from './game.js';
import { loadMap, worldMap, continentMap } from './map.js';
import { account, initializeAccount, observeAccount } from './lib/account.js';
import { createAttempt, recordAttempt, flushHistory } from './history.js';
import { updateAccountButton, accountDialog } from './account-ui.js';
import { progressPage } from './progress-ui.js';
const app = document.querySelector('#app');
const authCallback=new URLSearchParams(location.search).has('ott')||new URLSearchParams(location.search).has('auth_error');
let selected = 'eu', length = 10, round = [], index = 0, answers = [], options = [], started = 0, resultDuration = 0;
let page = 'home', answered = false, roundKind = 'normal', attemptId, savedAttempt=null, stopProgress=null;
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const region = () => continents.find(c=>c.id===selected);
function readBest() { try { return JSON.parse(localStorage.getItem('atlas-best') || '{}'); } catch { return {}; } }
function home() {
  stopProgress?.();stopProgress=null;page = 'home';
  const count = countries.filter(c=>c.continent===selected).length;
  app.innerHTML = `<section class="hero"><div class="hero-copy"><span class="eyebrow"><i></i> TU PRÓXIMA PEQUEÑA AVENTURA</span><h1>¿Cuánto mundo<br><em>conoces?</em></h1><p>No hace falta una maleta. Solo un poco de curiosidad.<br class="desktop-break"> Encuentra tu continente y pon a prueba tu geografía.</p><div class="hero-facts"><span><b>195</b> países</span><span><b>6</b> regiones</span><span><b>∞</b> ganas de explorar</span></div></div><div class="hero-atlas">${worldMap()}<span class="atlas-label">EL MUNDO ES TU CAMPO DE JUEGO</span><span class="compass" aria-hidden="true">N<br>✧</span><span class="coordinate">41° 23′ N &nbsp; 2° 10′ E</span></div></section>
  <section class="explore" aria-labelledby="explore-title"><div class="section-heading"><div><span class="eyebrow">01 / ELIGE TU DESTINO</span><h2 id="explore-title">¿Por dónde empezamos?</h2></div><span class="quiet">Un continente, muchas sorpresas.</span></div><div class="continent-grid">${continents.map((c,i)=>{const n=countries.filter(x=>x.continent===c.id).length;return `<button class="continent-card ${selected===c.id?'selected':''}" data-continent="${c.id}" aria-pressed="${selected===c.id}" style="--card-color:${c.color}"><span class="card-top"><span>0${i+1}</span><span class="select-indicator" aria-hidden="true">${selected===c.id?'✓':'↗'}</span></span><div class="card-map">${continentMap(c,countries,null,true)}</div><span class="card-bottom"><span class="card-title">${c.name}</span><span class="country-count">${n} países</span></span><span class="card-subtitle">${c.subtitle}</span></button>`}).join('')}</div>
  <div class="departure"><div><span class="eyebrow">02 / A TU RITMO</span><div class="round-controls" role="group" aria-label="Duración de la partida"><button class="pill ${length===10?'active':''}" data-length="10" aria-pressed="${length===10}">Viaje rápido <span>10 países</span></button><button class="pill ${length==='all'?'active':''}" data-length="all" aria-pressed="${length==='all'}">Continente completo <span>${count} países</span></button></div></div><button class="primary start">Explorar ${region().name} <span aria-hidden="true">→</span></button></div></section>
  <section class="how"><span class="eyebrow">EL PLAN ES SENCILLO</span><div><span class="step">1</span><p><b>Mira el mapa</b><br>Un país estará resaltado.</p></div><div><span class="step">2</span><p><b>Elige su nombre</b><br>Cuatro opciones, una respuesta.</p></div><div><span class="step">3</span><p><b>Descubre tu resultado</b><br>Cada error es un nuevo destino.</p></div></section>
  <p class="map-note">193 miembros de la ONU + Palestina y Ciudad del Vaticano. Norteamérica incluye Centroamérica y el Caribe. La Antártida no tiene países soberanos. <button type="button" class="credits-link">Sobre los mapas y los datos ↗</button></p>`;
  app.querySelectorAll('[data-continent]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.continent;home();app.querySelector(`[data-continent="${selected}"]`).focus({preventScroll:true});}));
  app.querySelectorAll('[data-length]').forEach(b=>b.addEventListener('click',()=>{length=b.dataset.length==='all'?'all':10;home();app.querySelector(`[data-length="${length}"]`).focus({preventScroll:true});}));
  app.querySelector('.start').addEventListener('click',()=>start());
  app.querySelector('.credits-link').addEventListener('click',e=>{e.preventDefault();credits();});
}
function start(pool = countries) {
  roundKind = pool === countries ? 'normal' : 'retry';
  stopProgress?.();stopProgress=null;attemptId=crypto.randomUUID();savedAttempt=null;
  round = createRound(selected, length, pool); index = 0; answers = []; started = Date.now(); page = 'game';
  question(); window.scrollTo({top:0,behavior:'instant'});
}
function question() {
  answered = false;
  options = answerOptions(round[index]);
  const c = round[index], correct = summarize(answers).correct;
  app.innerHTML = `<section class="game"><div class="game-top"><button class="text-button exit">← Cambiar destino</button><span class="eyebrow">EXPEDICIÓN / ${region().name.toUpperCase()}</span><span class="score">${correct} aciertos</span></div><div class="progress-info"><span>PAÍS ${String(index+1).padStart(2,'0')} <span class="quiet">/ ${round.length}</span></span><span class="quiet">Paso a paso, el mundo se hace pequeño.</span></div><div class="progress-track" role="progressbar" aria-label="Progreso de la partida" aria-valuemin="0" aria-valuemax="${round.length}" aria-valuenow="${index}"><span style="width:${index/round.length*100}%"></span></div><div class="play-layout"><div class="question-map">${continentMap(region(),countries,c)}<div class="map-caption"><span><i></i> PAÍS POR DESCUBRIR</span><span class="quiet">El círculo indica su ubicación</span></div><span class="compass" aria-hidden="true">N<br>✧</span></div><div class="question-panel"><span class="eyebrow">UNA PISTA: ESTÁ EN EL MAPA</span><h1 tabindex="-1">¿Qué país <br>es <em>este?</em></h1><p>Elige el nombre del país resaltado.</p><div class="options" role="group" aria-label="Opciones de país">${options.map((o,i)=>`<button class="option" data-answer="${o.id}"><span class="option-letter">${'ABCD'[i]}</span><span>${esc(o.name)}</span><span class="option-check" aria-hidden="true">↗</span></button>`).join('')}</div><div class="feedback" role="status" aria-live="polite"></div><button class="text-button skip">No lo sé, aprenderlo →</button><button class="primary next" hidden>${index===round.length-1?'Ver mi resultado':'Siguiente país'} <span aria-hidden="true">→</span></button><span class="keyboard-note">También puedes usar las teclas 1, 2, 3 y 4.</span></div></div></section>`;
  app.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>answer(b.dataset.answer)));
  app.querySelector('.skip').addEventListener('click',()=>answer(null));
  app.querySelector('.exit').addEventListener('click',confirmExit);
  app.querySelector('.next').addEventListener('click',()=>{if(index+1===round.length){resultDuration=Math.round((Date.now()-started)/1000);results();}else{index++;question();}});
  app.querySelector('h1').focus({preventScroll:true});
}
function confirmExit(destination=home) {
  if(typeof destination!=='function')destination=home;
  const dialog = document.createElement('dialog');
  dialog.innerHTML = '<h2>¿Volvemos al atlas?</h2><p>Se perderá el progreso de esta partida.</p><div class="dialog-actions"><button class="pill stay">Seguir explorando</button><button class="primary leave">Volver al inicio</button></div>';
  document.body.append(dialog);dialog.showModal();
  dialog.querySelector('.stay').onclick=()=>dialog.close();
  dialog.querySelector('.leave').onclick=()=>{dialog.close();destination();};
  dialog.addEventListener('close',()=>dialog.remove());
}
function answer(id) {
  if(answered || page!=='game') return;
  answered = true; const country = round[index]; const correct = country.id===id;
  answers.push({country,selected:id});
  app.querySelectorAll('[data-answer]').forEach(b=>{b.disabled=true;if(b.dataset.answer===country.id){b.classList.add('correct');b.querySelector('.option-check').textContent='✓';}else if(b.dataset.answer===id){b.classList.add('incorrect');b.querySelector('.option-check').textContent='×';}});
  app.querySelector('.feedback').innerHTML=correct?`<b>¡Bien ubicado!</b> Es ${esc(country.name)}.`:`<b>${id===null?'Un nuevo país en tu atlas.':'Casi, sigamos explorando.'}</b> Es ${esc(country.name)}.`;
  app.querySelector('.feedback').classList.add(correct?'good':'learn');
  app.querySelector('.skip').hidden=true;
  app.querySelector('.next').hidden=false;
  app.querySelector('.score').textContent=`${summarize(answers).correct} aciertos`;
  app.querySelector('.next').focus({preventScroll:true});
}
function results() {
  page='results';const summary=summarize(answers);
  // Keep separate records for quick, full and retry rounds.
  const recordKey=`${roundKind}:${selected}:${round.length}`;const best=readBest();const previous=best[recordKey]??0;
  best[recordKey]=Math.max(previous,summary.percentage);try{localStorage.setItem('atlas-best',JSON.stringify(best));}catch{}
  app.innerHTML=`<section class="results"><span class="eyebrow">EXPEDICIÓN COMPLETADA / ${region().name.toUpperCase()}</span><h1>${summary.percentage>=80?'El mundo es<br><em>tu casa.</em>':summary.percentage>=50?'Vas por<br><em>buen camino.</em>':'Tu viaje<br><em>acaba de empezar.</em>'}</h1><p>${summary.percentage===100?'¡Una vuelta perfecta! No se te escapó ningún país.':'Cada país que aprendes hace tu mundo un poco más grande.'}</p><div class="result-stats"><div class="result-ring" style="--progress:${summary.percentage}%"><span>${summary.percentage}<small>% de aciertos</small></span></div><div><b>${summary.correct}<span> / ${summary.total}</span></b><span>países reconocidos</span></div><div><b>${Math.floor(resultDuration/60)}:${String(resultDuration%60).padStart(2,'0')}</b><span>minutos de exploración</span></div><div><b>${best[recordKey]}<span>%</span></b><span>tu mejor resultado en ${round.length} países</span></div></div><div class="result-actions">${summary.mistakes.length?'<button class="primary retry">Practicar mis fallos <span aria-hidden="true">↗</span></button>':''}<button class="${summary.mistakes.length?'pill':'primary'} again">Repetir continente ↻</button><button class="text-button home">Volver al atlas →</button></div><div class="result-saving"><p class="save-status" role="status">Guardando tu partida…</p><button class="text-button see-progress">Ver mi progreso →</button>${!account.user?'<button class="text-button save-account">Entrar para llevarme el historial ↗</button>':''}</div><div class="review"><div class="section-heading"><h2>Tu diario de viaje</h2><span class="quiet">${summary.correct} aciertos · ${summary.mistakes.length} por descubrir</span></div><div class="review-grid">${answers.map(a=>{const ok=a.selected===a.country.id;const guess=countries.find(c=>c.id===a.selected);return `<div class="review-item"><span class="review-status ${ok?'good':'learn'}" aria-hidden="true">${ok?'✓':'↗'}</span><div><b>${esc(a.country.name)}</b><span>${ok?'Lo ubicaste perfectamente':`Tu respuesta: ${guess?esc(guess.name):'No lo sé'}`}</span></div><span class="review-tag">${ok?'ACIERTO':'PARA REPASAR'}</span></div>`}).join('')}</div></div></section>`;
  app.querySelector('.retry')?.addEventListener('click',()=>start(summary.mistakes.map(a=>a.country)));
  app.querySelector('.again').addEventListener('click',()=>start());
  app.querySelector('.home').addEventListener('click',()=>{home();window.scrollTo({top:0,behavior:'instant'});});
  app.querySelector('.see-progress').onclick=()=>showProgress({continent:selected,mode:savedAttempt?.mode});
  app.querySelector('.save-account')?.addEventListener('click',openAccount);
  if(!savedAttempt){
    savedAttempt=createAttempt({attemptId,continent:selected,mode:roundKind==='retry'?'practice':length==='all'?'full':'quick',duration:resultDuration,answers});
    const thisAttempt=attemptId;
    recordAttempt(savedAttempt).then(result=>{
      if(page!=='results'||attemptId!==thisAttempt)return;
      const status=app.querySelector('.save-status');
      status.textContent=result.state==='saved'?'✓ Partida guardada en tu cuenta.':result.state==='local'?'✓ Partida guardada en este navegador.':result.state==='memory'?'No pudimos guardar en el navegador. Tu resultado estará disponible mientras esta página siga abierta.':result.error||'Partida pendiente de sincronizar. Reintentaremos cuando vuelva la conexión.';
    });
  }
  window.scrollTo({top:0,behavior:'instant'});
}
function openAccount(){accountDialog({inGame:page==='game',onLogout:()=>{if(page==='progress')showProgress();}});}
function showProgress(focus){
  if(page==='game'){confirmExit(()=>{page='progress';showProgress();});return;}
  stopProgress?.();page='progress';
  stopProgress=progressPage(app,{home:(continent,mode)=>{if(continent){selected=continent;length=mode==='full'?'all':10;}home();window.scrollTo({top:0,behavior:'instant'});},login:openAccount,initialRegion:focus?.continent,initialMode:focus?.mode});
  window.scrollTo({top:0,behavior:'instant'});
}
function credits() {
  const dialog=document.createElement('dialog');dialog.innerHTML='<button class="text-button close" aria-label="Cerrar información">Cerrar ×</button><span class="eyebrow">UN ATLAS ABIERTO</span><h2>Mapas para aprender.</h2><p>Cartografía de <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">Natural Earth</a> (dominio público), distribuida por world-atlas. Nombres y regiones de <a href="https://github.com/mledoze/countries" target="_blank" rel="noopener noreferrer">mledoze/countries</a> bajo ODbL 1.0. Código del juego bajo licencia MIT.</p><p>El mapa usa límites simplificados y puede reflejar zonas disputadas. Los países pequeños se señalan con un círculo. Rusia se juega en Europa; Turquía, Chipre y Kazajistán, en Asia. El criterio es educativo y cada país aparece una sola vez.</p><p>Sin cuenta, tus partidas se guardan en este navegador. Con una cuenta, Convex guarda tus respuestas y resultados para seguir tu progreso en otros dispositivos. Better Auth gestiona el acceso con GitHub o un enlace enviado por Resend. Usamos almacenamiento de sesión para mantener tu acceso. Sin publicidad ni cookies de seguimiento.</p>';document.body.append(dialog);dialog.showModal();dialog.querySelector('.close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());
}
document.addEventListener('keydown',e=>{if(page==='game'&&!answered&&!document.querySelector('dialog[open]')&&/^[1-4]$/.test(e.key))answer(options[Number(e.key)-1]?.id);});
document.querySelector('#account-button').onclick=openAccount;
document.querySelector('#progress-button').onclick=showProgress;
observeAccount(()=>{updateAccountButton();});
updateAccountButton();
window.addEventListener('online',()=>{flushHistory().catch(()=>{});});
const accountReady=initializeAccount();
try {await loadMap();home();await accountReady;if(new URLSearchParams(location.search).get('view')==='progress')showProgress();if(authCallback&&account.error)openAccount();} catch { app.innerHTML='<section class="error-state"><h1>El mapa se quedó por el camino.</h1><p>Comprueba tu conexión y vuelve a intentarlo.</p><button class="primary reload">Volver a cargar ↻</button></section>';app.querySelector('.reload').onclick=()=>location.reload(); }
