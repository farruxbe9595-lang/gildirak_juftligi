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

const section = sectionById(qs('section') || 1);
function renderLessonText(s){
 const pack = s.lessonText ? (lang==='ru' ? s.lessonText.ru : s.lessonText.uz) : null;
 if(pack){
   return pack.map(b=>`<section class="lecture-section"><h4>${esc(lang==='uzc'?latinToCyrillic(b.title):b.title)}</h4>${(b.paras||[]).map(p=>`<p>${esc(lang==='uzc'?latinToCyrillic(p):p)}</p>`).join('')}</section>`).join('');
 }
 return `<section class="lecture-section"><h4>${esc(i18n('Dars mazmuni','Содержание урока'))}</h4><p>${esc(intro(s))}</p><p>${esc(i18n('Bu bo‘lim bo‘yicha asosiy o‘quv material quyidagi rasmiy RD sahifalarida to‘liq berilgan. Undagi rasm, jadval, o‘lcham va punktlar darsning asosiy manbasi hisoblanadi. Keyingi bosqichda har bir bo‘lim shu sahifalar bo‘yicha alohida to‘liq texnik tarjima va izoh bilan kengaytiriladi.','Основной учебный материал по разделу полностью приведен ниже на официальных страницах РД. Рисунки, таблицы, размеры и пункты являются основным источником урока. На следующем этапе каждый раздел расширяется полным техническим переводом и пояснениями по этим страницам.'))}</p></section>`;
}
function renderPages(s){
 if(!s.pageImages || !s.pageImages.length) return `<p class="note">${esc(i18n('Bu bo‘lim uchun sahifa rasmi topilmadi.','Изображения страниц для раздела не найдены.'))}</p>`;
 return `<div class="page-grid">${s.pageImages.map(img=>`<figure class="rd-page"><a href="${esc(img.src)}" target="_blank"><img src="${esc(img.src)}" loading="lazy" alt="RD лист ${img.sheet}"></a><figcaption>${esc(i18n('RD asl sahifasi','Официальная страница РД'))}: лист ${img.sheet}. ${esc(i18n('Rasm/jadval/chizma bo‘lsa, aynan shu sahifada ko‘rsatilgan. Kattalashtirish uchun rasmni bosing.','Если на странице есть рисунок, таблица или чертеж, он показан здесь. Для увеличения нажмите изображение.'))}</figcaption></figure>`).join('')}</div>`;
}
function render(){
 renderLanguage(); renderSectionNav(section.id); bindMenu();
 $('pageTitle').textContent=`${section.id}. ${title(section)}`;
 $('lessonHead').innerHTML=`<p class="eyebrow">${esc(i18n('Dars oynasi','Страница урока'))}</p><h3>${section.id}. ${esc(title(section))}</h3><div class="pill-row"><span class="pill">RD: ${esc(section.pages)}</span><span class="pill">${section.target} ${esc(i18n('test savol','тестовых вопросов'))}</span><span class="pill">${groupsFor(section)} ${esc(i18n('guruh','блоков'))}</span></div>`;
 $('lessonBody').innerHTML=`<div class="official-note"><b>${esc(i18n('Muhim:', 'Важно:'))}</b> ${esc(i18n('Dars mazmuni endi umumiy yozuv emas: bo‘limga tegishli rasmiy RD sahifalari, rasm, jadval va o‘lchamlar bilan birga ko‘rsatiladi.', 'Материал больше не является общим текстом: показываются официальные страницы РД данного раздела вместе с рисунками, таблицами и размерами.'))}</div>${renderLessonText(section)}<section class="lecture-section"><h4>${esc(i18n('Asl RD sahifalari', 'Официальные страницы РД'))}</h4>${renderPages(section)}</section>`;
 $('sideTitle').textContent=i18n('Bo‘lim oynalari','Страницы раздела');
 $('lessonActions').innerHTML=`<a class="btn primary" href="test.html?section=${section.id}">${esc(i18n('Test oynasiga o‘tish','Перейти к тесту'))}</a><a class="btn secondary" href="index.html">${esc(i18n('Bo‘limlar ro‘yxati','Список разделов'))}</a><a class="btn secondary" href="lesson.html?section=${Math.max(1,section.id-1)}">${esc(i18n('Oldingi bo‘lim','Предыдущий раздел'))}</a><a class="btn secondary" href="lesson.html?section=${Math.min(DATA.sections.length,section.id+1)}">${esc(i18n('Keyingi bo‘lim','Следующий раздел'))}</a><p class="note">${esc(i18n('Rasmlar RDning rasmiy sahifasi sifatida qo‘yilgan. Sahifani bosib alohida kattalashtirib ko‘rish mumkin.','Изображения добавлены как официальные страницы РД. Их можно открыть отдельно для увеличения.'))}</p>`;
 $('backHome').textContent=i18n('Bosh sahifa','Главная');
}
render();
