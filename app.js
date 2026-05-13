const DATA = window.TRAINING_DATA;
const GROUP_SIZE = DATA.meta.groupSize || 15;
const PASS_SCORE = DATA.meta.passScore || 85;
let lang = localStorage.getItem('rd_lang_v5') || 'uz';
const $ = id => document.getElementById(id);
function qs(name){ return new URLSearchParams(location.search).get(name); }
function esc(v){ return String(v ?? '').replace(/[&<>\"]/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
function latinToCyrillic(text=''){
 const map=[['O‘','Ў'],['G‘','Ғ'],['o‘','ў'],['g‘','ғ'],['Oʻ','Ў'],['Gʻ','Ғ'],['oʻ','ў'],['gʻ','ғ'],['Sh','Ш'],['Ch','Ч'],['Yo','Ё'],['Ya','Я'],['Yu','Ю'],['Ye','Е'],['Ng','Нг'],['sh','ш'],['ch','ч'],['yo','ё'],['ya','я'],['yu','ю'],['ye','е'],['ng','нг'],['A','А'],['B','Б'],['D','Д'],['E','Э'],['F','Ф'],['G','Г'],['H','Ҳ'],['I','И'],['J','Ж'],['K','К'],['L','Л'],['M','М'],['N','Н'],['O','О'],['P','П'],['Q','Қ'],['R','Р'],['S','С'],['T','Т'],['U','У'],['V','В'],['X','Х'],['Y','Й'],['Z','З'],['a','а'],['b','б'],['d','д'],['e','э'],['f','ф'],['g','г'],['h','ҳ'],['i','и'],['j','ж'],['k','к'],['l','л'],['m','м'],['n','н'],['o','о'],['p','п'],['q','қ'],['r','р'],['s','с'],['t','т'],['u','у'],['v','в'],['x','х'],['y','й'],['z','з']];
 let out=String(text); map.forEach(([a,b])=>out=out.replaceAll(a,b)); return out;
}
function L(v){ const s=String(v||''); return lang==='uzc'?latinToCyrillic(s):s; }
function i18n(uz,ru){ return lang==='ru'?ru:L(uz); }
function title(s){ return lang==='ru' ? s.ru_title : L(s.uz_title); }
function intro(s){ return lang==='ru' ? s.ru_intro : L(s.uz_intro); }
function subName(x){ return lang==='ru' ? x.ru_name : L(x.uz_name); }
function subMain(x){ return lang==='ru' ? x.ru_main : L(x.uz_main); }
function subRisk(x){ return lang==='ru' ? x.ru_risk : L(x.uz_risk); }
function subAction(x){ return lang==='ru' ? x.ru_action : L(x.uz_action); }
function groupsFor(s){ return Math.ceil(s.target/GROUP_SIZE); }
function sectionById(id){ return DATA.sections.find(x=>x.id===Number(id)) || DATA.sections[0]; }
function progress(){ try{return JSON.parse(localStorage.getItem('rd_progress_v5')||'{}')}catch{return{}} }
function saveProgress(sectionId,group,score){ const p=progress(); p[`${sectionId}.${group}`]={score,passed:score>=PASS_SCORE,at:new Date().toISOString()}; localStorage.setItem('rd_progress_v5',JSON.stringify(p)); }
function completedGroups(){ return Object.values(progress()).filter(x=>x.passed).length; }
function totalGroups(){ return DATA.sections.reduce((a,s)=>a+groupsFor(s),0); }
function renderLanguage(){ if($('languageSelect')){ $('languageSelect').value=lang; $('languageSelect').onchange=e=>{ lang=e.target.value; localStorage.setItem('rd_lang_v5',lang); location.reload(); }; } if($('langLabel')) $('langLabel').textContent = lang==='ru'?'Язык':'Til / Язык'; }
function renderSectionNav(activeId){
 if(!$('sectionList')) return;
 const p=progress();
 $('sectionList').innerHTML=DATA.sections.map(s=>{
   const done=Array.from({length:groupsFor(s)},(_,i)=>p[`${s.id}.${i+1}`]?.passed).filter(Boolean).length;
   const href=(location.pathname.endsWith('test.html')?'test.html':'lesson.html')+`?section=${s.id}`;
   return `<a class="section-link ${s.id===activeId?'active':''}" href="${href}"><span class="section-num">${done||s.id}</span><span class="section-title">${s.id}. ${esc(title(s))}<br><small>${s.pages} · ${s.target} ${esc(i18n('savol','вопросов'))}</small></span></a>`;
 }).join('');
}
function bindMenu(){ if($('menuBtn')) $('menuBtn').onclick=()=> $('sidebar')?.classList.toggle('open'); }

function renderStats(){
  $('stats').innerHTML=[
    [DATA.sections.length,i18n('bo‘lim','разделов')],
    [DATA.meta.totalPlannedQuestions,i18n('test savol','тестовых вопросов')],
    [totalGroups(),i18n('15 savolli guruh','блоков по 15')],
    [Math.round(completedGroups()/Math.max(totalGroups(),1)*100)+'%',i18n('progress','прогресс')]
  ].map(([a,b])=>`<div class="stat"><b>${a}</b><span>${esc(b)}</span></div>`).join('');
}
function card(s){
  return `<article class="section-card" data-title="${esc((s.id+' '+title(s)).toLowerCase())}">
    <h3>${s.id}. ${esc(title(s))}</h3>
    <p class="note">${esc(intro(s))}</p>
    <div class="pill-row"><span class="pill">RD: ${esc(s.pages)}</span><span class="pill">${s.target} ${esc(i18n('test savol','вопросов'))}</span><span class="pill">${groupsFor(s)} ${esc(i18n('guruh','блоков'))}</span></div>
    <div class="card-actions"><a class="btn primary" href="lesson.html?section=${s.id}">${esc(i18n('Darsga kirish','Открыть урок'))}</a><a class="btn secondary" href="test.html?section=${s.id}">${esc(i18n('Testga kirish','Открыть тест'))}</a></div>
  </article>`;
}
function renderCards(){ const q=($('sectionSearch').value||'').toLowerCase(); $('cards').innerHTML=DATA.sections.filter(s=>(s.id+' '+title(s)).toLowerCase().includes(q)).map(card).join(''); }
function renderMain(){
  renderLanguage(); renderSectionNav(0); renderStats(); renderCards(); bindMenu();
  $('sectionSearch').placeholder=i18n('Bo‘lim qidirish...','Поиск раздела...');
  $('sectionSearch').oninput=renderCards;
  $('mainTitle').textContent=i18n('G‘ildirak juftligi bo‘yicha alohida dars va test oynalari','Отдельные страницы уроков и тестов по колесным парам');
  $('heroTitle').textContent=i18n('Bo‘limni tanlang: dars alohida, test alohida ochiladi','Выберите раздел: урок и тест открываются отдельно');
  $('heroText').textContent=i18n('Har bir bo‘lim uchun rasmiy RD sahifalari rasm/jadval/chizma ko‘rinishida beriladi. Dars oynasida mavzu, test oynasida bilimni mustahkamlash ishlaydi.','Для каждого раздела показаны официальные страницы РД с рисунками, таблицами и чертежами. Материал открывается на странице урока, проверка знаний - на странице теста.');
}
renderMain();
