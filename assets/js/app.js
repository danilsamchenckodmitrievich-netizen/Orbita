/* Орбита — приложение. Контент лежит в assets/js/data/grade*.js */
(function(){
'use strict';

const O = window.ORBITA || {};
const C = O.content || {};
const GRADES = [2,3,4];

/* ---------- Справочники ---------- */
const SUBJ = {
  rus:{name:'Русский язык',short:'Русский',color:'#7E2557',deco:'<path d="M18 84 44 16l26 68"/><path d="M28 60h32"/><path d="M76 48c8 0 12 4 12 10v26M88 70c-4-4-20-4-20 6 0 10 16 10 20 2"/>',w:7},
  math:{name:'Математика',short:'Математика',color:'#3946A6',deco:'<path d="M14 30h32M30 14v32"/><path d="M60 16l24 24M84 16 60 40"/><path d="M14 72h32"/><path d="M60 66h24M60 80h24"/>',w:7},
  eng:{name:'Английский язык',short:'Английский',color:'#1E6F6B',deco:'<path d="M14 22h58a10 10 0 0 1 10 10v28a10 10 0 0 1-10 10H42L26 84V70H14z"/><path d="M30 56l10-24 10 24M34 48h12"/>',w:6},
  world:{name:'Окружающий мир',short:'Окружающий мир',color:'#2D6A4A',deco:'<path d="M20 80C20 40 46 16 84 16c0 38-24 64-64 64Z"/><path d="M20 80 62 38"/>',w:6},
  read:{name:'Литературное чтение',short:'Чтение',color:'#94450F',deco:'<path d="M50 28C40 20 26 18 12 20v58c14-2 28 0 38 8 10-8 24-10 38-8V20c-14-2-28 0-38 8Z"/><path d="M50 28v58"/>',w:6}
};
const ORDER = ['rus','math','eng','world','read'];
GRADES.forEach(g=>{C[g]=C[g]||{};ORDER.forEach(s=>{C[g][s]=C[g][s]||[];});});

const LEVELS = {
  easy:  {name:'Лёгкий', gen:'лёгкий', pts:10,bonus:10,desc:'Главное в теме'},
  medium:{name:'Средний',gen:'средний',pts:20,bonus:20,desc:'Применяем правило'},
  hard:  {name:'Сложный',gen:'сложный',pts:30,bonus:30,desc:'С подвохом и вводом ответа'}
};
const LV = ['easy','medium','hard'];

const RANKS = [
  [0,'Новичок'],[100,'Стажёр'],[250,'Звездочёт'],[500,'Наблюдатель'],[800,'Пилот'],[1200,'Штурман'],
  [1700,'Космонавт'],[2300,'Бортинженер'],[3000,'Командир'],[4000,'Капитан станции'],[5500,'Покоритель галактик'],[7500,'Легенда Орбиты']
];
/* Аватар 0 — первая буква имени. Остальные открываются с рангом. */
const AVATARS = [['',1],['🐱',1],['🦊',1],['🐻',1],['🐼',2],['🦉',3],['🐸',4],['🐙',5],['🦄',6],['🚀',7],['👽',8],['🐲',9],['🛸',10],['🌟',11],['👑',12]];

const TOPIC = {};
GRADES.forEach(g=>ORDER.forEach(s=>C[g][s].forEach((t,i)=>{TOPIC[t.id]={t,g,s,i};})));

/* ---------- Хранилище ---------- */
const KEY = 'orbita-v2', OLD = 'orbita-v1';
const DEF = () => ({v:2,name:'',grade:2,avatar:0,theme:'auto',sound:true,goal:60,xp:0,prog:{},days:[],daily:{d:'',xp:0},
  stats:{lessons:0,answers:0,correct:0,perfect:0,hard:0,hardPerfect:0,comeback:0,goals:0,bestStreak:0,run:0,bestCombo:0,secs:0},
  badges:{},tried:{},last:null});
let S = DEF();
const ymd = d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today = ()=>ymd(new Date());

function load(){
  let raw=null;
  try{raw=localStorage.getItem(KEY);}catch(e){}
  if(raw){
    try{
      const p=JSON.parse(raw), d=DEF();
      S=Object.assign(d,p);
      S.stats=Object.assign(d.stats,p.stats||{});
      S.daily=Object.assign({d:'',xp:0},p.daily||{});
      ['prog','badges','tried'].forEach(k=>{if(!S[k]||typeof S[k]!=='object')S[k]={};});
      if(!Array.isArray(S.days))S.days=[];
    }catch(e){S=DEF();}
  } else {
    migrate();
  }
  if(!GRADES.includes(+S.grade))S.grade=2;
  S.grade=+S.grade;
}
/* Переносим прогресс первой версии: старые три вопроса ≈ лёгкий уровень. */
function migrate(){
  let old=null;
  try{old=JSON.parse(localStorage.getItem(OLD)||'null');}catch(e){}
  if(!old)return;
  S.name=typeof old.name==='string'?old.name:'';
  S.grade=GRADES.includes(+old.grade)?+old.grade:2;
  S.days=Array.isArray(old.days)?old.days.slice(-60):[];
  Object.entries(old.done||{}).forEach(([k,sc])=>{
    const [g,s,i]=k.split('-'), t=C[g]&&C[g][s]&&C[g][s][+i];
    if(!t||typeof sc!=='number')return;
    S.prog[t.id]={easy:{b:Math.round(sc/3*100),n:1}};
    S.xp+=sc*10; S.stats.lessons++; S.stats.answers+=3; S.stats.correct+=sc; S.tried[s]=1;
  });
  S.stats.bestStreak=streak();
  save();
}
const save = ()=>{try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}};

/* ---------- Вычисления ---------- */
function streak(){
  const d=new Date();
  if(!S.days.includes(ymd(d)))d.setDate(d.getDate()-1);
  let n=0; while(S.days.includes(ymd(d))){n++;d.setDate(d.getDate()-1);}
  return n;
}
const gradeOf = pct=>pct>=90?5:pct>=70?4:pct>=50?3:2;
const starsOf = pct=>Math.max(0,gradeOf(pct)-2);
const lvRec = (id,lv)=>(S.prog[id]||{})[lv]||null;
const lvPassed = (id,lv)=>{const r=lvRec(id,lv);return !!r&&r.b>=50;};
const passedCount = id=>LV.filter(lv=>lvPassed(id,lv)).length;
const topicDone = id=>passedCount(id)>0;
const topicFull = id=>LV.every(lv=>{const r=lvRec(id,lv);return r&&r.b>=90;});
function subjPct(g,s){const l=C[g][s];if(!l.length)return 0;return Math.round(l.reduce((a,t)=>a+passedCount(t.id),0)/(l.length*3)*100);}
function nextTopic(g,s){
  const l=C[g][s];
  let i=l.findIndex(t=>!topicDone(t.id)); if(i>=0)return i;
  i=l.findIndex(t=>passedCount(t.id)<3); return i<0?0:i;
}
function recLevel(id){const i=LV.findIndex(lv=>!lvPassed(id,lv));return i<0?null:LV[i];}
function rankOf(xp){
  let i=0; while(i+1<RANKS.length&&xp>=RANKS[i+1][0])i++;
  const min=RANKS[i][0], nx=RANKS[i+1];
  return {n:i+1,name:RANKS[i][1],min,next:nx?nx[0]:null,nextName:nx?nx[1]:null,pct:nx?Math.round((xp-min)/(nx[0]-min)*100):100};
}
function dailyXp(){return S.daily.d===today()?S.daily.xp:0;}
function totalStars(){let n=0;Object.values(S.prog).forEach(p=>LV.forEach(lv=>{if(p[lv])n+=starsOf(p[lv].b);}));return n;}
function countTopics(){let n=0,t=0;GRADES.forEach(g=>ORDER.forEach(s=>C[g][s].forEach(x=>{t++;if(topicDone(x.id))n++;})));return [n,t];}
function countQuestions(){let n=0;Object.values(TOPIC).forEach(({t})=>LV.forEach(lv=>{n+=(t[lv]||[]).length;}));return n;}

/* ---------- Достижения ---------- */
const BADGES = [
  {id:'first',i:'🚀',n:'Первый старт',d:'Пройди первый урок',ok:()=>S.stats.lessons>=1},
  {id:'perfect',i:'🎯',n:'В яблочко',d:'Получи «5» без единой ошибки',ok:()=>S.stats.perfect>=1},
  {id:'brave',i:'🧗',n:'Смельчак',d:'Сдай сложный уровень хотя бы на «3»',ok:()=>S.stats.hard>=1},
  {id:'genius',i:'🧠',n:'Гений',d:'Пройди сложный уровень без ошибок',ok:()=>S.stats.hardPerfect>=1},
  {id:'triple',i:'🏔️',n:'Три вершины',d:'Пройди все три уровня одной темы на «5»',ok:()=>Object.keys(S.prog).some(id=>TOPIC[id]&&topicFull(id))},
  {id:'comeback',i:'💪',n:'Работа над ошибками',d:'Пересдай уровень с «2» или «3» на «5»',ok:()=>S.stats.comeback>=1},
  {id:'combo',i:'⚡',n:'Молния',d:'Ответь верно 10 раз подряд',ok:()=>S.stats.bestCombo>=10},
  {id:'goal',i:'🎁',n:'Цель дня',d:'Выполни дневную цель по очкам',ok:()=>S.stats.goals>=1},
  {id:'streak3',i:'🔥',n:'Огонёк',d:'Занимайся 3 дня подряд',ok:()=>S.stats.bestStreak>=3},
  {id:'streak7',i:'☄️',n:'Неделя знаний',d:'Занимайся 7 дней подряд',ok:()=>S.stats.bestStreak>=7},
  {id:'streak14',i:'🌋',n:'Несгибаемый',d:'Занимайся 14 дней подряд',ok:()=>S.stats.bestStreak>=14},
  {id:'lessons10',i:'📚',n:'Усердный ученик',d:'Пройди 10 уроков',ok:()=>S.stats.lessons>=10},
  {id:'lessons50',i:'🏃',n:'Марафонец',d:'Пройди 50 уроков',ok:()=>S.stats.lessons>=50},
  {id:'perfect10',i:'💎',n:'Снайпер',d:'Получи 10 пятёрок без ошибок',ok:()=>S.stats.perfect>=10},
  {id:'correct100',i:'✅',n:'Сто верных ответов',d:'Дай 100 правильных ответов',ok:()=>S.stats.correct>=100},
  {id:'correct500',i:'🏅',n:'Знаток',d:'Дай 500 правильных ответов',ok:()=>S.stats.correct>=500},
  {id:'xp1000',i:'💫',n:'Тысяча очков',d:'Набери 1000 очков',ok:()=>S.xp>=1000},
  {id:'xp5000',i:'🌌',n:'Звёздный запас',d:'Набери 5000 очков',ok:()=>S.xp>=5000},
  {id:'explorer',i:'🧭',n:'Путешественник',d:'Пройди уроки по всем пяти предметам',ok:()=>ORDER.every(s=>S.tried[s])},
  {id:'m-rus',i:'✍️',n:'Грамотей',d:'Пройди все темы по русскому языку в одном классе',ok:()=>subjDone('rus')},
  {id:'m-math',i:'🔢',n:'Математик',d:'Пройди все темы по математике в одном классе',ok:()=>subjDone('math')},
  {id:'m-eng',i:'🗣️',n:'Полиглот',d:'Пройди все темы по английскому в одном классе',ok:()=>subjDone('eng')},
  {id:'m-world',i:'🌿',n:'Натуралист',d:'Пройди все темы окружающего мира в одном классе',ok:()=>subjDone('world')},
  {id:'m-read',i:'📖',n:'Книголюб',d:'Пройди все темы по чтению в одном классе',ok:()=>subjDone('read')}
];
function subjDone(s){return GRADES.some(g=>C[g][s].length&&C[g][s].every(t=>topicDone(t.id)));}
function checkBadges(){
  const fresh=[];
  BADGES.forEach(b=>{if(!S.badges[b.id]&&b.ok()){S.badges[b.id]=Date.now();fresh.push(b);}});
  return fresh;
}

/* ---------- Утилиты интерфейса ---------- */
const app = document.getElementById('app');
const escH = s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plural = (n,a,b,c)=>{const m=Math.abs(n)%10,h=Math.abs(n)%100;return m===1&&h!==11?a:m>=2&&m<=4&&(h<12||h>14)?b:c;};
const pl = (n,a,b,c)=>fmt(n)+' '+plural(n,a,b,c);
const fmt = n=>Number(n).toLocaleString('ru-RU');
const reduced = ()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const deco = (s,cls)=>`<svg class="${cls}" viewBox="0 0 100 100" fill="none" stroke="#fff" stroke-width="${SUBJ[s].w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SUBJ[s].deco}</svg>`;
const ICON = {
  back:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  close:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  tick:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17l9-10"/></svg>',
  cross:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>',
  chev:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--quiet)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  down:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  play:'<svg width="20" height="20" viewBox="0 0 24 24" fill="#14161C" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
  bolt:(sz=18)=>`<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 2 4.8 13.4h6.1L9.9 22l9.3-12.1h-6.3z" fill="#F2B705" stroke="#C99700" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
  lv:{
    easy:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 18h16"/><path d="M7 18v-4"/></svg>',
    medium:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 18h16"/><path d="M7 18v-4M12 18V9"/></svg>',
    hard:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 18h16"/><path d="M7 18v-4M12 18V9M17 18V4"/></svg>'
  }
};
const star = (on,sz)=>`<svg viewBox="0 0 24 24" ${sz?`width="${sz}" height="${sz}"`:''} aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="${on?'#F2B705':'none'}" stroke="${on?'#C99700':'var(--track)'}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
const miniStars = n=>`<span class="mini-stars" aria-label="${n} из 3 звёзд">${[0,1,2].map(k=>star(k<n)).join('')}</span>`;
function avatarHTML(cls){
  const a=AVATARS[S.avatar]&&AVATARS[S.avatar][0];
  if(a)return `<span class="avatar emoji ${cls||''}" aria-hidden="true">${a}</span>`;
  return `<span class="avatar ${cls||''}" aria-hidden="true">${S.name?escH(S.name.trim()[0].toUpperCase()):'?'}</span>`;
}
function ringSVG(size,stroke,pct,col,bg){
  const r=(size-stroke)/2, c=2*Math.PI*r, d=c*Math.min(100,Math.max(0,pct))/100;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${bg}" stroke-width="${stroke}"/>${pct>0?`<circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${col}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${d} ${c}" transform="rotate(-90 ${size/2} ${size/2})"/>`:''}</svg>`;
}
function setNav(r){
  document.querySelectorAll('.nav [data-nav]').forEach(a=>{
    if(a.dataset.nav===r)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
}
function setTitle(t){document.title=t?t+' — Орбита':'Орбита — уроки для 2–4 класса';}
function applyTheme(){
  const r=document.documentElement;
  if(S.theme==='light'||S.theme==='dark')r.setAttribute('data-theme',S.theme);else r.removeAttribute('data-theme');
}
function toast(icon,title,text){
  const box=document.getElementById('toasts'); if(!box)return;
  const el=document.createElement('div');
  el.className='toast'; el.setAttribute('role','status');
  el.innerHTML=`<span class="bi" aria-hidden="true">${icon}</span><span><b>${escH(title)}</b>${text?`<small>${escH(text)}</small>`:''}</span>`;
  box.appendChild(el);
  setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),320);},3600);
}

