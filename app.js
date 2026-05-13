const DATA = window.TRAINING_DATA;
const GROUP_SIZE = DATA.meta.groupSize || 15;
const PASS_SCORE = DATA.meta.passScore || 85;
const state = {
  lang: localStorage.getItem('rd_lang_v2') || 'uz',
  sectionId: Number(localStorage.getItem('rd_section_v2') || 1),
  group: Number(localStorage.getItem('rd_group_v2') || 1),
  quiz: null,
  answered: false
};
const $ = id => document.getElementById(id);
const ui = {
  uz:{search:'Bo‘lim qidirish...', source:'O‘quv modul', heroEyebrow:'Professional o‘quv dastur', heroTitle:'Har bo‘lim hajmiga qarab savollar avtomatik guruhlanadi', heroText:'Savollar bir xil sonda emas: kichik bo‘limlar qisqaroq, katta bo‘limlar esa ko‘proq 15 savolli bloklarga bo‘lingan.', sections:'bo‘lim', questions:'test savol', groups:'15 savolli guruh', progress:'progress', lesson:'Dars mazmuni', sourcePages:'RD sahifalari', expected:'Xodim nimani tushunishi kerak', coverage:'Qamrov xaritasi', topic:'Mavzu', main:'Asosiy mazmun', risk:'Xavfli xato', action:'To‘g‘ri harakat', terms:'Asl terminlar', plan:'Test rejasi', chooseGroup:'Guruhni tanlang', start:'Testni boshlash', next:'Keyingi savol', finish:'Yakunlash', restart:'Qayta ishlash', correct:'To‘g‘ri', wrong:'Noto‘g‘ri', explanation:'Izoh', score:'Natija', passed:'O‘tdi', notPassed:'Qayta o‘qish kerak', reset:'Progressni tozalash', confirmReset:'Barcha progress o‘chsinmi?', groupComplete:'Guruh yakunlandi', standardNote:'Eslatma: bu platforma RD tuzilmasi bo‘yicha o‘quv formatiga aylantirilgan. Ishlab chiqarishda aniq raqamli me’yorlar va mahalliy texnologik kartalar bilan solishtirib qo‘llang.'},
  ru:{search:'Поиск раздела...', source:'Учебный модуль', heroEyebrow:'Профессиональная учебная программа', heroTitle:'Количество вопросов зависит от объема каждого раздела', heroText:'Вопросы не одинаковые по числу: малые разделы короче, крупные разделы разбиты на несколько блоков по 15 вопросов.', sections:'разделов', questions:'тестовых вопросов', groups:'блоков по 15', progress:'прогресс', lesson:'Учебный материал', sourcePages:'Страницы РД', expected:'Что должен понять работник', coverage:'Карта охвата', topic:'Тема', main:'Основное содержание', risk:'Опасная ошибка', action:'Правильное действие', terms:'Исходные термины', plan:'План тестирования', chooseGroup:'Выберите блок', start:'Начать тест', next:'Следующий вопрос', finish:'Завершить', restart:'Повторить', correct:'Верно', wrong:'Неверно', explanation:'Пояснение', score:'Результат', passed:'Зачет', notPassed:'Нужно повторить', reset:'Сбросить прогресс', confirmReset:'Удалить весь прогресс?', groupComplete:'Блок завершен', standardNote:'Примечание: платформа преобразует структуру РД в учебный формат. В производстве применяйте с проверкой точных числовых норм и локальных технологических карт.'}
};
function latinToCyrillic(text=''){
  const map=[['O‘','Ў'],['G‘','Ғ'],['o‘','ў'],['g‘','ғ'],['Oʻ','Ў'],['Gʻ','Ғ'],['oʻ','ў'],['gʻ','ғ'],['Sh','Ш'],['Ch','Ч'],['Yo','Ё'],['Ya','Я'],['Yu','Ю'],['Ye','Е'],['Ng','Нг'],['sh','ш'],['ch','ч'],['yo','ё'],['ya','я'],['yu','ю'],['ye','е'],['ng','нг'],['A','А'],['B','Б'],['D','Д'],['E','Э'],['F','Ф'],['G','Г'],['H','Ҳ'],['I','И'],['J','Ж'],['K','К'],['L','Л'],['M','М'],['N','Н'],['O','О'],['P','П'],['Q','Қ'],['R','Р'],['S','С'],['T','Т'],['U','У'],['V','В'],['X','Х'],['Y','Й'],['Z','З'],['a','а'],['b','б'],['d','д'],['e','э'],['f','ф'],['g','г'],['h','ҳ'],['i','и'],['j','ж'],['k','к'],['l','л'],['m','м'],['n','н'],['o','о'],['p','п'],['q','қ'],['r','р'],['s','с'],['t','т'],['u','у'],['v','в'],['x','х'],['y','й'],['z','з']];
  let out=String(text); map.forEach(([a,b])=>out=out.replaceAll(a,b)); return out;
}
function t(key){ const pack = state.lang==='ru'?ui.ru:ui.uz; const val = pack[key]||key; return state.lang==='uzc'?latinToCyrillic(val):val; }
function L(text){ return state.lang==='uzc'?latinToCyrillic(text||''):(text||''); }
function hasCyrillic(text=''){ return /[А-Яа-яЁёЎўҚқҒғҲҳ]/.test(String(text)); }
function pickLocalized(ruText='', uzText=''){
  const ru = String(ruText || '');
  const uz = String(uzText || '');
  if(state.lang === 'ru'){
    if(hasCyrillic(ru)) return ru;
    if(hasCyrillic(uz)) return uz;
    return ru || uz;
  }
  const uzLatin = !hasCyrillic(uz) ? uz : (!hasCyrillic(ru) ? ru : uz);
  return state.lang === 'uzc' ? latinToCyrillic(uzLatin) : uzLatin;
}
function esc(v){
  return String(v ?? '').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
}
function sectionTitle(s){ return pickLocalized(s.ru_title, s.uz_title); }
function sectionIntro(s){ return pickLocalized(s.ru_intro, s.uz_intro); }
function subName(x){ return pickLocalized(x.ru_name, x.uz_name); }
function subMain(x){ return pickLocalized(x.ru_main, x.uz_main); }
function subRisk(x){ return pickLocalized(x.ru_risk, x.uz_risk); }
function subAction(x){ return pickLocalized(x.ru_action, x.uz_action); }
function rawTerms(x){ return String(x.terms || '').trim(); }
function progress(){ try{return JSON.parse(localStorage.getItem('rd_progress_v2')||'{}')}catch{return{}} }
function saveGroupProgress(sectionId, group, score){ const p=progress(); p[`${sectionId}.${group}`]={score, passed: score>=PASS_SCORE, at:new Date().toISOString()}; localStorage.setItem('rd_progress_v2',JSON.stringify(p)); }
function groupsFor(s){ return Math.ceil(s.target/GROUP_SIZE); }
function completedGroups(){ const p=progress(); return Object.values(p).filter(x=>x.passed).length; }
function totalGroups(){ return DATA.sections.reduce((a,s)=>a+groupsFor(s),0); }
function renderStats(){ $('stats').innerHTML = [
  [DATA.sections.length, t('sections')],
  [DATA.meta.totalPlannedQuestions, t('questions')],
  [totalGroups(), t('groups')],
  [Math.round(completedGroups()/Math.max(totalGroups(),1)*100)+'%', t('progress')]
].map(([a,b])=>`<div class="stat"><b>${a}</b><span>${b}</span></div>`).join(''); }
function renderI18n(){
  $('sourceLabel').textContent=t('source'); $('heroEyebrow').textContent=t('heroEyebrow'); $('heroTitle').textContent=t('heroTitle'); $('heroText').textContent=t('heroText'); $('sectionSearch').placeholder=t('search'); $('resetProgress').textContent=t('reset'); $('langLabel').textContent=state.lang==='ru'?'Язык':'Til / Язык';
}
function renderSectionList(){
  const q = ($('sectionSearch').value||'').toLowerCase();
  const p=progress();
  $('sectionList').innerHTML = DATA.sections.filter(s=>`${s.id} ${sectionTitle(s)}`.toLowerCase().includes(q)).map(s=>{
    const done=Array.from({length:groupsFor(s)},(_,i)=>p[`${s.id}.${i+1}`]?.passed).filter(Boolean).length;
    return `<button class="section-btn ${s.id===state.sectionId?'active':''}" data-section="${s.id}"><span class="section-num">${done?done:s.id}</span><span class="section-title">${s.id}. ${sectionTitle(s)}<br><small>${s.target} ${t('questions')} / ${groupsFor(s)} ${t('groups')}</small></span></button>`
  }).join('');
  document.querySelectorAll('[data-section]').forEach(btn=>btn.addEventListener('click',()=>{state.sectionId=Number(btn.dataset.section);state.group=1;state.quiz=null;localStorage.setItem('rd_section_v2',state.sectionId);localStorage.setItem('rd_group_v2',1);renderAll();$('sidebar').classList.remove('open');}));
}
function lectureText(s){
  const custom = pickLocalized(s.ru_lecture, s.uz_lecture);
  if(custom) return custom;

  if(state.lang === 'ru'){
    const topicBlocks = s.subtopics.map((x, i) => {
      return `### ${i + 1}. ${subName(x)}\n\n${subMain(x)}. Работник должен понимать назначение этого элемента или операции, проверять его по документу, маркировке, чертежу и измерениям, а при несоответствии не передавать деталь на следующий этап без решения ответственного лица.`;
    }).join('\n\n');
    return `### Краткая лекция\n\n${sectionIntro(s)} Этот раздел нужен не для формального чтения, а для правильного выполнения работ на участке. Главная задача работника — понимать, что именно проверяется, почему это влияет на безопасность движения и каким документом подтверждается решение.\n\n${topicBlocks}\n\n### Практический вывод\n\nПеред выполнением операции работник должен определить объект контроля, сверить его с требованиями РД, применить исправные средства измерений и зафиксировать результат. Если есть сомнение по типу детали, размеру, состоянию поверхности, подшипнику, креплению или маркировке — работу нельзя продолжать как обычную операцию.`;
  }

  const topicBlocks = s.subtopics.map((x, i) => {
    return `### ${i + 1}. ${subName(x)}\n\n${subMain(x)}. Xodim bu element yoki operatsiyaning vazifasini tushunishi, uni hujjat, markirovka, chizma va o‘lchov bo‘yicha tekshirishi kerak. Mos kelmaslik aniqlansa, detalni keyingi bosqichga mas’ul shaxs qarorisiz o‘tkazish mumkin emas.`;
  }).join('\n\n');
  return `### Qisqa ma’ruza\n\n${sectionIntro(s)} Bu bo‘lim faqat matnni o‘qish uchun emas, balki uchastkada ishni to‘g‘ri bajarish uchun kerak. Asosiy maqsad — xodim nimani tekshirayotganini, bu narsa harakat xavfsizligiga qanday ta’sir qilishini va qaror qaysi hujjat asosida qabul qilinishini aniq tushunishi.\n\n${topicBlocks}\n\n### Amaliy xulosa\n\nHar bir operatsiyadan oldin xodim nazorat qilinadigan obyektni aniqlaydi, uni RD talablari bilan solishtiradi, soz va qiyoslangan o‘lchov vositalaridan foydalanadi hamda natijani qayd qiladi. Detal turi, o‘lchami, yuzasi, podshipnik, mahkamlash yoki markirovkada shubha bo‘lsa, ishni oddiy tartibda davom ettirish mumkin emas.`;
}

