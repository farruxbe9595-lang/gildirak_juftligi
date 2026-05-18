const DATA = window.TRAINING_DATA || [];
const params = new URLSearchParams(location.search);
const id = Number(params.get('id') || 1);
const lesson = DATA.find(x => x.id === id) || DATA[0];
const langSelect = document.getElementById('langSelect');

langSelect.value = localStorage.getItem('gj_lang') || 'uz';
langSelect.addEventListener('change', () => {
  localStorage.setItem('gj_lang', langSelect.value);
  render();
});

let currentQuiz = [];

function t(obj) {
  return obj?.[langSelect.value] || obj?.uz || '';
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildQuiz() {
  const lang = langSelect.value;
  const questions = lesson.questions || [];

  currentQuiz = shuffleArray(questions).map((q, originalQuestionIndex) => {
    const lq = q.lang?.[lang] || q.lang?.uz;
    const correctIndex = Number(lq.answer ?? 0);

    const options = (lq.options || []).map((text, index) => ({
      text,
      correct: index === correctIndex,
    }));

    return {
      originalQuestionIndex,
      question: lq.question,
      explanation: lq.explanation || '',
      options: shuffleArray(options),
    };
  });
}

function render() {
  buildQuiz();

  document.getElementById('testContent').innerHTML = `
    <div class="lesson-head">
      <span class="badge big">${lesson.id}</span>
      <div>
        <h1>${t(lesson.title)}</h1>
        <p class="source">${currentQuiz.length} ta nazorat savoli</p>
      </div>
    </div>
    <form id="quizForm">
      ${currentQuiz.map((q, i) => `
        <div class="question" data-i="${i}">
          <h3>${i + 1}. ${q.question}</h3>
          ${q.options.map((o, j) => `
            <label>
              <input type="radio" name="q${i}" value="${j}">
              <span>${o.text}</span>
            </label>
          `).join('')}
          <p class="explain" hidden></p>
        </div>
      `).join('')}
      <button type="submit" class="btn submit">Natijani tekshirish</button>
    </form>
    <div id="result"></div>
  `;

  document.getElementById('quizForm').addEventListener('submit', check);
}

function check(e) {
  e.preventDefault();

  const lang = langSelect.value;
  let correct = 0;

  currentQuiz.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    const box = document.querySelector(`.question[data-i="${i}"]`);
    const exp = box.querySelector('.explain');
    const selectedIndex = selected ? Number(selected.value) : -1;
    const isCorrect = selectedIndex >= 0 && q.options[selectedIndex]?.correct === true;
    const correctOption = q.options.find(o => o.correct);

    if (isCorrect) {
      correct++;
      box.classList.add('ok');
      box.classList.remove('bad');
    } else {
      box.classList.add('bad');
      box.classList.remove('ok');
    }

    exp.hidden = false;
    exp.textContent = `${lang === 'ru' ? 'Правильный ответ' : (lang === 'uzc' ? 'Тўғри жавоб' : 'To‘g‘ri javob')}: ${correctOption?.text || ''}. ${q.explanation}`;
  });

  const percent = currentQuiz.length ? Math.round(correct / currentQuiz.length * 100) : 0;
  localStorage.setItem(`gj_score_${lesson.id}`, String(percent));

  document.getElementById('result').innerHTML = `
    <div class="result ${percent >= 85 ? 'ok' : 'bad'}">
      <h2>${percent}%</h2>
      <p>${correct}/${currentQuiz.length} to‘g‘ri javob</p>
      <a class="btn" href="index.html">Bo‘limlarga qaytish</a>
    </div>
  `;

  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

render();