/* Звуки: короткие тоны через Web Audio, без файлов. */
let actx=null;
function tone(seq){
  if(!S.sound)return;
  try{
    actx=actx||new (window.AudioContext||window.webkitAudioContext)();
    const t0=actx.currentTime+.01;
    seq.forEach(([f,st,du,type])=>{
      const o=actx.createOscillator(),g=actx.createGain();
      o.type=type||'sine'; o.frequency.value=f;
      g.gain.setValueAtTime(.0001,t0+st); g.gain.exponentialRampToValueAtTime(.12,t0+st+.02); g.gain.exponentialRampToValueAtTime(.0001,t0+st+du);
      o.connect(g); g.connect(actx.destination); o.start(t0+st); o.stop(t0+st+du+.05);
    });
  }catch(e){}
}
const SND = {
  ok:()=>tone([[660,0,.12],[990,.09,.2]]),
  no:()=>tone([[196,0,.28,'triangle']]),
  win:()=>tone([[523,0,.16],[659,.12,.16],[784,.24,.16],[1047,.36,.34]]),
  meh:()=>tone([[440,0,.18],[392,.15,.28]])
};
function confetti(){
  if(reduced())return;
  const cv=document.createElement('canvas'); cv.className='confetti'; cv.setAttribute('aria-hidden','true');
  document.body.appendChild(cv);
  const ctx=cv.getContext('2d'), dpr=window.devicePixelRatio||1, W=innerWidth, H=innerHeight;
  cv.width=W*dpr; cv.height=H*dpr; ctx.scale(dpr,dpr);
  const cols=['#C2EA4E','#3946A6','#F2B705','#7E2557','#1E6F6B','#E8613C','#8F9BF0'];
  const P=Array.from({length:140},()=>({x:W/2+(Math.random()-.5)*W*.4,y:H*.3,vx:(Math.random()-.5)*14,vy:-Math.random()*13-5,r:Math.random()*7+5,c:cols[Math.random()*cols.length|0],a:Math.random()*6.3,va:(Math.random()-.5)*.35}));
  let f=0;
  (function step(){
    f++; ctx.clearRect(0,0,W,H);
    P.forEach(p=>{p.vy+=.32;p.vx*=.985;p.x+=p.vx;p.y+=p.vy;p.a+=p.va;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.fillStyle=p.c;ctx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);ctx.restore();});
    if(f<170)requestAnimationFrame(step);else cv.remove();
  })();
}
function countUp(el,to,ms){
  if(!el)return;
  if(reduced()||to<=0){el.textContent=(to>0?'+':'')+fmt(to);return;}
  const t0=performance.now();
  (function f(t){const k=Math.min(1,(t-t0)/ms),v=Math.round(to*(1-Math.pow(1-k,3)));el.textContent='+'+fmt(v);if(k<1)requestAnimationFrame(f);})(t0);
}