function renderLectureParagraphs(text){
  return String(text || '')
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map(part => {
      const clean = esc(part.trim());
      if(clean.startsWith('### ')) return `<h4>${clean.replace('### ', '')}</h4>`;
      if(clean.startsWith('- ')){
        const items = clean.split('\n').map(x => x.replace(/^\-\s*/, '').trim()).filter(Boolean).map(x => `<li>${x}</li>`).join('');
        return `<ul>${items}</ul>`;
      }
      return `<p>${clean}</p>`;
    }).join('');
}

function txt(v){
  return state.lang === 'uzc' ? latinToCyrillic(String(v || '')) : String(v || '');
}
function htmlText(v){ return esc(txt(v)); }
function getLessonBlocks(s){
  if(!s.lessonBlocks) return null;
  return state.lang === 'ru' ? (s.lessonBlocks.ru || null) : (s.lessonBlocks.uz || null);
}
function renderBlock(block){
  if(block.type === 'lead' || block.type === 'lecture'){
    return `<section class="lesson-rich ${block.type}">
      <h4>${htmlText(block.title)}</h4>
      ${(block.paragraphs || []).map(p => `<p>${htmlText(p)}</p>`).join('')}
    </section>`;
  }
  if(block.type === 'table'){
    return `<section class="lesson-rich">
      <h4>${htmlText(block.title)}</h4>
      <div class="pro-table-wrap"><table class="pro-table">
        <thead><tr>${(block.headers || []).map(h => `<th>${htmlText(h)}</th>`).join('')}</tr></thead>
        <tbody>${(block.rows || []).map(row => `<tr>${row.map(cell => `<td>${htmlText(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
    </section>`;
  }
  if(block.type === 'checklist'){
    return `<section class="lesson-rich checklist-box">
      <h4>${htmlText(block.title)}</h4>
      <ol>${(block.items || []).map(item => `<li>${htmlText(item).replace(/^\d+\)\s*/, '')}</li>`).join('')}</ol>
    </section>`;
  }
  if(block.type === 'callout'){
    return `<section class="lesson-rich callout-box">
      <h4>${htmlText(block.title)}</h4>
      <p>${htmlText(block.text)}</p>
    </section>`;
  }
  if(block.type === 'image_gallery'){
    return `<section class="lesson-rich image-section">
      <h4>${htmlText(block.title)}</h4>
      <p class="visual-note">${state.lang==='ru'?'Ниже показаны официальные страницы РД с чертежами, таблицами размеров и маркировкой. Нажмите на изображение правой кнопкой и откройте в новой вкладке, если нужно увеличить.':txt('Quyida RDdagi rasmiy sahifalar: chizmalar, o‘lcham jadvallari va markirovka namunalari berilgan. Kattalashtirish kerak bo‘lsa, rasmni yangi oynada oching.')}</p>
      <div class="rd-gallery">
        ${(block.images || []).map(img => `<figure>
          <img src="${esc(img.src)}" alt="${htmlText(img.caption_uz || img.caption_ru || '')}" loading="lazy" />
          <figcaption>${htmlText(state.lang==='ru' ? (img.caption_ru || img.caption_uz) : (img.caption_uz || img.caption_ru))}</figcaption>
        </figure>`).join('')}
      </div>
    </section>`;
  }
  return '';
}

function renderLesson(){
  const s = DATA.sections.find(x=>x.id===state.sectionId)||DATA.sections[0];
  $('currentTitle').textContent=`${s.id}. ${sectionTitle(s)}`;
  const blocks = getLessonBlocks(s);
  const body = blocks
    ? blocks.map(renderBlock).join('')
    : `<div class="lecture-box">${renderLectureParagraphs(lectureText(s))}</div>`;

  $('lessonCard').innerHTML=`
    <div class="card-head">
      <p class="eyebrow">${t('lesson')}</p>
      <h3>${s.id}. ${sectionTitle(s)}</h3>
      <div class="pill-row">
        <span class="pill">${t('sourcePages')}: ${s.pages}</span>
        <span class="pill">${s.target} ${t('questions')}</span>
        <span class="pill">${groupsFor(s)} ${t('groups')}</span>
      </div>
    </div>
    <div class="card-body professional-lesson">
      ${body}
      <p class="note">${t('standardNote')}</p>
    </div>`;
}

function shuffle(a){const arr=a.slice();for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr;}
function wrongPool(section, kind){
 const terms=['tasodifiy qaror qabul qilish','faqat ko‘z bilan baholash','hujjatni keyin to‘ldirish','nomoslikka qaramay davom etish','o‘lchovsiz qabul qilish','markirovkani tekshirmaslik'];
 const termsRu=['принять случайное решение','оценить только визуально','заполнить документ потом','продолжить несмотря на несоответствие','принять без измерения','не проверять маркировку'];
 return state.lang==='ru'?termsRu:terms.map(L);
}
const stems={
uz:[
 ['main','{topic} mavzusida asosiy talab nimadan iborat?'],['risk','{topic} bo‘yicha qaysi xato eng xavfli?'],['action','{topic} bo‘yicha xodimning to‘g‘ri harakati qaysi?'],['main','{section} bo‘limida {topic} nima uchun o‘rganiladi?'],['action','Ishlab chiqarishda {topic} bo‘yicha qaror qabul qilishdan oldin nima qilinadi?'],['risk','Qaysi javob {topic} bo‘yicha noto‘g‘ri ish yuritishni bildiradi?'],['main','{topic} bo‘yicha xodim nimani aniq tushunishi kerak?'],['action','Nazoratda {topic} bo‘yicha mos kelmaslik aniqlansa nima qilinadi?'],['main','{section} bo‘limidagi {topic} qaysi jarayonni tushuntiradi?'],['action','{topic} bo‘yicha texnologik intizom qanday saqlanadi?']
],
ru:[
 ['main','Какое основное требование относится к теме «{topic}»?'],['risk','Какая ошибка наиболее опасна по теме «{topic}»?'],['action','Какое действие работника является правильным по теме «{topic}»?'],['main','Зачем в разделе «{section}» изучается тема «{topic}»?'],['action','Что нужно сделать перед принятием производственного решения по теме «{topic}»?'],['risk','Какой вариант означает неправильную работу по теме «{topic}»?'],['main','Что работник должен четко понимать по теме «{topic}»?'],['action','Что делать при несоответствии по теме «{topic}»?'],['main','Какой процесс раскрывает тема «{topic}» в данном разделе?'],['action','Как обеспечивается технологическая дисциплина по теме «{topic}»?']
]};
function makeQuestion(section, idx){
  const sub = section.subtopics[idx % section.subtopics.length];
  const lang = state.lang==='ru'?'ru':'uz';
  const stem = stems[lang][idx % stems[lang].length];
  const topic = subName(sub);
  const text = L(stem[1].replace('{topic}', topic).replace('{section}', sectionTitle(section)));
  let correct = '';
  if(stem[0]==='main') correct=subMain(sub);
  if(stem[0]==='risk') correct=subRisk(sub);
  if(stem[0]==='action') correct=subAction(sub);
  if(stem[0]==='terms') correct=sub.terms;
  const pool = wrongPool(section, stem[0]);
  const opts=shuffle([correct,...shuffle(pool).slice(0,3)]).map(x=>({label:x,correct:x===correct}));
  const exp = `${t('explanation')}: ${subMain(sub)}. ${t('action')}: ${subAction(sub)}.`;
  return {text, options:opts, explanation:exp};
}
function buildAllQuestions(section){ return Array.from({length:section.target},(_,i)=>makeQuestion(section,i)); }
function currentSection(){ return DATA.sections.find(x=>x.id===state.sectionId)||DATA.sections[0]; }
function renderGroupButtons(s){
  const p=progress();
  return `<div class="group-list">${Array.from({length:groupsFor(s)},(_,i)=>{const n=i+1;const pr=p[`${s.id}.${n}`];return `<button class="group-btn ${n===state.group?'active':''}" data-group="${n}">${n}${pr?.passed?' ✓':''}</button>`}).join('')}</div>`;
}
function renderQuizStart(){
  const s=currentSection();
  const from=(state.group-1)*GROUP_SIZE+1; const to=Math.min(state.group*GROUP_SIZE,s.target);
  $('quizCard').innerHTML=`<div class="card-head"><p class="eyebrow">${t('plan')}</p><h3>${sectionTitle(s)}</h3><div class="pill-row"><span class="pill">${t('sourcePages')}: ${s.pages}</span><span class="pill">${s.target} ${t('questions')}</span><span class="pill">${groupsFor(s)} ${t('groups')}</span></div></div><div class="card-body"><h4>${t('chooseGroup')}</h4>${renderGroupButtons(s)}<div class="block"><b>${t('groups')} ${state.group}</b><p>${from}-${to} / ${s.target}. ${state.lang==='ru'?'Для крупного раздела каждый блок проверяет отдельные микротемы и повторяет ключевые риски в разных производственных ситуациях.':'Katta bo‘limlarda har bir blok alohida mikro-mavzularni tekshiradi va asosiy xavflarni turli ishlab chiqarish holatlarida qayta mustahkamlaydi.'}</p></div><div class="actions"><button class="primary" id="startQuiz">${t('start')}</button></div></div>`;
  document.querySelectorAll('[data-group]').forEach(btn=>btn.addEventListener('click',()=>{state.group=Number(btn.dataset.group); state.quiz=null; localStorage.setItem('rd_group_v2',state.group); renderQuizStart();}));
  $('startQuiz').addEventListener('click',startQuiz);
}
function startQuiz(){ const s=currentSection(); const all=buildAllQuestions(s); const start=(state.group-1)*GROUP_SIZE; state.quiz={questions:all.slice(start,start+GROUP_SIZE), index:0, correct:0, finished:false}; state.answered=false; renderQuiz(); }
function renderQuiz(){
  if(!state.quiz){ renderQuizStart(); return; }
  const s=currentSection(); const q=state.quiz;
  if(q.finished){ const score=Math.round(q.correct/q.questions.length*100); saveGroupProgress(s.id,state.group,score); renderStats(); renderSectionList(); $('quizCard').innerHTML=`<div class="card-head"><p class="eyebrow">${t('groupComplete')}</p><h3>${sectionTitle(s)}</h3></div><div class="card-body score-big"><b>${score}%</b><p>${q.correct}/${q.questions.length} - ${score>=PASS_SCORE?t('passed'):t('notPassed')}</p><div class="actions"><button class="primary" id="restartQuiz">${t('restart')}</button><button class="secondary" id="backGroups">${t('chooseGroup')}</button></div></div>`; $('restartQuiz').addEventListener('click',startQuiz); $('backGroups').addEventListener('click',()=>{state.quiz=null; renderQuizStart();}); return; }
  const current=q.questions[q.index]; const pct=Math.round(q.index/q.questions.length*100);
  $('quizCard').innerHTML=`<div class="card-head"><p class="eyebrow">${t('plan')} - ${state.group}/${groupsFor(s)}</p><h3>${t('questions')} ${q.index+1}/${q.questions.length}</h3><div class="progress"><div class="bar" style="width:${pct}%"></div></div></div><div class="card-body"><div class="question">${current.text}</div><div class="options">${current.options.map((o,i)=>`<button class="option" data-option="${i}">${o.label}</button>`).join('')}</div><div id="feedbackBox"></div></div>`;
  document.querySelectorAll('[data-option]').forEach(btn=>btn.addEventListener('click',()=>answer(Number(btn.dataset.option))));
}
function answer(i){ if(state.answered)return; state.answered=true; const q=state.quiz; const cur=q.questions[q.index]; const selected=cur.options[i]; if(selected.correct) q.correct++; document.querySelectorAll('[data-option]').forEach((btn,idx)=>{const opt=cur.options[idx]; if(opt.correct)btn.classList.add('correct'); if(idx===i&&!opt.correct)btn.classList.add('wrong');}); $('feedbackBox').innerHTML=`<div class="feedback"><b>${selected.correct?t('correct'):t('wrong')}.</b><br>${cur.explanation}</div><div class="actions"><button class="primary" id="nextQ">${q.index+1>=q.questions.length?t('finish'):t('next')}</button></div>`; $('nextQ').addEventListener('click',()=>{q.index++; state.answered=false; if(q.index>=q.questions.length)q.finished=true; renderQuiz();}); }
function renderAll(){ renderI18n(); renderStats(); renderSectionList(); renderLesson(); renderQuiz(); }
$('languageSelect').value=state.lang; $('languageSelect').addEventListener('change',e=>{state.lang=e.target.value;localStorage.setItem('rd_lang_v2',state.lang);state.quiz=null;renderAll();});
$('sectionSearch').addEventListener('input',renderSectionList); $('menuBtn').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
$('resetProgress').addEventListener('click',()=>{ if(confirm(t('confirmReset'))){ localStorage.removeItem('rd_progress_v2'); renderAll(); }});
renderAll();
