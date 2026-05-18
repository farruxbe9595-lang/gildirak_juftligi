const DATA = window.TRAINING_DATA || [];
const langSelect = document.getElementById('langSelect');
const grid = document.getElementById('sectionGrid');
const stats = document.getElementById('stats');
const savedLang = localStorage.getItem('gj_lang') || 'uz';
langSelect.value = savedLang;
langSelect.addEventListener('change', () => { localStorage.setItem('gj_lang', langSelect.value); render(); });
document.getElementById('resetProgress')?.addEventListener('click', () => { if(confirm('Progress tozalansinmi?')) { Object.keys(localStorage).filter(k=>k.startsWith('gj_score_')).forEach(k=>localStorage.removeItem(k)); render(); }});
function t(obj){ return obj?.[langSelect.value] || obj?.uz || ''; }
function score(id){ return Number(localStorage.getItem(`gj_score_${id}`) || 0); }
function render(){
  const lang=langSelect.value;
  const done = DATA.filter(s=>score(s.id)>=85).length;
  stats.innerHTML = `<strong>${done}/${DATA.length}</strong><span>bo‘lim yakunlangan</span>`;
  grid.innerHTML = DATA.map(s=>{
    const sc=score(s.id);
    const status=sc>=85?'passed':(sc>0?'started':'new');
    const label=status==='passed'?'O‘tildi':(status==='started'?'Boshlangan':'Yangi');
    return `<article class="card ${status}">
      <div class="badge">${s.id}</div>
      <h3>${t(s.title)}</h3>
      <p class="source">${s.source}</p>
      <div class="progress"><span style="width:${Math.min(sc,100)}%"></span></div>
      <p class="score">Natija: ${sc}% - ${label}</p>
      <div class="actions">
        <a href="lesson.html?id=${s.id}" class="btn">Darsni ochish</a>
        <a href="test.html?id=${s.id}" class="btn secondary">Test</a>
      </div>
    </article>`;
  }).join('');
}
render();