/* Клавиатура: один обработчик на экран */
let keyHandler=null;
document.addEventListener('keydown',e=>{if(keyHandler)keyHandler(e);});

/* ---------- Главная ---------- */
function topbar(){
  return `<header class="topbar">
    <a class="logo" href="#/" aria-label="Орбита — на главную"><svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><ellipse cx="16" cy="16" rx="14" ry="7" stroke="var(--indigo)" stroke-width="2.5" transform="rotate(-25 16 16)"/><circle cx="16" cy="16" r="5.5" fill="var(--ink)"/><circle cx="28" cy="10" r="2.5" fill="#9BC72E"/></svg>Орбита</a>
    <div class="chips">
      <a class="xpchip" href="#/rewards" aria-label="Очки: ${fmt(S.xp)}. Открыть награды">${ICON.bolt()}${fmt(S.xp)}</a>
      <a href="#/profile" aria-label="Профиль" style="text-decoration:none">${avatarHTML()}</a>
    </div>
  </header>`;
}
function home(){
  setTitle('');
  const g=S.grade, st=streak(), rk=rankOf(S.xp), dx=dailyXp(), goalPct=Math.min(100,Math.round(dx/S.goal*100));
  const names=['вс','пн','вт','ср','чт','пт','сб'];
  let days='';
  for(let k=6;k>=0;k--){const d=new Date();d.setDate(d.getDate()-k);const on=S.days.includes(ymd(d));days+=`<div class="day${on?' on':''}${k===0?' today':''}"><i>${on?'✓':''}</i>${names[d.getDay()]}</div>`;}
  const activeToday=S.days.includes(today());
  const streakTxt=st?(activeToday?`${pl(st,'день','дня','дней')} подряд!`:`${pl(st,'день','дня','дней')} подряд — пройди урок, чтобы не прервать серию`):'Пройди урок, чтобы начать серию';
  const last=S.last&&TOPIC[S.last.id];
  const resume=last?(()=>{const {t,g:lg,s:ls}=last;return `<a class="resumecard" href="#/lesson/${lg}/${ls}/${t.id}">
      <span class="ico" style="background:${SUBJ[ls].color}">${deco(ls,'').replace('<svg ','<svg width="30" height="30" style="opacity:.95" ')}</span>
      <span class="grow"><small>Продолжить · ${SUBJ[ls].short}, ${lg} класс</small><strong>${escH(t.title)}</strong></span>
      <span class="play">${ICON.play}</span></a>`;})():'';
  const cards=ORDER.map(s=>{
    const list=C[g][s]; if(!list.length)return '';
    const p=subjPct(g,s), i=nextTopic(g,s), done=list.every(t=>topicDone(t.id)), started=list.some(t=>lvRec(t.id,'easy')||lvRec(t.id,'medium')||lvRec(t.id,'hard'));
    return `<a class="subj" href="#/course/${g}/${s}" style="background:${SUBJ[s].color}">
      ${deco(s,'deco')}
      <div class="row"><div class="bar"><b style="width:${p}%"></b></div><span style="font-size:13px;position:relative">${started?p+'%':'Не начат'}</span></div>
      <h3>${SUBJ[s].name}, ${g} класс</h3>
      <p>${done?'Все темы открыты — добивай сложные уровни':(started?'Сейчас: ':'Первая тема: ')+escH(list[i].title)}</p>
      <div class="foot"><span>${pl(list.length,'тема','темы','тем')} · ${pl(list.length*3,'уровень','уровня','уровней')}</span><span class="pill">${p===100?'Повторить':started?'Продолжить':'Начать'}</span></div>
    </a>`;}).join('');
  app.innerHTML=`<div class="wrap view">
    ${topbar()}
    <section><h1 class="h-display" style="font-size:28px;line-height:1.15" tabindex="-1">Привет${S.name?', '+escH(S.name):''}!</h1><p class="lead">Выбери предмет и уровень сложности. За каждый верный ответ — очки, за уроки без ошибок — бонусы и награды.</p></section>
    <section class="dash" aria-label="Мои успехи">
      <a class="rankcard" href="#/rewards">
        <span class="rk-badge"><i>ранг</i>${rk.n}</span>
        <span class="grow"><small>${fmt(S.xp)} ${plural(S.xp,'очко','очка','очков')}</small><b>${rk.name}</b>
          <span class="xpbar" style="display:block"><b style="width:${rk.pct}%"></b></span>
          <small style="display:block;margin-top:6px">${rk.next!==null?`Ещё ${pl(rk.next-S.xp,'очко','очка','очков')} до ранга «${rk.nextName}»`:'Высший ранг достигнут!'}</small></span>
      </a>
      <div class="panel">
        <div class="goalcard">
          <div class="goalring">${ringSVG(64,8,goalPct,'var(--good)','var(--track)')}<span aria-hidden="true">${goalPct>=100?'🎁':'🎯'}</span></div>
          <div class="grow"><b>${goalPct>=100?'Цель дня выполнена!':'Цель дня'}</b><p>${fmt(dx)} из ${fmt(S.goal)} очков сегодня</p><p>🔥 ${streakTxt}</p></div>
        </div>
        <div class="week" aria-label="Активность за неделю">${days}</div>
      </div>
    </section>
    ${resume}
    <section style="display:flex;flex-direction:column;gap:14px">
      <div class="sec-title"><h2 class="h-display">Мои предметы</h2><span>${pl(C[g].rus.length+C[g].math.length+C[g].eng.length+C[g].world.length+C[g].read.length,'тема','темы','тем')}</span></div>
      <div class="seg" role="tablist" aria-label="Класс">${GRADES.map(n=>`<button type="button" role="tab" data-grade="${n}" aria-selected="${n===g}">${n} класс</button>`).join('')}</div>
      <div class="cards">${cards}</div>
    </section>
    <p class="footer">Орбита · ${fmt(countQuestions())} заданий для 2–4 класса · прогресс хранится на этом устройстве</p>
  </div>`;
  app.querySelectorAll('[data-grade]').forEach(b=>b.onclick=()=>{S.grade=+b.dataset.grade;save();home();});
}

