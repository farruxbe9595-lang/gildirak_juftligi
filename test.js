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
let group = Number(qs('group') || localStorage.getItem('rd_group_v5') || 1);
let quiz=null, answered=false;
function wrongPool(){ return lang==='ru' ? ['продолжить без проверки','оценить только визуально','оформить документ позже','игнорировать маркировку','использовать неповеренный инструмент','не сверять с РД'] : ['tekshirmasdan davom ettirish','faqat ko‘z bilan baholash','hujjatni keyin to‘ldirish','markirovkani tekshirmaslik','qiyoslanmagan asbobdan foydalanish','RD bilan solishtirmaslik'].map(L); }
const stems={uz:[['main','{topic} bo‘yicha asosiy talab nimadan iborat?'],['risk','{topic} bo‘yicha qaysi xato eng xavfli?'],['action','{topic} bo‘yicha xodimning to‘g‘ri harakati qaysi?'],['main','{section} bo‘limida {topic} nima uchun o‘rganiladi?'],['action','Ishlab chiqarishda {topic} bo‘yicha qaror qabul qilishdan oldin nima qilinadi?'],['risk','Qaysi javob {topic} bo‘yicha noto‘g‘ri ish yuritishni bildiradi?']],ru:[['main','Какое основное требование относится к теме «{topic}»?'],['risk','Какая ошибка наиболее опасна по теме «{topic}»?'],['action','Какое действие работника является правильным по теме «{topic}»?'],['main','Зачем в разделе «{section}» изучается тема «{topic}»?'],['action','Что нужно сделать перед принятием производственного решения по теме «{topic}»?'],['risk','Какой вариант означает неправильную работу по теме «{topic}»?']]};
function shuffle(a){const arr=a.slice();for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr;}
function makeQuestion(idx){ const sub=section.subtopics[idx%section.subtopics.length]; const st=(lang==='ru'?stems.ru:stems.uz)[idx%(lang==='ru'?stems.ru:stems.uz).length]; const topic=subName(sub); const qtext=(st[1].replace('{topic}',topic).replace('{section}',title(section))); let correct=st[0]==='risk'?subRisk(sub):st[0]==='action'?subAction(sub):subMain(sub); const opts=shuffle([correct,...shuffle(wrongPool()).slice(0,3)]).map(x=>({label:x,correct:x===correct})); return {text:qtext, options:opts, explanation:`${i18n('Izoh','Пояснение')}: ${subMain(sub)}. ${i18n('To‘g‘ri harakat','Правильное действие')}: ${subAction(sub)}.`}; }
function allQuestions(){ return Array.from({length:section.target},(_,i)=>makeQuestion(i)); }
function groupButtons(){ const p=progress(); return `<div class="group-list">${Array.from({length:groupsFor(section)},(_,i)=>{const n=i+1; const pr=p[`${section.id}.${n}`]; return `<button class="group-btn ${n===group?'active':''}" data-group="${n}">${n}${pr?.passed?' ✓':''}</button>`}).join('')}</div>`; }
function renderStart(){ const from=(group-1)*GROUP_SIZE+1, to=Math.min(group*GROUP_SIZE,section.target); $('testBody').innerHTML=`<h4>${esc(i18n('Guruhni tanlang','Выберите блок'))}</h4>${groupButtons()}<div class="quiz-box"><b>${GROUP_SIZE} ${esc(i18n('savolli guruh','вопросов в блоке'))} ${group}</b><p>${from}-${to} / ${section.target}. ${esc(i18n('Test savollari bo‘limdagi mikro-mavzular bo‘yicha tuzilgan. Dars oynasidagi RD sahifalarini o‘qib, keyin testni boshlang.','Вопросы составлены по микротемам раздела. Сначала изучите страницы РД на странице урока, затем начинайте тест.'))}</p><div class="card-actions"><button class="btn primary" id="startQuiz">${esc(i18n('Testni boshlash','Начать тест'))}</button><a class="btn secondary" href="lesson.html?section=${section.id}">${esc(i18n('Dars oynasi','Страница урока'))}</a></div></div>`; document.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{group=Number(b.dataset.group);localStorage.setItem('rd_group_v5',group);quiz=null;renderStart();}); $('startQuiz').onclick=startQuiz; }
function startQuiz(){ const qs=allQuestions(); const start=(group-1)*GROUP_SIZE; quiz={questions:qs.slice(start,start+GROUP_SIZE),index:0,correct:0,finished:false}; answered=false; renderQuiz(); }
function renderQuiz(){ if(!quiz){ renderStart(); return; } if(quiz.finished){ const score=Math.round(quiz.correct/quiz.questions.length*100); saveProgress(section.id,group,score); $('testBody').innerHTML=`<div class="score-big"><b>${score}%</b><p>${quiz.correct}/${quiz.questions.length} - ${score>=PASS_SCORE?i18n('O‘tdi','Зачет'):i18n('Qayta o‘qish kerak','Нужно повторить')}</p><div class="card-actions" style="justify-content:center"><button class="btn primary" id="restartQuiz">${esc(i18n('Qayta ishlash','Повторить'))}</button><button class="btn secondary" id="backGroups">${esc(i18n('Guruhlar','Блоки'))}</button></div></div>`; $('restartQuiz').onclick=startQuiz; $('backGroups').onclick=()=>{quiz=null;renderStart();}; return; } const q=quiz.questions[quiz.index]; const pct=Math.round(quiz.index/quiz.questions.length*100); $('testBody').innerHTML=`<div class="quiz-box"><p class="eyebrow">${esc(i18n('Savol','Вопрос'))} ${quiz.index+1}/${quiz.questions.length}</p><div class="progress"><div class="bar" style="width:${pct}%"></div></div><div class="question">${esc(q.text)}</div><div class="options">${q.options.map((o,i)=>`<button class="option" data-option="${i}">${esc(o.label)}</button>`).join('')}</div><div id="feedbackBox"></div></div>`; document.querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>answer(Number(b.dataset.option))); }
function answer(i){ if(answered)return; answered=true; const q=quiz.questions[quiz.index], selected=q.options[i]; if(selected.correct) quiz.correct++; document.querySelectorAll('[data-option]').forEach((b,idx)=>{const o=q.options[idx]; if(o.correct)b.classList.add('correct'); if(idx===i&&!o.correct)b.classList.add('wrong');}); $('feedbackBox').innerHTML=`<div class="feedback"><b>${selected.correct?i18n('To‘g‘ri','Верно'):i18n('Noto‘g‘ri','Неверно')}.</b><br>${esc(q.explanation)}</div><div class="card-actions"><button class="btn primary" id="nextQ">${esc(quiz.index+1>=quiz.questions.length?i18n('Yakunlash','Завершить'):i18n('Keyingi savol','Следующий вопрос'))}</button></div>`; $('nextQ').onclick=()=>{quiz.index++; answered=false; if(quiz.index>=quiz.questions.length)quiz.finished=true; renderQuiz();}; }
function render(){ renderLanguage(); renderSectionNav(section.id); bindMenu(); $('pageTitle').textContent=`${section.id}. ${title(section)}`; $('testHead').innerHTML=`<p class="eyebrow">${esc(i18n('Test oynasi','Страница теста'))}</p><h3>${section.id}. ${esc(title(section))}</h3><div class="pill-row"><span class="pill">RD: ${section.pages}</span><span class="pill">${section.target} ${esc(i18n('test savol','тестовых вопросов'))}</span><span class="pill">${groupsFor(section)} ${esc(i18n('guruh','блоков'))}</span></div>`; $('backHome').textContent=i18n('Bosh sahifa','Главная'); renderStart(); }
render();
