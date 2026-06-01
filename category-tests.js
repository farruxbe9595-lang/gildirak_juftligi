const TEST_CATEGORIES = window.CATEGORY_TESTS || [];
const app = document.getElementById("categoryTestApp");

let selectedCategoryId = TEST_CATEGORIES[0]?.id || "";
let selectedCount = "20";
let activeCategory = null;
let activeQuiz = [];
let currentIndex = 0;
let answers = [];
let resultState = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shuffleArray(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getCategory(id) {
  return TEST_CATEGORIES.find((item) => item.id === id) || TEST_CATEGORIES[0] || null;
}

function getCountLabel(value, total) {
  if (value === "all") return `Barcha savollar (${total} ta)`;
  return `${value} ta savol`;
}

function getQuestionText(q) {
  return q.q || q.question || q.title || "";
}

function getQuestionExplanation(q) {
  return String(q.explanation || q.izoh || q.comment || q.source || q.note || "").trim();
}

function renderExplanation(explanation) {
  const clean = String(explanation || "")
    .replace(/^Изоҳ:\s*/i, "")
    .replace(/^Izoh:\s*/i, "")
    .trim();

  if (!clean) {
    return `
      <div class="answer-explanation" style="margin-top:12px;padding-top:12px;border-top:1px dashed rgba(2,132,199,.35);line-height:1.55;white-space:pre-line;">
        <b>Изоҳ / манба:</b> Бу савол учун изоҳ майдони топилмади.
      </div>
    `;
  }

  return `
    <div class="answer-explanation" style="margin-top:12px;padding-top:12px;border-top:1px dashed rgba(2,132,199,.35);line-height:1.55;white-space:pre-line;">
      <b>Изоҳ / манба:</b> ${escapeHtml(clean)}
    </div>
  `;
}


function scrollToStartControls() {
  const target = document.getElementById("startCategoryTest") || document.querySelector(".cat-actions") || document.querySelector(".count-box");
  if (!target) return;
  window.setTimeout(() => {
    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, 80);
}

function renderStart() {
  activeCategory = null;
  activeQuiz = [];
  currentIndex = 0;
  answers = [];
  resultState = null;

  if (!TEST_CATEGORIES.length) {
    app.innerHTML = `<div class="lesson-card"><h2>Test ma’lumotlari topilmadi</h2><p>data/category-tests-data.js faylini tekshiring.</p></div>`;
    return;
  }

  const categoriesHtml = TEST_CATEGORIES.map((cat) => {
    const checked = cat.id === selectedCategoryId ? "checked" : "";
    return `
      <label class="category-card ${checked ? "active" : ""}">
        <input type="radio" name="category" value="${escapeHtml(cat.id)}" ${checked} />
        <span class="category-title">${escapeHtml(cat.title)}</span>
        <span class="category-count">${cat.questions.length} ta savol</span>
        <span class="category-source">${escapeHtml(cat.source)}</span>
      </label>
    `;
  }).join("");

  app.innerHTML = `
    <section class="lesson-card cat-panel">
      <div class="cat-panel-head">
        <div>
          <span class="mini-label">Mustaqil test oynasi</span>
          <h2>Kategoriyani tanlang</h2>
          <p>
            Bu testlar alohida ishlaydi: darslar progressiga, 30 bo‘limdagi natijalarga va
            asosiy o‘quv kartalariga ta’sir qilmaydi.
          </p>
        </div>
      </div>
      <div class="category-grid">${categoriesHtml}</div>
      <div class="count-box">
        <h3>Savollar sonini tanlang</h3>
        <div class="count-options">
          <label><input type="radio" name="count" value="20" ${selectedCount === "20" ? "checked" : ""}> 20 ta savol</label>
          <label><input type="radio" name="count" value="30" ${selectedCount === "30" ? "checked" : ""}> 30 ta savol</label>
          <label><input type="radio" name="count" value="all" ${selectedCount === "all" ? "checked" : ""}> Barcha savollar</label>
        </div>
      </div>
      <div class="actions cat-actions">
        <button class="btn" type="button" id="startCategoryTest">Testni boshlash</button>
        <a class="btn secondary" href="index.html">Bosh sahifaga qaytish</a>
      </div>
    </section>
  `;

  document.querySelectorAll('input[name="category"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      selectedCategoryId = event.target.value;
      document.querySelectorAll(".category-card").forEach((card) => card.classList.remove("active"));
      event.target.closest(".category-card")?.classList.add("active");
      scrollToStartControls();
    });
  });

  document.querySelectorAll('input[name="count"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      selectedCount = event.target.value;
    });
  });

  document.getElementById("startCategoryTest")?.addEventListener("click", startTest);
}

function startTest() {
  activeCategory = getCategory(selectedCategoryId);
  if (!activeCategory) {
    alert("Kategoriya topilmadi.");
    return;
  }

  const total = activeCategory.questions.length;
  const limit = selectedCount === "all" ? total : Math.min(Number(selectedCount), total);

  activeQuiz = shuffleArray(activeCategory.questions).slice(0, limit).map((q) => {
    const options = shuffleArray((q.options || []).map((text, index) => ({
      text,
      correct: index === Number(q.answer),
    })));

    return {
      number: q.number,
      originalNumber: q.originalNumber,
      question: getQuestionText(q),
      explanation: getQuestionExplanation(q),
      options,
    };
  });

  currentIndex = 0;
  answers = Array(activeQuiz.length).fill(null);
  renderQuestion();
}