/* ---------- Предмет ---------- */
function course(g,s){
  const list=C[g][s], p=subjPct(g,s), i=nextTopic(g,s), col=SUBJ[s].color, doneN=list.filter(t=>topicDone(t.id)).length;
  setTitle(`${SUBJ[s].name}, ${g} класс`);
  const cur=list[i], allFull=list.every(t=>passedCount(t.id)===3);
  app.innerHTML=`<div class="view"><header class="chead" style="background:${col}">
    ${deco(s,'deco')}
    <div class="chead-in">
      <div class="row between"><a class="iconbtn glass" href="#/" aria-label="Назад к предметам">${ICON.back}</a><a class="xpchip" href="#/rewards" style="background:rgba(255,255,255,.18);box-shadow:none;color:#fff">${ICON.bolt()}${fmt(S.xp)}</a></div>
      <div class="row" style="gap:18px">
        <div class="ring">${ringSVG(84,8,p,'#C2EA4E','rgba(255,255,255,.22)')}<span>${p}%</span></div>
        <div><h1 class="h-display" style="font-size:24px;line-height:1.15" tabindex="-1">${SUBJ[s].name}, ${g} класс</h1><div style="font-size:14px;margin-top:6px;opacity:.92">${pl(list.length,'тема','темы','тем')} · пройдено уровней: ${list.reduce((a,t)=>a+passedCount(t.id),0)} из ${list.length*3}</div></div>
      </div>
      <a class="resume" href="#/lesson/${g}/${s}/${cur.id}"><span><small>${allFull?'Все уровни пройдены — повтори любимую тему':doneN?'Продолжить с места остановки':'Начать с первой темы'}</small><strong>${escH(cur.title)}</strong></span><span class="play">${ICON.play}</span></a>
    </div>
  </header>
  <main class="topics" style="--accent:${col}">
    <h2 class="h-display" style="font-size:20px;margin-bottom:4px">Темы</h2>
    ${list.map((t,k)=>{
      const n=passedCount(t.id), d=n>0, full=topicFull(t.id), isCur=k===i&&!allFull;
      const dots=LV.map(lv=>{const r=lvRec(t.id,lv);return `<i class="${r&&r.b>=50?'g'+gradeOf(r.b):''}" title="${LEVELS[lv].name}${r?': лучший результат '+r.b+'%':''}"></i>`;}).join('');
      return `<a class="topic${d?' done':''}${full?' full':''}${isCur?' current':''}" href="#/lesson/${g}/${s}/${t.id}">
        <span class="num">${d?ICON.tick:k+1}</span>
        <span class="t"><b>${escH(t.title)}</b>
          <span class="lvdots" aria-label="Пройдено уровней: ${n} из 3">${dots}<small>${full?'Все уровни на «5»':n?`${n} из 3 уровней`:isCur?'Следующая тема':'3 уровня сложности'}</small></span></span>
        ${ICON.chev}</a>`;}).join('')}
  </main></div>`;
}

