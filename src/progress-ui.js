import { continents } from './game.js';
import { regionProgress } from './progress-data.js';
import { account } from './lib/account.js';
import { visibleHistory, refreshHistory, guestCount, importGuestHistory, historyError } from './history.js';
import { esc } from './account-ui.js';
const modeNames={quick:'Viaje rápido',full:'Continente completo',practice:'Practicar fallos'};
const date=value=>new Intl.DateTimeFormat('es',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(value);
let mode='quick',region='eu',revision=0;
function chart(records){
  const sample=records.slice(-20), width=650,height=170;
  if(!sample.length)return '<div class="empty-chart">Tu primera partida será el punto de salida.</div>';
  const point=(g,i)=>[35+(sample.length===1?.5:i/(sample.length-1))*580,20+(100-g.percentage)*1.25];
  const points=sample.map(point);
  return `<svg class="trend-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Aciertos de las últimas ${sample.length} partidas: ${sample.map(g=>g.percentage+'%').join(', ')}"><g class="chart-grid">${[0,50,100].map(n=>`<line x1="35" x2="625" y1="${20+(100-n)*1.25}" y2="${20+(100-n)*1.25}"/><text x="1" y="${24+(100-n)*1.25}">${n}%</text>`).join('')}</g>${points.length>1?`<polyline class="chart-line" points="${points.map(p=>p.join(',')).join(' ')}"/>`:''}${points.map((p,i)=>`<circle class="chart-point" cx="${p[0]}" cy="${p[1]}" r="4"><title>${date(sample[i].completedAt)}: ${sample[i].percentage}%</title></circle>`).join('')}</svg>`;
}
export function progressPage(app,{home,login,initialRegion,initialMode}){
  if(continents.some(c=>c.id===initialRegion))region=initialRegion;
  if(Object.hasOwn(modeNames,initialMode))mode=initialMode;
  const token=++revision;
  function render(message=''){
    if(token!==revision)return;
    const games=visibleHistory(),stats=regionProgress(games,region,mode),continent=continents.find(c=>c.id===region);
    const pending=games.filter(g=>g.pending).length;
    app.innerHTML=`<section class="progress-page"><button class="text-button back-atlas">← Volver al atlas</button><div class="progress-heading"><div><span class="eyebrow">TU DIARIO DE EXPLORACIÓN</span><h1>Un poco más lejos,<br><em>cada día.</em></h1><p>${account.user?'Cada partida cuenta. Sigue tu evolución por continente.':'Tu historial se guarda en este navegador. Entra para llevarlo contigo a otros dispositivos.'}</p></div><div class="progress-account">${account.user?`<span class="account-badge">✓ ${esc(account.user.name||account.user.email)}</span>`:'<button class="primary login-progress">Guardar en mi cuenta ↗</button>'}<button class="text-button export-history" ${!games.length?'disabled':''}>Descargar mi historial ↓</button></div></div><div class="sync-message" role="status">${esc(message|| (pending?`${pending} partida${pending===1?'':'s'} pendiente${pending===1?'':'s'} de sincronizar.`:''))}</div>${pending?'<button class="pill retry-sync">Reintentar sincronización ↻</button>':''}${account.user&&guestCount()?`<div class="import-banner"><p>Hay <b>${guestCount()} partidas</b> jugadas sin cuenta en este navegador. Puedes añadirlas a tu historial. Se guardarán con la fecha de importación.</p><button class="pill import-history">Añadir a mi cuenta →</button></div>`:''}<div class="progress-filters" role="group" aria-label="Tipo de partida">${Object.entries(modeNames).map(([id,name])=>`<button class="pill ${id===mode?'active':''}" data-mode="${id}" aria-pressed="${id===mode}">${name}</button>`).join('')}</div><p class="progress-explanation">Compara partidas del mismo tipo. La práctica de fallos tiene su propio historial.</p><div class="region-progress-grid">${continents.map(c=>{const s=regionProgress(games,c.id,mode);return `<button class="region-progress ${region===c.id?'selected':''}" data-region="${c.id}" aria-pressed="${region===c.id}"><span>${c.name}</span><b>${s.recentAverage===null?'—':s.recentAverage+'%'}</b><small>${s.count?s.count+(s.count===1?' partida':' partidas')+' · últimas 5':'Tu próximo destino'}</small><span class="mini-progress" aria-hidden="true"><i style="width:${s.recentAverage??0}%"></i></span></button>`;}).join('')}</div><section class="continent-history" aria-labelledby="history-title"><div class="section-heading"><div><span class="eyebrow">${modeNames[mode].toUpperCase()}</span><h2 id="history-title">Tu viaje por ${continent.name}</h2></div><button class="text-button play-continent">Explorar ${continent.name} ↗</button></div><div class="history-metrics"><div><b>${stats.best===null?'—':stats.best+'%'}</b><span>Tu mejor resultado</span></div><div><b>${stats.recentAverage===null?'—':stats.recentAverage+'%'}</b><span>Media de las últimas 5</span></div><div><b>${stats.improvement===null?'—':(stats.improvement>0?'+':'')+stats.improvement+' pp'}</b><span>Evolución desde el inicio</span></div></div>${chart(stats.records)}<p class="progress-explanation">${stats.count<2?'Juega al menos dos partidas para ver tu evolución.':stats.count<10?'La evolución compara tu última partida con la primera.':'La evolución compara la media de las últimas cinco partidas con las primeras cinco.'} El gráfico muestra las últimas 20. pp = puntos porcentuales.</p>${stats.records.length?`<ol class="history-list" reversed>${stats.records.slice().reverse().slice(0,50).map(g=>`<li><span><time datetime="${new Date(g.completedAt).toISOString()}">${date(g.completedAt)}</time><small>${g.correct}/${g.total} países · ${Math.floor(g.duration/60)}:${String(g.duration%60).padStart(2,'0')} min${g.pending?' · pendiente':''}</small></span><b>${g.percentage}%</b></li>`).join('')}</ol>${stats.count>50?'<p class="progress-explanation">Aquí aparecen las últimas 50 partidas. La descarga incluye todo tu historial.</p>':''}`:'<p class="empty-history">Este continente todavía tiene mucho que contarte. Juega tu primera partida y vuelve aquí.</p>'}</section></section>`;
    app.querySelector('.back-atlas').onclick=()=>{revision++;home();};
    app.querySelector('.play-continent').onclick=()=>{revision++;home(region,mode);};
    app.querySelector('.login-progress')?.addEventListener('click',login);
    app.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;render();app.querySelector(`[data-mode="${mode}"]`).focus({preventScroll:true});});
    app.querySelectorAll('[data-region]').forEach(b=>b.onclick=()=>{region=b.dataset.region;render();app.querySelector(`[data-region="${region}"]`).focus({preventScroll:true});});
    app.querySelector('.export-history').onclick=()=>exportHistory(games);
    app.querySelector('.retry-sync')?.addEventListener('click',()=>sync());
    app.querySelector('.import-history')?.addEventListener('click',async e=>{
      e.currentTarget.disabled=true;
      try{await importGuestHistory();render('Partidas añadidas a tu cuenta.');}catch(error){render(historyError(error));}
    });
  }
  async function sync(){render('Actualizando tu historial…');try{await refreshHistory();render();}catch(error){render(historyError(error));}}
  render();sync();
  return ()=>{revision++;};
}
function exportHistory(games){
  const cell=value=>'"'+String(value).replace(/"/g,'""')+'"';
  const lines=[['Fecha','Continente','Modalidad','Aciertos','Países','Porcentaje','Segundos','Estado'],...games.map(g=>[new Date(g.completedAt).toISOString(),continents.find(c=>c.id===g.continent)?.name||g.continent,modeNames[g.mode],g.correct,g.total,g.percentage,g.duration,g.pending?'Pendiente':'Guardada'])];
  const url=URL.createObjectURL(new Blob(['\ufeff'+lines.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='atlas-mi-progreso.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
