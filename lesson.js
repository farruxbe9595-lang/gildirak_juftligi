const DATA = window.TRAINING_DATA || [];
const params = new URLSearchParams(location.search);
const id = Number(params.get('id') || 1);
const lesson = DATA.find(x=>x.id===id) || DATA[0];
const langSelect = document.getElementById('langSelect');
langSelect.value = localStorage.getItem('gj_lang') || 'uz';
langSelect.addEventListener('change', () => { localStorage.setItem('gj_lang', langSelect.value); render(); });
function t(obj){ return obj?.[langSelect.value] || obj?.uz || ''; }
function tableHtml(tbl){
  const cols = t(tbl.columns) || tbl.columns?.uz || [];
  return `<section class="block"><h2>${t(tbl.title)}</h2><div class="table-scroll"><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${(tbl.rows||[]).map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}
function listHtml(title, items){ return `<section class="block"><h2>${title}</h2><ol>${items.map(x=>`<li>${x}</li>`).join('')}</ol></section>`; }
function render(){
  const lang=langSelect.value;
  const paras = lesson.lesson?.[lang] || lesson.lesson?.uz || [];
  const checklist = lesson.checklist?.[lang] || lesson.checklist?.uz || [];
  const mistakes = lesson.mistakes?.[lang] || lesson.mistakes?.uz || [];
  document.title = t(lesson.title);
  document.getElementById('lessonContent').innerHTML = `
    <div class="lesson-head"><span class="badge big">${lesson.id}</span><div><h1>${t(lesson.title)}</h1><p class="source">${lesson.source}. Sahifalar: ${lesson.pages || '-'}</p></div></div>
    <section class="block prose">${paras.map(p=> /^\d+[\.-]/.test(p) || p.length<90 ? `<h2>${p}</h2>` : `<p>${p}</p>`).join('')}</section>
    ${(lesson.tables||[]).map(tableHtml).join('')}
    ${listHtml(lang==='ru'?'Практический порядок контроля':(lang==='uzc'?'Амалий назорат тартиби':'Amaliy nazorat tartibi'), checklist)}
    ${listHtml(lang==='ru'?'Типичные ошибки':(lang==='uzc'?'Кўп учрайдиган хатолар':'Ko‘p uchraydigan xatolar'), mistakes)}
    <div class="actions bottom"><a class="btn" href="test.html?id=${lesson.id}">${lang==='ru'?'Перейти к тесту':(lang==='uzc'?'Тестга ўтиш':'Testga o‘tish')}</a></div>
  `;
}
render();