/* ---------- Урок ---------- */
const NUM_RE=/^-?\d+([.,]\d+)?$/;
const FIXED_RE=/^(I{1,3}|IV|[1-4]-е|верно|неверно|да|нет)$/i;
const clean = s=>String(s).replace(/[\s  ]/g,'');
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;}
// Кириллические Х, С, М похожи на латинские X, C, M (римские цифры): приводим обе стороны к одному виду
const LOOKALIKE={'х':'x','с':'c','м':'m'};
function norm(s){
  return String(s).toLowerCase().replace(/ё/g,'е').replace(/[хсм]/g,c=>LOOKALIKE[c]).replace(/[’‘`´ʼ]/g,"'").replace(/[−–—]/g,'-')
    .replace(/[  ]/g,' ').replace(/(\d)\s+(?=\d)/g,'$1').replace(/\s+/g,' ').replace(/^[«"']+|[»"'.!?,;:]+$/g,'').trim();
}
function prep(q){
  if(typeof q[1]==='string'){
    const answers=q[1].split('|').map(a=>a.trim()).filter(Boolean);
    return {type:'input',text:q[0],answers,expl:q[2],numeric:answers.every(a=>NUM_RE.test(clean(a)))};
  }
  const opts=q[1].map((t,k)=>({t:String(t),ok:k===q[2]}));
  if(opts.every(o=>NUM_RE.test(clean(o.t))))opts.sort((a,b)=>parseFloat(clean(a.t).replace(',','.'))-parseFloat(clean(b.t).replace(',','.')));
  else if(!opts.every(o=>FIXED_RE.test(o.t.trim())))shuffle(opts);
  return {type:'choice',text:q[0],opts,expl:q[3]};
}
function fmtTime(sec){const m=Math.floor(sec/60),s=sec%60;return m?`${m} мин ${s} с`:`${s} с`;}

function lesson(g,s,id){
  const T=TOPIC[id].t, col=SUBJ[s].color, list=C[g][s], idx=TOPIC[id].i;
  let mode='intro', level=null, qs=[], step=0, picked=null, typed='', checked=false, answers=[], combo=0, t0=0, R=null;
  setTitle(T.title);
  S.last={id}; save();

  function head(extra){
    return `<header class="lhead"><a class="iconbtn" href="#/course/${g}/${s}" aria-label="Закрыть урок" style="color:var(--ink)">${ICON.close}</a>${extra||'<span class="grow"></span>'}</header>`;
  }
  function start(lv){
    level=lv; qs=T[lv].map(prep); step=0; picked=null; typed=''; checked=false; answers=[]; combo=0; t0=Date.now(); R=null; mode='quiz';
    render(true);
  }

  function introView(){
    const rec=recLevel(T.id);
    return `<div class="wrap lesson view" style="--accent:${col}">
      ${head(`<span class="grow"></span><span class="counter">Тема ${idx+1} из ${list.length}</span>`)}
      <section><div class="kicker">${SUBJ[s].name}, ${g} класс</div><h1 class="h-display" style="font-size:25px;line-height:1.2;margin-top:8px" tabindex="-1">${escH(T.title)}</h1></section>
      <section class="theory" aria-label="Правило"><div>${T.theory}</div>${T.examples&&T.examples.length?`<div class="ex">${T.examples.map(e=>`<div>${escH(e)}</div>`).join('')}</div>`:''}</section>
      <section style="display:flex;flex-direction:column;gap:12px">
        <div class="sec-title"><h2 class="h-display" style="font-size:19px">Выбери уровень</h2><span>по ${pl(T.easy.length,'заданию','задания','заданий')}</span></div>
        <div class="levels">${LV.map(lv=>{
          const r=lvRec(T.id,lv), L=LEVELS[lv];
          return `<button type="button" class="lvcard lv-${lv}" data-lv="${lv}">
            ${rec===lv?'<span class="tag">Рекомендуем</span>':''}
            <span class="lvico">${ICON.lv[lv]}</span>
            <span class="grow"><b>${L.name}</b><small>${L.desc}</small><small>${ICON.bolt(13)} ${L.pts} очков за ответ</small></span>
            <span class="best">${r?`${miniStars(starsOf(r.b))}<span>лучшая оценка «${gradeOf(r.b)}»</span>`:'<span>ещё не пройден</span>'}</span>
          </button>`;}).join('')}</div>
      </section>
      ${idx+1<list.length?`<a class="cta ghost" href="#/lesson/${g}/${s}/${list[idx+1].id}">Следующая тема: ${escH(list[idx+1].title)}</a>`:''}
    </div>`;
  }

  function quizView(){
    const q=qs[step], L=LEVELS[level], last=step===qs.length-1, rep=!!lvRec(T.id,level);
    const segs=qs.map((_,k)=>`<i class="${k<answers.length?(answers[k].ok?'ok':'no'):k===step?'cur':''}"></i>`).join('');
    const a=answers[step];
    let body='';
    if(q.type==='choice'){
      body=`<div class="opts" role="group" aria-label="Варианты ответа">${q.opts.map((o,k)=>{
        let c=''; if(checked){if(o.ok)c=' right';else if(k===picked)c=' wrong';}
        return `<button type="button" class="opt${c}" data-o="${k}" aria-pressed="${picked===k}" ${checked?'disabled':''}><span class="key" aria-hidden="true">${k+1}</span><span>${escH(o.t)}</span></button>`;}).join('')}</div>`;
    } else {
      body=`<div class="answer"><label class="sr" for="ans">Твой ответ</label>
        <input id="ans" type="text" ${q.numeric?'inputmode="numeric"':''} autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="60" placeholder="Впиши ответ" value="${escH(typed)}" ${checked?`disabled class="${a&&a.ok?'right':'wrong'}"`:''}>
        ${checked?'':'<small>Напиши ответ и нажми «Проверить» или Enter</small>'}</div>`;
    }
    const fb=checked?`<div class="fb ${a.ok?'ok':'no'}" role="status"><span class="fbi">${a.ok?ICON.tick:ICON.cross}</span><div><b>${a.ok?'Верно!':'Не совсем.'}</b>${a.ok?`<span class="plus">+${L.pts}</span>`:''}${!a.ok&&q.type==='input'?` Правильный ответ: <b>${escH(a.right)}</b>.`:''} ${escH(q.expl)}</div></div>`:'';
    const ctaOff=!checked&&(q.type==='choice'?picked===null:!typed.trim());
    return `<div class="wrap lesson view" style="--accent:${col}">
      ${head(`<div class="steps" style="grid-template-columns:repeat(${qs.length},minmax(0,1fr))" aria-hidden="true">${segs}</div><span class="counter">${step+1} из ${qs.length}</span>`)}
      <div class="qmeta"><span class="chip lv-${level}">${ICON.lv[level].replace('width="24" height="24"','width="16" height="16"')} ${L.name}${rep?' · повтор':''}</span>${combo>=2?`<span class="chip combo">🔥 ${combo} подряд</span>`:''}</div>
      <section style="display:flex;flex-direction:column;gap:14px">
        <div class="kicker">${escH(T.title)}</div>
        <h1 class="h-display qtext" tabindex="-1">${escH(q.text)}</h1>
        ${body}
      </section>
      ${fb}
      <button class="cta${checked?' dark':''}" id="go" type="button" ${ctaOff?'disabled':''}>${checked?(last?'Узнать оценку':'Дальше'):'Проверить'}</button>
      ${!checked&&q.type==='choice'?'<p class="hint">Можно выбирать клавишами 1–4 и Enter</p>':''}
    </div>`;
  }

  function finish(){
    const L=LEVELS[level], total=qs.length, correct=answers.filter(a=>a.ok).length;
    const pct=Math.round(correct/total*100), grade=gradeOf(pct), stars=starsOf(pct);
    const secs=Math.max(1,Math.round((Date.now()-t0)/1000));
    const prev=lvRec(T.id,level), rkBefore=rankOf(S.xp), lines=[];
    const base=correct*L.pts;
    lines.push([`Верные ответы: ${correct} × ${L.pts}`,base]);
    let sum=base;
    if(correct===total){lines.push(['Бонус за ответы без ошибок',L.bonus]);sum+=L.bonus;}
    if(prev){
      if(pct>prev.b){lines.push(['Новый рекорд уровня — очки полностью',0]);}
      else {const cut=Math.ceil(sum/2);if(sum-cut>0)lines.push(['Повторное прохождение — половина очков',-(sum-cut)]);sum=cut;}
    }
    const td=today(), firstToday=!S.days.includes(td);
    if(firstToday){S.days.push(td);S.days=S.days.slice(-120);}
    const st=streak();
    if(firstToday&&st>=2){const sb=5*Math.min(st,10);lines.push([`Серия: ${pl(st,'день','дня','дней')} подряд`,sb]);sum+=sb;}
    if(S.daily.d!==td)S.daily={d:td,xp:0};
    const goalBefore=S.daily.xp<S.goal;
    S.daily.xp+=sum; S.xp+=sum;
    const goalHit=goalBefore&&S.daily.xp>=S.goal;
    // статистика
    const ss=S.stats;
    ss.lessons++; ss.answers+=total; ss.correct+=correct; ss.secs+=secs;
    if(correct===total)ss.perfect++;
    if(level==='hard'&&pct>=50)ss.hard++;
    if(level==='hard'&&correct===total)ss.hardPerfect++;
    if(prev&&prev.b<70&&pct>=90)ss.comeback++;
    if(goalHit)ss.goals++;
    ss.bestStreak=Math.max(ss.bestStreak,st);
    // Серия верных ответов продолжается из урока в урок, пока не будет ошибки
    answers.forEach(a=>{ss.run=a.ok?ss.run+1:0;ss.bestCombo=Math.max(ss.bestCombo,ss.run);});
    S.tried[s]=1;
    const p=S.prog[T.id]=S.prog[T.id]||{};
    p[level]={b:Math.max(pct,prev?prev.b:0),n:(prev?prev.n:0)+1};
    const fresh=checkBadges();
    save();
    const rkAfter=rankOf(S.xp);
    R={correct,total,pct,grade,stars,secs,lines,sum,fresh,goalHit,rkBefore,rkAfter,levelUp:rkAfter.n>rkBefore.n,isNewBest:!prev||pct>prev.b};
    mode='result';
    render(true);
    if(grade>=4)SND.win();else SND.meh();
    if(grade===5||R.levelUp)setTimeout(confetti,250);
  }

  function resultView(){
    const L=LEVELS[level], gi=LV.indexOf(level), nextLv=LV[gi+1], nextT=list[idx+1];
    const titles={5:'Отлично!',4:'Хорошо!',3:'Неплохо!',2:'Нужно повторить'};
    const words={5:'отлично',4:'хорошо',3:'удовлетворительно',2:'неудовлетворительно'};
    const advice={
      5:nextLv?`Ты отлично справляешься. Попробуй ${LEVELS[nextLv].gen} уровень!`:'Высший пилотаж! Эта тема покорена на сложном уровне.',
      4:nextLv?'Почти без ошибок. Можно идти дальше или пройти ещё раз на «5».':'Уровень сдан! Пройди его без ошибок, чтобы получить «5».',
      3:'Тема зачтена, но есть ошибки. Посмотри разбор ответов ниже.',
      2:'Не расстраивайся: перечитай правило и попробуй ещё раз.'
    };
    const rk=R.rkAfter;
    const before=R.rkBefore.n===rk.n?Math.round((S.xp-R.sum-rk.min)/((rk.next||rk.min+1)-rk.min)*100):0;
    let primary;
    if(R.grade>=3&&nextLv)primary=`<button class="cta" type="button" data-start="${nextLv}">Следующий уровень: ${LEVELS[nextLv].name}</button>`;
    else if(R.grade>=3&&nextT)primary=`<a class="cta" href="#/lesson/${g}/${s}/${nextT.id}">Следующая тема</a>`;
    else if(R.grade>=3)primary=`<a class="cta" href="#/course/${g}/${s}">К темам предмета</a>`;
    else primary=`<button class="cta" type="button" id="rule">Повторить правило</button>`;
    return `<div class="wrap lesson view" style="--accent:${col}">
      ${head(`<span class="counter grow ellipsis">${escH(T.title)}</span>`)}
      <section class="grade-hero g${R.grade}">
        <div class="grade-badge" role="img" aria-label="Оценка ${R.grade}, ${words[R.grade]}"><b>${R.grade}</b><span>${words[R.grade].length>12?'оценка':words[R.grade]}</span></div>
        <h1 class="h-display" tabindex="-1">${titles[R.grade]}</h1>
        <p>${L.name} уровень · ${advice[R.grade]}</p>
        <div class="stars" aria-label="${R.stars} из 3 звёзд">${[0,1,2].map(k=>star(k<R.stars)).join('')}</div>
      </section>
      <section class="kpis" aria-label="Итоги">
        <div><b>${R.correct}/${R.total}</b><span>верных ответов</span></div>
        <div><b>${R.pct}%</b><span>точность</span></div>
        <div><b>${R.secs<60?R.secs+' с':Math.floor(R.secs/60)+':'+String(R.secs%60).padStart(2,'0')}</b><span>время</span></div>
      </section>
      <section class="panel points" aria-label="Начисление очков">
        <h2 class="h-display">Очки за урок</h2>
        ${R.lines.map(([l,v])=>`<div class="pline${v<0?' neg':''}"><span>${escH(l)}</span><b>${v>0?'+'+v:v<0?'−'+(-v):'✓'}</b></div>`).join('')}
        <div class="ptotal"><span>Итого</span><b>${ICON.bolt(24)}<span id="ptotal">+${fmt(R.sum)}</span></b></div>
      </section>
      ${R.levelUp?`<section class="levelup" role="status"><span class="rk-badge">${rk.n}</span><span><b>Новый ранг: ${rk.name}!</b><small>${AVATARS.some(a=>a[1]===rk.n&&a[0])?'Открыт новый аватар — загляни в профиль':'Так держать!'}</small></span></section>`:''}
      <section class="panel" style="display:flex;flex-direction:column;gap:10px">
        <div class="row between"><b>Ранг ${rk.n} · ${rk.name}</b><span class="muted" style="font-size:13px">${fmt(S.xp)} очков</span></div>
        <div class="xpbar light"><b id="xpfill" style="width:${R.levelUp?0:Math.max(0,before)}%"></b></div>
        <span class="muted" style="font-size:13px">${rk.next!==null?`Ещё ${pl(rk.next-S.xp,'очко','очка','очков')} до ранга «${rk.nextName}»`:'Ты достиг высшего ранга!'}</span>
      </section>
      ${R.fresh.length||R.goalHit?`<section class="newbadges" aria-label="Новые награды">${R.goalHit?`<div class="nb"><span class="bi" aria-hidden="true">🎁</span><span><b>Цель дня выполнена!</b><small>Сегодня набрано ${pl(S.daily.xp,'очко','очка','очков')}</small></span></div>`:''}${R.fresh.map(b=>`<div class="nb"><span class="bi" aria-hidden="true">${b.i}</span><span><b>Новая награда: ${b.n}</b><small>${b.d}</small></span></div>`).join('')}</section>`:''}
      <details class="review"${R.grade<4?' open':''}>
        <summary>Разбор ответов <span class="row muted" style="gap:6px;font-weight:500;font-size:14px">${R.correct} из ${R.total} ${ICON.down}</span></summary>
        <ol>${answers.map((a,k)=>`<li class="${a.ok?'ok':'no'}"><span class="fbi">${a.ok?ICON.tick:ICON.cross}</span><div><p><b>${k+1}. ${escH(a.q)}</b></p>
          <p class="yours">Твой ответ: <b>${escH(a.given||'—')}</b>${a.ok?'':` · правильно: <b style="color:var(--good)">${escH(a.right)}</b>`}</p>
          <p class="yours">${escH(a.expl)}</p></div></li>`).join('')}</ol>
      </details>
      <div class="actions">
        ${primary}
        <button class="cta ghost" type="button" id="again">Пройти этот уровень заново</button>
        ${R.grade>=3?'<button class="cta ghost" type="button" id="levels">Выбрать другой уровень</button>':''}
        ${primary.includes('href="#/course/')?'':`<a class="cta ghost" href="#/course/${g}/${s}">К темам предмета</a>`}
      </div>
    </div>`;
  }

  function check(){
    const q=qs[step];
    let ok,given,right;
    if(q.type==='choice'){if(picked===null)return;ok=q.opts[picked].ok;given=q.opts[picked].t;right=q.opts.find(o=>o.ok).t;}
    else{const inp=document.getElementById('ans');typed=inp?inp.value:typed;if(!typed.trim())return;const v=norm(typed);ok=q.answers.some(x=>norm(x)===v);given=typed.trim();right=q.answers[0];}
    checked=true;
    if(ok){combo++;SND.ok();}else{combo=0;SND.no();}
    answers.push({q:q.text,ok,given,right,expl:q.expl});
    try{navigator.vibrate&&navigator.vibrate(ok?15:[20,40,20]);}catch(e){}
    render(false);
    const go=document.getElementById('go'); if(go)go.focus({preventScroll:true});
    const fb=app.querySelector('.fb'); if(fb&&fb.scrollIntoView&&fb.getBoundingClientRect().bottom>innerHeight)fb.scrollIntoView({block:'center',behavior:reduced()?'auto':'smooth'});
  }
  function next(){
    if(step+1>=qs.length){finish();return;}
    step++; picked=null; typed=''; checked=false; render(true);
  }
  function pick(k){
    if(checked)return;
    picked=k;
    app.querySelectorAll('[data-o]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.o===k)));
    const go=document.getElementById('go'); if(go)go.disabled=false;
  }

  function render(top){
    app.innerHTML=mode==='intro'?introView():mode==='quiz'?quizView():resultView();
    if(!top){const v=app.querySelector('.view');if(v)v.classList.remove('view');}
    if(top){window.scrollTo(0,0);}
    if(mode==='intro'){
      app.querySelectorAll('[data-lv]').forEach(b=>b.onclick=()=>start(b.dataset.lv));
      keyHandler=null;
    } else if(mode==='quiz'){
      app.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>pick(+b.dataset.o));
      const go=document.getElementById('go'); go.onclick=()=>checked?next():check();
      const inp=document.getElementById('ans');
      if(inp){
        inp.oninput=()=>{typed=inp.value;go.disabled=!typed.trim();};
        if(!checked&&top)setTimeout(()=>inp.focus({preventScroll:true}),60);
      } else if(top){const h=app.querySelector('h1');if(h)h.focus({preventScroll:true});}
      keyHandler=e=>{
        if(e.altKey||e.ctrlKey||e.metaKey)return;
        const inInput=e.target&&e.target.tagName==='INPUT';
        if(e.key==='Enter'){
          if(e.target&&e.target.tagName==='BUTTON'&&e.target.id!=='go'&&!e.target.dataset.o)return;
          if(e.target&&e.target.dataset&&e.target.dataset.o!==undefined&&!checked){e.preventDefault();pick(+e.target.dataset.o);return;}
          e.preventDefault(); checked?next():check(); return;
        }
        if(!inInput&&!checked&&qs[step].type==='choice'&&/^[1-9]$/.test(e.key)){const k=+e.key-1;if(k<qs[step].opts.length){e.preventDefault();pick(k);}}
      };
    } else {
      app.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>start(b.dataset.start));
      const again=document.getElementById('again'); if(again)again.onclick=()=>start(level);
      ['rule','levels'].forEach(id=>{const el=document.getElementById(id);if(el)el.onclick=()=>{mode='intro';render(true);};});
      keyHandler=null;
      const h=app.querySelector('h1'); if(h)h.focus({preventScroll:true});
      countUp(document.getElementById('ptotal'),R.sum,900);
      const fill=document.getElementById('xpfill');
      if(fill)requestAnimationFrame(()=>requestAnimationFrame(()=>{fill.style.width=R.rkAfter.pct+'%';}));
    }
  }
  render(true);
}

/* ---------- Награды ---------- */
function rewards(){
  setTitle('Награды');
  const rk=rankOf(S.xp), got=BADGES.filter(b=>S.badges[b.id]).length;
  app.innerHTML=`<div class="wrap view">
    ${topbar()}
    <h1 class="h-display" style="font-size:26px" tabindex="-1">Награды</h1>
    <section class="rankhero">
      <div class="row" style="gap:16px;position:relative"><span class="rk-badge"><i>ранг</i>${rk.n}</span>
        <div><p>Твой ранг</p><h2 class="h-display" style="font-size:24px">${rk.name}</h2></div></div>
      <div class="xpbar" style="position:relative"><b style="width:${rk.pct}%"></b></div>
      <p style="position:relative">${fmt(S.xp)} ${plural(S.xp,'очко','очка','очков')} · ${rk.next!==null?`ещё ${pl(rk.next-S.xp,'очко','очка','очков')} до ранга «${rk.nextName}»`:'высший ранг!'}</p>
    </section>
    <section class="panel" style="display:flex;flex-direction:column;gap:10px">
      <h2 class="h-display" style="font-size:17px">Как получить очки</h2>
      <div class="pline"><span>Верный ответ: лёгкий / средний / сложный</span><b>10 / 20 / 30</b></div>
      <div class="pline"><span>Уровень без ошибок</span><b>+1 ответ</b></div>
      <div class="pline"><span>Первый урок дня при серии от 2 дней</span><b>+5 за день</b></div>
      <div class="pline"><span>Повторное прохождение без нового рекорда</span><b>½ очков</b></div>
      <div class="pline"><span>Оценка: 90%+ / 70%+ / 50%+ / меньше</span><b>5 / 4 / 3 / 2</b></div>
    </section>
    <div class="twocol">
      <section style="display:flex;flex-direction:column;gap:12px">
        <div class="sec-title"><h2 class="h-display">Значки</h2><span>${got} из ${BADGES.length}</span></div>
        <div class="badges">${BADGES.map(b=>{const on=!!S.badges[b.id];return `<div class="badge${on?'':' locked'}"><span class="bi" aria-hidden="true">${b.i}</span><b>${b.n}</b><small>${on?'Получено '+new Date(S.badges[b.id]).toLocaleDateString('ru-RU'):b.d}</small>${on?`<span class="sr">${b.d}</span>`:''}</div>`;}).join('')}</div>
      </section>
      <section style="display:flex;flex-direction:column;gap:12px">
        <div class="sec-title"><h2 class="h-display">Ранги</h2><span>${rk.n} из ${RANKS.length}</span></div>
        <div class="ladder">${RANKS.map(([min,name],k)=>{const n=k+1,av=AVATARS.find(a=>a[1]===n&&a[0]);return `<div class="rung${S.xp>=min?' got':''}${rk.n===n?' cur':''}"><span class="n">${n}</span><span><b>${name}</b><small>от ${pl(min,'очка','очков','очков')}</small></span>${av?`<span class="av" title="Аватар открывается на этом ранге">${av[0]}</span>`:''}</div>`;}).join('')}</div>
      </section>
    </div>
  </div>`;
}

/* ---------- Профиль ---------- */
function profile(){
  setTitle('Профиль');
  const [tn,tt]=countTopics(), acc=S.stats.answers?Math.round(S.stats.correct/S.stats.answers*100):0, rk=rankOf(S.xp);
  app.innerHTML=`<div class="wrap view">
    ${topbar()}
    <h1 class="h-display" style="font-size:26px" tabindex="-1">Профиль</h1>
    <section class="panel profilehead">${avatarHTML('big')}<div class="grow"><div class="h-display" style="font-size:20px">${S.name?escH(S.name):'Юный исследователь'}</div><div class="muted" style="font-size:14px;margin-top:4px">Ранг ${rk.n} · ${rk.name}</div></div></section>
    <section class="stat" aria-label="Статистика">
      <div><b>${fmt(S.xp)}</b><span>${plural(S.xp,'очко','очка','очков')}</span></div>
      <div><b>${S.stats.lessons}</b><span>${plural(S.stats.lessons,'урок','урока','уроков')} пройдено</span></div>
      <div><b>${totalStars()}</b><span>звёзд собрано</span></div>
      <div><b>${tn}<small style="font-size:14px;color:var(--quiet)">/${tt}</small></b><span>тем пройдено</span></div>
      <div><b>${acc}%</b><span>верных ответов</span></div>
      <div><b>${streak()}</b><span>${plural(streak(),'день','дня','дней')} подряд · рекорд ${S.stats.bestStreak}</span></div>
    </section>
    <div class="twocol">
    <section class="panel" style="display:flex;flex-direction:column;gap:14px">
      <div class="field"><label for="nm" style="font-weight:600">Как тебя зовут?</label><input id="nm" type="text" maxlength="20" placeholder="Имя" value="${escH(S.name)}" autocomplete="given-name"><span id="saved" style="font-size:13px;color:var(--quiet);min-height:18px" aria-live="polite"></span></div>
      <div class="field"><span style="font-weight:600">Аватар</span><span class="muted" style="font-size:13px;margin-top:-4px">Новые аватары открываются с повышением ранга</span>
        <div class="avpick" role="group" aria-label="Выбор аватара">${AVATARS.map(([e,lvl],k)=>{const open=rk.n>=lvl;return `<button type="button" data-av="${k}" aria-pressed="${S.avatar===k}" ${open?'':'disabled'} aria-label="${e?'Аватар '+e:'Первая буква имени'}${open?'':', откроется на ранге '+lvl}">${e?`<span class="e">${e}</span>`:`<span class="letter">${S.name?escH(S.name.trim()[0].toUpperCase()):'А'}</span>`}${open?'':`<span class="lock">${lvl}</span>`}</button>`;}).join('')}</div></div>
    </section>
    <section class="panel">
      <div class="setting"><span class="lbl">Цель на день, очков</span><div class="seg small" role="group" aria-label="Цель на день, очков">${[30,60,100,150].map(n=>`<button type="button" data-goal="${n}" aria-pressed="${S.goal===n}">${n}</button>`).join('')}</div></div>
      <div class="setting"><span class="lbl">Оформление</span><div class="seg small" role="group" aria-label="Тема оформления">${[['auto','Авто'],['light','Светлая'],['dark','Тёмная']].map(([k,n])=>`<button type="button" data-theme-set="${k}" aria-pressed="${S.theme===k}">${n}</button>`).join('')}</div></div>
      <div class="setting"><div class="row"><span class="lbl" id="snd-l">Звуки</span><button type="button" class="switch" role="switch" id="snd" aria-labelledby="snd-l" aria-checked="${S.sound}"></button></div></div>
      <div class="setting"><span class="lbl">Начать сначала</span><span style="font-size:14px;color:var(--quiet);line-height:1.45">Сотрёт очки, оценки, значки и серию на этом устройстве.</span><button class="cta ghost" id="reset" type="button">Сбросить прогресс</button></div>
    </section>
    </div>
  </div>`;
  const nm=document.getElementById('nm'),sv=document.getElementById('saved');
  nm.oninput=()=>{S.name=nm.value.trim();save();sv.textContent='Имя сохранено';const top=app.querySelector('.topbar');if(top)top.outerHTML=topbar();};
  nm.onchange=()=>profile();
  app.querySelectorAll('[data-av]').forEach(b=>b.onclick=()=>{S.avatar=+b.dataset.av;save();profile();});
  app.querySelectorAll('[data-goal]').forEach(b=>b.onclick=()=>{S.goal=+b.dataset.goal;save();profile();});
  app.querySelectorAll('[data-theme-set]').forEach(b=>b.onclick=()=>{S.theme=b.dataset.themeSet;save();applyTheme();profile();});
  document.getElementById('snd').onclick=e=>{S.sound=!S.sound;save();e.currentTarget.setAttribute('aria-checked',String(S.sound));if(S.sound)SND.ok();};
  document.getElementById('reset').onclick=e=>{
    const b=e.currentTarget;
    if(b.dataset.sure){const keep={name:S.name,grade:S.grade,theme:S.theme,sound:S.sound,goal:S.goal};S=Object.assign(DEF(),keep);save();profile();toast('🧹','Прогресс сброшен','Можно начинать заново');}
    else{b.dataset.sure='1';b.textContent='Нажми ещё раз, чтобы подтвердить';}
  };
}

/* ---------- Маршруты ---------- */
let firstRoute=true;
function route(){
  keyHandler=null;
  document.querySelectorAll('.confetti').forEach(c=>c.remove());
  const h=(location.hash||'#/').slice(2).split('/').map(decodeURIComponent);
  document.body.classList.toggle('in-lesson',h[0]==='lesson');
  const g=+h[1], s=h[2];
  const okSubj=GRADES.includes(g)&&C[g][s]&&C[g][s].length;
  if(h[0]==='course'&&okSubj){setNav('home');course(g,s);}
  else if(h[0]==='lesson'&&okSubj&&TOPIC[h[3]]&&TOPIC[h[3]].g===g&&TOPIC[h[3]].s===s){setNav('home');lesson(g,s,h[3]);}
  else if(h[0]==='rewards'){setNav('rewards');rewards();}
  else if(h[0]==='profile'){setNav('profile');profile();}
  else {setNav('home');home();}
  window.scrollTo(0,0);
  if(!firstRoute){const h1=app.querySelector('h1');if(h1&&!app.contains(document.activeElement))h1.focus({preventScroll:true});}
  firstRoute=false;
}

load();
applyTheme();
if(S.days.length&&S.stats.bestStreak<streak()){S.stats.bestStreak=streak();save();}
addEventListener('hashchange',route);
addEventListener('storage',e=>{if(e.key===KEY){load();applyTheme();route();}});
route();
})();
