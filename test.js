const DATA = window.TRAINING_DATA || [];
const params = new URLSearchParams(location.search);
const id = Number(params.get('id') || 1);
const lesson = DATA.find(x=>x.id===id) || DATA[0];
const langSelect = document.getElementById('langSelect');
langSelect.value = localStorage.getItem('gj_lang') || 'uz';
langSelect.addEventListener('change', () => { localStorage.setItem('gj_lang', langSelect.value); render(); });
let answers = {};
function t(obj){ return obj?.[langSelect.value] || obj?.uz || ''; }
function render(){
  answers = {};
  const lang=langSelect.value;
  const qs=lesson.questions || [];
  document.getElementById('testContent').innerHTML = `
    <div class="lesson-head"><span class="badge big">${lesson.id}</span><div><h1>${t(lesson.title)}</h1><p class="source">15 ta nazorat savoli</p></div></div>
    <form id="quizForm">${qs.map((q,i)=>{
      const lq=q.lang?.[lang] || q.lang?.uz;
      return `<div class="question" data-i="${i}"><h3>${i+1}. ${lq.question}</h3>${lq.options.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}"> <span>${o}</span></label>`).join('')}<p class="explain" hidden></p></div>`;
    }).join('')}<button type="submit" class="btn submit">Natijani tekshirish</button></form><div id="result"></div>`;
  document.getElementById('quizForm').addEventListener('submit', check);
}
function check(e){
  e.preventDefault();
  const lang=langSelect.value;
  const qs=lesson.questions || [];
  let correct=0;
  qs.forEach((q,i)=>{
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    const box = document.querySelector(`.question[data-i="${i}"]`);
    const lq=q.lang?.[lang] || q.lang?.uz;
    const exp=box.querySelector('.explain');
    if(selected && Number(selected.value)===lq.answer){ correct++; box.classList.add('ok'); box.classList.remove('bad'); }
    else { box.classList.add('bad'); box.classList.remove('ok'); }
    exp.hidden=false; exp.textContent = `${lang==='ru'?'Правильный ответ':(lang==='uzc'?'Тўғри жавоб':'To‘g‘ri javob')}: ${lq.options[lq.answer]}. ${lq.explanation||''}`;
  });
  const percent=Math.round(correct/qs.length*100);
  localStorage.setItem(`gj_score_${lesson.id}`, String(percent));
  document.getElementById('result').innerHTML = `<div class="result ${percent>=85?'ok':'bad'}"><h2>${percent}%</h2><p>${correct}/${qs.length} to‘g‘ri javob</p><a class="btn" href="index.html">Bo‘limlarga qaytish</a></div>`;
  window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
}
render();