function renderQuestion() {
  const q = activeQuiz[currentIndex];
  const answered = answers[currentIndex];
  const total = activeQuiz.length;
  const progress = Math.round((currentIndex / total) * 100);

  const optionsHtml = q.options.map((option, index) => {
    let cls = "option-btn";
    if (answered) {
      if (option.correct) cls += " correct";
      if (answered.selectedIndex === index && !option.correct) cls += " wrong";
    }
    const disabled = answered ? "disabled" : "";
    return `
      <button class="${cls}" type="button" data-option="${index}" ${disabled}>
        <span>${String.fromCharCode(65 + index)})</span>
        <strong>${escapeHtml(option.text)}</strong>
      </button>
    `;
  }).join("");

  const correctOption = q.options.find((option) => option.correct);
  const feedback = answered ? `
    <div class="answer-feedback ${answered.isCorrect ? "good" : "bad"}">
      <strong>${answered.isCorrect ? "To‘g‘ri javob tanlandi." : "Noto‘g‘ri javob tanlandi."}</strong>
      <p>To‘g‘ri javob: <b>${escapeHtml(correctOption?.text || "")}</b></p>
      ${renderExplanation(q.explanation)}
    </div>
  ` : `
    <div class="answer-feedback neutral">
      Javobni belgilang. Javob tanlanmaguncha keyingi savolga o‘tish tugmasi ishlamaydi.
    </div>
  `;

  app.innerHTML = `
    <section class="lesson-card cat-question-card">
      <div class="quiz-topline">
        <div>
          <span class="mini-label">${escapeHtml(activeCategory.title)}</span>
          <h2>${currentIndex + 1}/${total}-savol</h2>
        </div>
        <div class="quiz-pill">${getCountLabel(selectedCount, activeCategory.questions.length)}</div>
      </div>
      <div class="progress large"><span style="width:${progress}%"></span></div>
      <article class="cat-question">
        <h3>${escapeHtml(q.question)}</h3>
        <div class="option-list">${optionsHtml}</div>
        ${feedback}
      </article>
      <div class="actions cat-actions">
        <button class="btn secondary" type="button" id="backToCategories">Test sahifasiga qaytish</button>
        <button class="btn" type="button" id="nextQuestion" ${answered ? "" : "disabled"}>
          ${currentIndex === total - 1 ? "Tugatish" : "Keyingi savol"}
        </button>
      </div>
    </section>
  `;

  document.querySelectorAll(".option-btn").forEach((button) => {
    button.addEventListener("click", () => selectAnswer(Number(button.dataset.option)));
  });

  document.getElementById("nextQuestion")?.addEventListener("click", nextQuestion);
  document.getElementById("backToCategories")?.addEventListener("click", () => {
    if (confirm("Testdan chiqib, kategoriyalar oynasiga qaytasizmi?")) renderStart();
  });
}

function selectAnswer(selectedIndex) {
  if (answers[currentIndex]) return;
  const q = activeQuiz[currentIndex];
  const selected = q.options[selectedIndex];
  answers[currentIndex] = {
    selectedIndex,
    isCorrect: selected?.correct === true,
  };
  renderQuestion();
}

function nextQuestion() {
  if (!answers[currentIndex]) {
    alert("Avval javobni belgilang.");
    return;
  }

  if (currentIndex < activeQuiz.length - 1) {
    currentIndex += 1;
    renderQuestion();
    return;
  }

  finishTest();
}

function finishTest() {
  const correct = answers.filter((item) => item?.isCorrect).length;
  const total = activeQuiz.length;
  const percent = total ? Math.round((correct / total) * 100) : 0;
  resultState = { correct, total, percent };

  app.innerHTML = `
    <section class="lesson-card result-card ${percent >= 75 ? "ok" : "bad"}">
      <span class="mini-label">Test yakunlandi</span>
      <h2>${percent}%</h2>
      <p><b>${correct}/${total}</b> ta javob to‘g‘ri belgilandi.</p>
      <p>Kategoriya: <b>${escapeHtml(activeCategory.title)}</b></p>
      <div class="result-summary-grid">
        <div><strong>${total}</strong><span>Jami savol</span></div>
        <div><strong>${correct}</strong><span>To‘g‘ri</span></div>
        <div><strong>${total - correct}</strong><span>Noto‘g‘ri</span></div>
      </div>
      <div class="actions cat-actions result-actions">
        <a class="btn" href="index.html">Bosh sahifaga qaytish</a>
        <button class="btn secondary" type="button" id="goCategories">Test sahifasiga qaytish</button>
        <button class="btn secondary" type="button" id="restartSame">Qayta ishlash</button>
      </div>
    </section>
  `;

  document.getElementById("goCategories")?.addEventListener("click", renderStart);
  document.getElementById("restartSame")?.addEventListener("click", startTest);
}

renderStart();
