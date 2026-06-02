(() => {
  "use strict";

  const PROFILE_KEY = "gj_ranked_profile_v1";
  const ATTEMPTS_KEY = "gj_ranked_attempts_v1";
  const ACTIVE_SESSION_KEY = "gj_ranked_active_session_v1";
  const MAX_WRONG_ANSWERS = 3;

  const app = document.getElementById("rankedApp");
  const categories = Array.isArray(window.CATEGORY_TESTS) ? window.CATEGORY_TESTS : [];
  const config = window.SUPABASE_CONFIG || { enabled: false };

  let supabaseClient = null;
  let profile = null;
  let attempts = [];
  let quiz = [];
  let answers = [];
  let currentIndex = 0;
  let startedAt = null;
  let timerId = null;
  let finishInProgress = false;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function legacyNormalizePhone(value) {
    return String(value || "").replace(/[^0-9+]/g, "").replace(/^00/, "+").trim();
  }

  function normalizePhone(value) {
    const raw = legacyNormalizePhone(value);
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";

    // O‘zbekiston raqamlari uchun qulaylik:
    // 941085696        -> +998941085696
    // 0941085696       -> +998941085696
    // 998941085696     -> +998941085696
    // +998941085696    -> +998941085696
    if (digits.length === 9) return `+998${digits}`;
    if (digits.length === 10 && digits.startsWith("0")) return `+998${digits.slice(1)}`;
    if (digits.length === 12 && digits.startsWith("998")) return `+${digits}`;
    if (digits.length === 13 && digits.startsWith("998")) return `+${digits.slice(0, 12)}`;

    return raw.startsWith("+") ? `+${digits}` : digits;
  }

  function phoneSearchVariants(value) {
    const normalized = normalizePhone(value);
    const legacy = legacyNormalizePhone(value);
    const digits = legacy.replace(/\D/g, "");
    const variants = [normalized, legacy, digits];
    if (normalized.startsWith("+998")) {
      variants.push(normalized.slice(4));
      variants.push(`998${normalized.slice(4)}`);
      variants.push(`0${normalized.slice(4)}`);
    }
    return [...new Set(variants.filter(Boolean))];
  }

  function uid() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function pinHash(phone, pin) {
    return sha256(`${normalizePhone(phone)}|${String(pin || "").trim()}|gildirak_ranked_v1`);
  }

  async function pinHashVariants(phone, pin) {
    const pinValue = String(pin || "").trim();
    const variants = phoneSearchVariants(phone);
    const hashes = await Promise.all(variants.map((item) => sha256(`${item}|${pinValue}|gildirak_ranked_v1`)));
    return [...new Set(hashes)];
  }

  function saveLocalProfile(data) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
    localStorage.setItem(ACTIVE_SESSION_KEY, "1");
  }

  function loadLocalProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function clearLocalSession() {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    profile = null;
    quiz = [];
    answers = [];
    currentIndex = 0;
    finishInProgress = false;
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function logoutProfile() {
    const ok = window.confirm("Profildan chiqasizmi? Reyting natijalari saqlanib qoladi, faqat shu qurilmadagi kirish sessiyasi tozalanadi.");
    if (!ok) return;
    clearLocalSession();
    renderProfileForm("create", "Profildan chiqildi. Endi boshqa xodim telefon raqam va PIN bilan kirishi mumkin.");
  }

  function saveLocalAttempts(list) {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(getBestAttempts(list)));
  }

  function loadLocalAttempts() {
    try {
      const raw = localStorage.getItem(ATTEMPTS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function isSupabaseReady() {
    return Boolean(config.enabled && config.url && config.anonKey && window.supabase);
  }

  function getSupabase() {
    if (!isSupabaseReady()) return null;
    if (!supabaseClient) {
      supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    }
    return supabaseClient;
  }

  async function dbGetProfileByPhone(phone) {
    const db = getSupabase();
    if (!db) return null;
    const variants = phoneSearchVariants(phone);
    const { data, error } = await db
      .from(config.tables?.profiles || "ranked_profiles")
      .select("*")
      .in("phone", variants)
      .limit(1);
    if (error) throw error;
    return Array.isArray(data) && data.length ? data[0] : null;
  }

  async function dbSaveProfile(data) {
    const db = getSupabase();
    if (!db) return data;
    const payload = {
      id: data.id,
      full_name: data.fullName,
      company: data.company,
      department: data.department,
      position: data.position,
      phone: normalizePhone(data.phone),
      pin_hash: data.pinHash,
      avatar_data: data.avatarData || null,
      updated_at: new Date().toISOString()
    };
    const { data: saved, error } = await db
      .from(config.tables?.profiles || "ranked_profiles")
      .upsert(payload, { onConflict: "phone" })
      .select("*")
      .single();
    if (error) throw error;

    await dbUpdateAttemptProfileInfo(saved);
    return dbProfileToLocal(saved);
  }

  async function dbUpdateAttemptProfileInfo(savedProfile) {
    const db = getSupabase();
    if (!db || !savedProfile?.phone) return;
    await db
      .from(config.tables?.attempts || "ranked_attempts")
      .update({
        profile_id: savedProfile.id,
        full_name: savedProfile.full_name,
        company: savedProfile.company,
        department: savedProfile.department,
        position: savedProfile.position
      })
      .eq("phone", normalizePhone(savedProfile.phone));
  }

  function dbProfileToLocal(row) {
    return {
      id: row.id,
      fullName: row.full_name,
      company: row.company,
      department: row.department,
      position: row.position,
      phone: row.phone,
      pinHash: row.pin_hash,
      avatarData: row.avatar_data || "",
      synced: true,
      updatedAt: row.updated_at || new Date().toISOString()
    };
  }

  function dbAttemptToLocal(row) {
    return {
      id: row.id,
      profileId: row.profile_id,
      phone: row.phone,
      fullName: row.full_name,
      company: row.company,
      department: row.department,
      position: row.position,
      total: row.total_questions,
      correct: row.correct_count,
      percent: row.percent,
      durationSeconds: row.duration_seconds,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      source: row.source || "supabase"
    };
  }

  function attemptToDbPayload(attempt, id = attempt.id) {
    return {
      id,
      profile_id: attempt.profileId,
      phone: normalizePhone(attempt.phone),
      full_name: attempt.fullName,
      company: attempt.company,
      department: attempt.department,
      position: attempt.position,
      total_questions: attempt.total,
      correct_count: attempt.correct,
      percent: attempt.percent,
      duration_seconds: attempt.durationSeconds,
      started_at: attempt.startedAt,
      finished_at: attempt.finishedAt,
      source: "ranked-general-test"
    };
  }

  async function dbLoadAttempts() {
    const db = getSupabase();
    if (!db) return getBestAttempts(loadLocalAttempts());
    const { data, error } = await db
      .from(config.tables?.attempts || "ranked_attempts")
      .select("*")
      .order("correct_count", { ascending: false })
      .order("duration_seconds", { ascending: true })
      .order("finished_at", { ascending: true })
      .limit(1000);
    if (error) throw error;
    return getBestAttempts((data || []).map(dbAttemptToLocal));
  }

  async function dbSaveAttempt(attempt) {
    const db = getSupabase();
    if (!db) return { saved: false, improved: false, local: true };
    const table = config.tables?.attempts || "ranked_attempts";
    const phone = normalizePhone(attempt.phone);

    const { data: existingRows, error: loadError } = await db
      .from(table)
      .select("*")
      .eq("phone", phone);
    if (loadError) throw loadError;

    const existingAttempts = (existingRows || []).map(dbAttemptToLocal);
    const bestExisting = existingAttempts.length
      ? existingAttempts.reduce((best, item) => (isBetterAttempt(item, best) ? item : best), existingAttempts[0])
      : null;

    if (bestExisting && existingRows.length > 1) {
      const idsToDelete = existingRows
        .filter((row) => row.id !== bestExisting.id)
        .map((row) => row.id);
      if (idsToDelete.length) await db.from(table).delete().in("id", idsToDelete);
    }

    if (!bestExisting) {
      const { error } = await db.from(table).insert(attemptToDbPayload(attempt));
      if (error) throw error;
      return { saved: true, improved: true, inserted: true };
    }

    if (isBetterAttempt(attempt, bestExisting)) {
      const { error } = await db
        .from(table)
        .update(attemptToDbPayload(attempt, bestExisting.id))
        .eq("id", bestExisting.id);
      if (error) throw error;
      return { saved: true, improved: true, updated: true };
    }

    // Natija yaxshilanmasa ham profil ma’lumotlari reytingda yangilanib tursin.
    const { error } = await db
      .from(table)
      .update({
        profile_id: attempt.profileId,
        full_name: attempt.fullName,
        company: attempt.company,
        department: attempt.department,
        position: attempt.position
      })
      .eq("id", bestExisting.id);
    if (error) throw error;
    return { saved: true, improved: false, kept: true };
  }

  function formatTime(seconds) {
    const s = Math.max(0, Number(seconds) || 0);
    const m = Math.floor(s / 60);
    const r = s % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const mm = m % 60;
      return `${h}:${String(mm).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function formatDate(value) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  }

  function initials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    return parts.slice(0, 2).map((x) => x[0]?.toUpperCase()).join("");
  }

  function shuffleArray(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function getQuestionText(q) {
    return q.q || q.question || q.title || "";
  }

  function getExplanation(q) {
    return String(q.explanation || q.izoh || q.comment || q.source || q.note || "").trim();
  }

  function buildPool() {
    const seen = new Set();
    const pool = [];
    categories.forEach((cat) => {
      (cat.questions || []).forEach((q, index) => {
        const question = getQuestionText(q).trim();
        const options = Array.isArray(q.options) ? q.options.filter((x) => String(x || "").trim()) : [];
        const answer = Number(q.answer);
        if (!question || options.length < 2 || Number.isNaN(answer) || !options[answer]) return;
        // Dublikatlarni javoblar tartibiga qarab emas, savol matni bo‘yicha tozalaymiz.
        // Sabab: bir xil savol turli toifalarda variantlari boshqa tartibda berilgan bo‘lishi mumkin.
        const key = question
          .toLowerCase()
          .replace(/[’‘`´]/g, "'")
          .replace(/\s+/g, " ")
          .replace(/[?？!！.。]+$/g, "")
          .trim();
        if (seen.has(key)) return;
        seen.add(key);
        pool.push({
          id: `${cat.id || "cat"}_${q.originalNumber || q.number || index + 1}`,
          categoryId: cat.id || "",
          categoryTitle: cat.title || "Test",
          number: q.number || index + 1,
          originalNumber: q.originalNumber || q.number || index + 1,
          question,
          options,
          answerIndex: answer,
          explanation: getExplanation(q)
        });
      });
    });
    return pool;
  }

  function isBetterAttempt(a, b) {
    if (!b) return true;
    if ((a.correct || 0) !== (b.correct || 0)) return (a.correct || 0) > (b.correct || 0);
    if (a.durationSeconds !== b.durationSeconds) return a.durationSeconds < b.durationSeconds;
    return new Date(a.finishedAt) < new Date(b.finishedAt);
  }

  function getBestAttempts(allAttempts = attempts) {
    const map = new Map();
    allAttempts.forEach((item) => {
      const key = normalizePhone(item.phone) || item.profileId || item.fullName;
      const prev = map.get(key);
      if (!prev || isBetterAttempt(item, prev)) map.set(key, item);
    });
    return [...map.values()].sort((a, b) => {
      if ((b.correct || 0) !== (a.correct || 0)) return (b.correct || 0) - (a.correct || 0);
      if (a.durationSeconds !== b.durationSeconds) return a.durationSeconds - b.durationSeconds;
      return new Date(a.finishedAt) - new Date(b.finishedAt);
    });
  }

  function upsertLocalBestAttempt(list, attempt) {
    const key = normalizePhone(attempt.phone) || attempt.profileId || attempt.fullName;
    const others = getBestAttempts(list).filter((item) => (normalizePhone(item.phone) || item.profileId || item.fullName) !== key);
    const previous = getBestAttempts(list).find((item) => (normalizePhone(item.phone) || item.profileId || item.fullName) === key);
    const improved = !previous || isBetterAttempt(attempt, previous);
    const next = improved ? attempt : previous;
    return { attempts: getBestAttempts([next, ...others]), improved };
  }

  function currentRank() {
    if (!profile) return null;
    const best = getBestAttempts();
    const key = normalizePhone(profile.phone) || profile.id;
    const index = best.findIndex((item) => (normalizePhone(item.phone) || item.profileId) === key);
    return index >= 0 ? index + 1 : null;
  }

  function myBestAttempt() {
    if (!profile) return null;
    const key = normalizePhone(profile.phone);
    return getBestAttempts(attempts).find((item) => normalizePhone(item.phone) === key || item.profileId === profile.id) || null;
  }

  function renderAvatar(data = profile) {
    if (data?.avatarData) return `<div class="avatar"><img src="${escapeHtml(data.avatarData)}" alt="Profil rasmi"></div>`;
    return `<div class="avatar">${escapeHtml(initials(data?.fullName))}</div>`;
  }

  async function readAvatar(file) {
    if (!file) return "";
    if (!file.type.startsWith("image/")) throw new Error("Faqat rasm fayli yuklash mumkin.");
    if (file.size > 700 * 1024) throw new Error("Rasm hajmi 700 KB dan oshmasin. Juda katta rasm saytni sekinlashtiradi.");
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Rasmni o‘qib bo‘lmadi."));
      reader.readAsDataURL(file);
    });
  }

  function localModeNotice() {
    if (isSupabaseReady()) return "";
    return `<div class="ranked-warning"><b>Hozir mahalliy rejim:</b> natijalar faqat shu telefon/kompyuter xotirasida saqlanadi. Supabase ulangandan keyin umumiy reyting hamma qurilmada bir xil ishlaydi.</div>`;
  }

  function setPageMode(mode) {
    document.body.classList.toggle("ranked-quiz-active", mode === "quiz" || mode === "result");
    document.body.classList.toggle("ranked-result-active", mode === "result");
  }

  function validatePin(pin, required = true) {
    const value = String(pin || "").trim();
    if (!value && !required) return "";
    if (!/^\d{4}$/.test(value)) throw new Error("PIN aniq 4 ta raqamdan iborat bo‘lishi kerak.");
    return value;
  }

  function renderLoginCreateView(message = "") {
    const remembered = loadLocalProfile();
    return `
      <section class="ranked-card auth-card unified-auth-card">
        <div class="auth-card-head compact-auth-head">
          <span class="auth-icon">👤</span>
          <div>
            <span class="mini-label">Profil</span>
            <h2>Yangi profil yoki kirish</h2>
            <p>Yangi xodim avval profil yaratadi. Oldin ro‘yxatdan o‘tgan xodim pastdan telefon raqam va PIN bilan kiradi.</p>
          </div>
        </div>
        ${message ? `<div class="ranked-note compact-note">${escapeHtml(message)}</div>` : ""}

        <div class="auth-section-title">
          <span class="auth-step">1</span>
          <div>
            <h3>Yangi profil ma’lumotlarini kiriting</h3>
            <p>Birinchi marta kirayotgan xodim uchun.</p>
          </div>
        </div>
        <form id="profileForm" class="auth-form compact-create-form">
          <div class="ranked-grid compact-profile-grid">
            <div class="ranked-field">
              <label for="fullName">Ism-familiya</label>
              <input id="fullName" name="fullName" placeholder="Masalan: Aliyev Alisher" autocomplete="name" required />
            </div>
            <div class="ranked-field">
              <label for="company">Korxona</label>
              <input id="company" name="company" placeholder="Masalan: VCHD-5" required />
            </div>
            <div class="ranked-field">
              <label for="department">Uchastka / bo‘lim</label>
              <input id="department" name="department" placeholder="Masalan: Tex otдел" required />
            </div>
            <div class="ranked-field">
              <label for="position">Lavozim</label>
              <input id="position" name="position" placeholder="Masalan: usta, brigadir" required />
            </div>
            <div class="ranked-field">
              <label for="phone">Telefon raqam</label>
              <input id="phone" name="phone" placeholder="941085696 yoki +998941085696" inputmode="tel" autocomplete="tel" required />
            </div>
            <div class="ranked-field">
              <label for="pin">4 xonali PIN</label>
              <input id="pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" placeholder="2580" autocomplete="new-password" required />
            </div>
            <div class="ranked-field avatar-compact-field">
              <label for="avatar">Profil rasmi</label>
              <input id="avatar" name="avatar" type="file" accept="image/*" />
            </div>
          </div>
          <div class="ranked-actions auth-actions compact-auth-actions">
            <button class="primary auth-main-btn" type="submit">Yangi profil yaratish</button>
          </div>
        </form>

        <div class="auth-divider"><span>Oldin ro‘yxatdan o‘tgan bo‘lsangiz</span></div>

        <form id="loginForm" class="auth-form compact-login-form">
          ${remembered?.phone ? `<div class="ranked-note compact-note">Bu qurilmada oxirgi profil: <b>${escapeHtml(remembered.fullName || remembered.phone)}</b></div>` : ""}
          <div class="ranked-grid one-line-grid compact-login-grid">
            <div class="ranked-field">
              <label for="loginPhone">Telefon raqam</label>
              <input id="loginPhone" name="phone" value="${escapeHtml(remembered?.phone || "")}" placeholder="941085696" inputmode="tel" autocomplete="tel" required />
            </div>
            <div class="ranked-field">
              <label for="loginPin">4 xonali PIN</label>
              <input id="loginPin" name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" placeholder="2580" autocomplete="current-password" required />
            </div>
            <div class="ranked-field login-submit-field">
              <label>&nbsp;</label>
              <button class="secondary auth-secondary-btn login-inline-btn" type="submit">Profilga kirish</button>
            </div>
          </div>
        </form>
      </section>
    `;
  }

  function renderEditProfileView(message = "") {
    const p = profile || {};
    return `
      <section class="ranked-card auth-card edit-card">
        <div class="auth-card-head">
          <span class="auth-icon">✏️</span>
          <div>
            <span class="mini-label">Profil ma’lumotlari</span>
            <h2>Profilni tahrirlash</h2>
            <p>Ma’lumotlaringizni yangilang. PIN maydonini bo‘sh qoldirsangiz, avvalgi PIN saqlanadi.</p>
          </div>
        </div>
        ${message ? `<div class="ranked-note">${escapeHtml(message)}</div>` : ""}
        <form id="profileForm" class="auth-form">
          <div class="ranked-grid">
            <div class="ranked-field">
              <label for="fullName">Ism-familiya</label>
              <input id="fullName" name="fullName" value="${escapeHtml(p.fullName || "")}" placeholder="Masalan: Aliyev Alisher" autocomplete="name" required />
            </div>
            <div class="ranked-field">
              <label for="company">Korxona</label>
              <input id="company" name="company" value="${escapeHtml(p.company || "")}" placeholder="Masalan: Andijon vagon deposi" required />
            </div>
            <div class="ranked-field">
              <label for="department">Uchastka / bo‘lim</label>
              <input id="department" name="department" value="${escapeHtml(p.department || "")}" placeholder="Masalan: g‘ildirak juftligi sexi" required />
            </div>
            <div class="ranked-field">
              <label for="position">Lavozim</label>
              <input id="position" name="position" value="${escapeHtml(p.position || "")}" placeholder="Masalan: chilangar, usta, brigadir" required />
            </div>
            <div class="ranked-field">
              <label for="phone">Telefon raqam</label>
              <input id="phone" name="phone" value="${escapeHtml(p.phone || "")}" placeholder="941085696 yoki +998941085696" inputmode="tel" autocomplete="tel" required />
            </div>
            <div class="ranked-field">
              <label for="pin">Yangi PIN</label>
              <input id="pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" placeholder="O‘zgarmasa bo‘sh qoldiring" autocomplete="new-password" />
            </div>
            <div class="ranked-field full-field">
              <label for="avatar">Profil rasmi</label>
              <input id="avatar" name="avatar" type="file" accept="image/*" />
            </div>
          </div>
          <div class="ranked-actions auth-actions">
            <button class="primary auth-main-btn" type="submit">Saqlash</button>
            <button id="cancelEdit" class="secondary auth-secondary-btn" type="button">Bekor qilish</button>
          </div>
        </form>
      </section>
    `;
  }

  function renderProfileForm(mode = "create", message = "") {
    setPageMode("profile");
    app.innerHTML = `
      <div class="ranked-dashboard-layout">
        <div class="ranked-main-column">
          ${mode === "edit" ? renderEditProfileView(message) : `
            ${localModeNotice()}
            ${renderLoginCreateView(message)}
          `}
        </div>
        <aside class="leaderboard-sidebar">
          ${renderLeaderboard()}
        </aside>
      </div>
    `;
    document.getElementById("loginForm")?.addEventListener("submit", submitLoginForm);
    document.getElementById("profileForm")?.addEventListener("submit", submitProfileForm);
    document.getElementById("cancelEdit")?.addEventListener("click", renderDashboard);
  }

  async function submitLoginForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Tekshirilmoqda...";
    try {
      const formData = new FormData(form);
      const phone = normalizePhone(formData.get("phone"));
      const pin = validatePin(formData.get("pin"), true);
      if (!phone) throw new Error("Telefon raqam kiriting.");
      const computedPinHash = await pinHash(phone, pin);
      const allowedPinHashes = await pinHashVariants(phone, pin);

      if (isSupabaseReady()) {
        const existing = await dbGetProfileByPhone(phone);
        if (!existing) throw new Error("Bu telefon raqam bo‘yicha profil topilmadi. Avval yangi profil yarating.");
        if (!allowedPinHashes.includes(existing.pin_hash)) throw new Error("PIN noto‘g‘ri kiritildi.");
        profile = dbProfileToLocal(existing);
        saveLocalProfile(profile);
        attempts = await dbLoadAttempts();
        renderDashboard();
        return;
      }

      const local = loadLocalProfile();
      if (!local || normalizePhone(local.phone) !== phone) {
        throw new Error("Profil bu qurilmada topilmadi. Umumiy kirish uchun Supabase ulanishi kerak yoki avval shu qurilmada profil yarating.");
      }
      if (local.pinHash !== computedPinHash) throw new Error("PIN noto‘g‘ri kiritildi.");
      profile = local;
      attempts = loadLocalAttempts();
      saveLocalProfile(profile);
      renderDashboard();
    } catch (error) {
      renderProfileForm("create", error.message || "Kirishda xatolik yuz berdi.");
    }
  }

  async function submitProfileForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type='submit']");
    const isEdit = Boolean(profile && form.closest(".edit-card"));
    submitButton.disabled = true;
    submitButton.textContent = isEdit ? "Saqlanmoqda..." : "Yaratilmoqda...";
    try {
      const formData = new FormData(form);
      const phone = normalizePhone(formData.get("phone"));
      const rawPin = String(formData.get("pin") || "").trim();
      const pin = validatePin(rawPin, !isEdit);
      const existingAvatar = isEdit ? (profile?.avatarData || "") : "";
      const avatarFile = formData.get("avatar");
      const avatarData = avatarFile && avatarFile.size ? await readAvatar(avatarFile) : existingAvatar;
      const computedPinHash = pin ? await pinHash(phone, pin) : profile?.pinHash;
      if (!computedPinHash) throw new Error("PIN kiriting.");

      const nextProfile = {
        id: isEdit ? (profile?.id || uid()) : uid(),
        fullName: String(formData.get("fullName") || "").trim(),
        company: String(formData.get("company") || "").trim(),
        department: String(formData.get("department") || "").trim(),
        position: String(formData.get("position") || "").trim(),
        phone,
        pinHash: computedPinHash,
        avatarData,
        updatedAt: new Date().toISOString()
      };

      if (!nextProfile.fullName || !nextProfile.company || !nextProfile.department || !nextProfile.position || !nextProfile.phone) {
        throw new Error("Barcha majburiy maydonlarni to‘ldiring.");
      }

      if (isSupabaseReady()) {
        const existing = await dbGetProfileByPhone(phone);
        if (!isEdit && existing?.id) {
          throw new Error("Bu telefon raqam oldin ro‘yxatdan o‘tgan. Ma’lumotlarni qayta to‘ldirmasdan yuqoridagi ‘Kirish’ bo‘limidan telefon va PIN bilan kiring.");
        }
        if (isEdit && existing?.id && existing.id !== profile?.id) {
          throw new Error("Bu telefon raqam boshqa profilga biriktirilgan.");
        }
        if (isEdit) nextProfile.id = profile.id;
        profile = await dbSaveProfile(nextProfile);
        attempts = await dbLoadAttempts();
      } else {
        const local = loadLocalProfile();
        if (!isEdit && local && normalizePhone(local.phone) === phone) {
          throw new Error("Bu qurilmada ushbu telefon uchun profil bor. Yuqoridagi ‘Kirish’ bo‘limidan telefon va PIN bilan kiring.");
        }
        if (isEdit && local && normalizePhone(local.phone) !== normalizePhone(profile?.phone) && normalizePhone(local.phone) === phone) {
          throw new Error("Bu telefon boshqa profilga tegishli.");
        }
        profile = { ...nextProfile, synced: false };
      }
      saveLocalProfile(profile);
      renderDashboard();
    } catch (error) {
      renderProfileForm(isEdit ? "edit" : "create", error.message || "Profilni saqlashda xatolik yuz berdi.");
    }
  }

  function renderDashboard() {
    setPageMode("dashboard");
    if (!profile) return renderProfileForm();
    const pool = buildPool();
    const rank = currentRank();
    const best = myBestAttempt();
    app.innerHTML = `
      <div class="ranked-dashboard-layout">
        <div class="ranked-main-column">
          <section class="ranked-card compact-profile-card">
            <div class="profile-head">
              ${renderAvatar(profile)}
              <div>
                <h2 class="profile-name">${escapeHtml(profile.fullName)}</h2>
                <p class="profile-meta">${escapeHtml(profile.company)} · ${escapeHtml(profile.department)} · ${escapeHtml(profile.position)}</p>
                <p class="profile-meta">Telefon: ${escapeHtml(profile.phone)}</p>
              </div>
              <div class="ranked-actions profile-action-buttons">
                <button id="editProfile" class="secondary" type="button">Profilni tahrirlash</button>
                <button id="logoutProfile" class="danger" type="button">Profildan chiqish</button>
              </div>
            </div>
            ${localModeNotice()}
            <div class="stats-grid">
              <div class="stat-box"><strong>${rank ? `${rank}-o‘rin` : "—"}</strong><span>Mening o‘rnim</span></div>
              <div class="stat-box"><strong>${best ? `${best.correct} ta` : "—"}</strong><span>Eng yaxshi natija</span></div>
              <div class="stat-box"><strong>${best ? formatTime(best.durationSeconds) : "—"}</strong><span>Eng yaxshi vaqt</span></div>
              <div class="stat-box"><strong>${best ? formatDate(best.finishedAt) : "—"}</strong><span>Oxirgi yaxshi natija</span></div>
            </div>
          </section>

          <section class="ranked-card start-panel start-panel-strong">
            <div>
              <span class="mini-label">Savollar bazasi: ${pool.length} ta</span>
              <h2>Testni boshlash</h2>
              <p>Barcha kategoriya testlari avtomatik umumiy testga kiradi. Savollar va javoblar har safar aralash tartibda chiqadi.</p>
              <div class="start-summary">
                <b>${pool.length} ta savol</b>
                <span>Alohida tanlash yo‘q — umumiy testda bazadagi hamma savollar ishlatiladi.</span>
              </div>
            </div>
            <div class="ranked-actions start-action-wrap">
              <button id="startRankedTest" class="primary start-button-big" type="button">Testni boshlash</button>
            </div>
          </section>
        </div>
        <aside class="leaderboard-sidebar">
          ${renderLeaderboard()}
        </aside>
      </div>
    `;
    document.getElementById("editProfile")?.addEventListener("click", () => renderProfileForm("edit"));
    document.getElementById("logoutProfile")?.addEventListener("click", logoutProfile);
    document.getElementById("startRankedTest")?.addEventListener("click", startQuiz);
  }

  function renderLeaderboard() {
    const best = getBestAttempts().slice(0, 200);
    const myKey = normalizePhone(profile?.phone);
    if (!best.length) {
      return `
        <section class="ranked-card public-leaderboard">
          <div class="leaderboard-title-row">
            <div>
              <span class="mini-label">Hammaga ko‘rinadi</span>
              <h2>Umumiy reyting jadvali</h2>
            </div>
          </div>
          <p>Hali reyting natijalari yo‘q. Birinchi test yakunlangandan keyin shu yerda ko‘rinadi.</p>
        </section>
      `;
    }
    const rows = best.map((item, index) => {
      const isMe = normalizePhone(item.phone) === myKey;
      return `
        <tr class="${isMe ? "me-row" : ""}">
          <td class="rank-cell"><b>${index + 1}</b></td>
          <td><span class="leaderboard-name">${escapeHtml(item.fullName)}</span><span class="leaderboard-sub">${escapeHtml(item.company)} · ${escapeHtml(item.department)}</span></td>
          <td><b>${item.correct} ta</b><span class="leaderboard-sub">${item.total} savoldan</span></td>
          <td>${formatTime(item.durationSeconds)}</td>
          <td>${formatDate(item.finishedAt)}</td>
        </tr>
      `;
    }).join("");
    return `
      <section class="ranked-card public-leaderboard">
        <div class="leaderboard-title-row">
          <div>
            <span class="mini-label">Hammaga ko‘rinadi</span>
            <h2>Umumiy reyting jadvali</h2>
          </div>
          <span class="leaderboard-count">${best.length} xodim</span>
        </div>
        <p class="leaderboard-help">Har bir xodim bo‘yicha faqat eng yaxshi to‘g‘ri javob soni ko‘rsatiladi. Yangi natijada to‘g‘ri javoblar soni ko‘proq bo‘lsa, eskisi avtomatik yangilanadi.</p>
        <div class="leaderboard-scroll">
          <table class="leaderboard-table">
            <thead><tr><th>O‘rin</th><th>Xodim</th><th>To‘g‘ri javob</th><th>Vaqt</th><th>Sana</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  function startQuiz() {
    setPageMode("quiz");
    const pool = buildPool();
    if (!pool.length) {
      alert("Savollar bazasi topilmadi. data/category-tests-data.js faylini tekshiring.");
      return;
    }
    quiz = shuffleArray(pool).map((q) => {
      const options = shuffleArray(q.options.map((text, index) => ({ text, correct: index === q.answerIndex })));
      return { ...q, options };
    });
    answers = Array(quiz.length).fill(null);
    currentIndex = 0;
    finishInProgress = false;
    startedAt = new Date();
    startTimer();
    renderQuestion();
    scrollToAppTop();
  }

  function startTimer() {
    stopTimer();
    timerId = window.setInterval(() => {
      const timer = document.getElementById("quizTimer");
      if (timer && startedAt) {
        timer.textContent = formatTime(Math.floor((Date.now() - startedAt.getTime()) / 1000));
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerId) window.clearInterval(timerId);
    timerId = null;
  }

  function wrongCount() {
    return answers.filter((item) => item && !item.isCorrect).length;
  }

  function renderQuestion() {
    const q = quiz[currentIndex];
    const answered = answers[currentIndex];
    const currentWrongCount = wrongCount();
    const isWrongAnswer = Boolean(answered && !answered.isCorrect);
    const isWrongLimitReached = currentWrongCount >= MAX_WRONG_ANSWERS;
    const progress = Math.round((currentIndex / quiz.length) * 100);
    const optionsHtml = q.options.map((option, index) => {
      let cls = "ranked-option";
      if (answered) {
        if (option.correct) cls += " correct";
        if (answered.selectedIndex === index && !option.correct) cls += " wrong";
      }
      return `<button class="${cls}" type="button" data-option="${index}" ${answered ? "disabled" : ""}><b>${String.fromCharCode(65 + index)})</b> <span>${escapeHtml(option.text)}</span></button>`;
    }).join("");
    const correctOption = q.options.find((item) => item.correct);
    const info = answered
      ? `<div class="answer-info ${answered.isCorrect ? "good" : "bad"}"><b>${answered.isCorrect ? "To‘g‘ri javob tanlandi." : (isWrongLimitReached ? "3 ta xato to‘ldi. Test avtomatik yakunlanadi." : `Noto‘g‘ri javob belgilandi. Xatolar: ${currentWrongCount}/${MAX_WRONG_ANSWERS}`)}</b><br>To‘g‘ri javob: ${escapeHtml(correctOption?.text || "")}${q.explanation ? `<br><br><b>Izoh / manba:</b> ${escapeHtml(q.explanation)}` : ""}</div>`
      : `<div class="answer-info wait">Javobni belgilang. Reytingli umumiy testda 3 ta noto‘g‘ri javob bo‘lsa, test yakunlanadi va natija saqlanadi.</div>`;

    app.innerHTML = `
      <section class="ranked-card quiz-card">
        <div class="quiz-header">
          <div>
            <span class="mini-label">${escapeHtml(q.categoryTitle)}</span>
            <h2>${currentIndex + 1}/${quiz.length}-savol</h2>
          </div>
          <div id="quizTimer" class="quiz-timer">${formatTime(Math.floor((Date.now() - startedAt.getTime()) / 1000))}</div>
        </div>
        <div class="progress large"><span style="width:${progress}%"></span></div>
        <div class="quiz-question">${escapeHtml(q.question)}</div>
        <div class="ranked-option-list">${optionsHtml}</div>
        ${info}
        <div class="ranked-actions quiz-actions">
          <button id="nextRankedQuestion" class="primary" type="button" ${answered && !isWrongLimitReached ? "" : "disabled"}>${isWrongLimitReached ? "Natija saqlanmoqda..." : (currentIndex === quiz.length - 1 ? "Testni yakunlash" : "Keyingi savol →")}</button>
          <button id="cancelRankedTest" class="secondary" type="button" ${isWrongLimitReached ? "disabled" : ""}>Testdan chiqish</button>
        </div>
      </section>
    `;
    document.querySelectorAll(".ranked-option").forEach((button) => {
      button.addEventListener("click", () => selectAnswer(Number(button.dataset.option)));
    });
    document.getElementById("nextRankedQuestion")?.addEventListener("click", nextQuestion);
    document.getElementById("cancelRankedTest")?.addEventListener("click", () => {
      if (confirm("Testdan chiqasizmi? Natija reytingga yozilmaydi.")) {
        stopTimer();
        renderDashboard();
      }
    });
  }

  function scrollToAnswerActions() {
    window.setTimeout(() => {
      const target = document.getElementById("nextRankedQuestion") || document.querySelector(".answer-info");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
  }

  function selectAnswer(index) {
    if (answers[currentIndex] || finishInProgress) return;
    const q = quiz[currentIndex];
    const selected = q.options[index];
    const isCorrect = Boolean(selected?.correct);
    answers[currentIndex] = {
      selectedIndex: index,
      isCorrect
    };
    renderQuestion();
    scrollToAnswerActions();

    if (!isCorrect && wrongCount() >= MAX_WRONG_ANSWERS) {
      finishInProgress = true;
      window.setTimeout(() => finishQuiz("wrong-limit"), 1200);
      return;
    }

  }

  function nextQuestion() {
    if (finishInProgress) return;
    if (!answers[currentIndex]) {
      alert("Avval javobni belgilang.");
      return;
    }
    if (currentIndex < quiz.length - 1) {
      currentIndex += 1;
      renderQuestion();
      scrollToAppTop();
      return;
    }
    finishQuiz();
  }

  async function finishQuiz(reason = "completed") {
    setPageMode("result");
    if (finishInProgress && reason !== "wrong-limit") return;
    finishInProgress = true;
    stopTimer();
    const finishedAt = new Date();
    const correct = answers.filter((item) => item?.isCorrect).length;
    const total = quiz.length;
    const percent = total ? Math.round((correct / total) * 100) : 0;
    const durationSeconds = Math.max(1, Math.floor((finishedAt.getTime() - startedAt.getTime()) / 1000));
    const attempt = {
      id: uid(),
      profileId: profile.id,
      phone: profile.phone,
      fullName: profile.fullName,
      company: profile.company,
      department: profile.department,
      position: profile.position,
      total,
      correct,
      percent,
      durationSeconds,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      source: isSupabaseReady() ? "supabase" : "local"
    };

    let saveMessage = "Natija ushbu qurilma xotirasida tekshirildi.";
    let improved = true;

    if (isSupabaseReady()) {
      try {
        const result = await dbSaveAttempt(attempt);
        attempts = await dbLoadAttempts();
        saveLocalAttempts(attempts);
        improved = Boolean(result.improved);
        saveMessage = improved
          ? "To‘g‘ri javoblar soni oldingi natijadan ko‘proq bo‘ldi va umumiy reytingda yangilandi."
          : "Oldingi eng yaxshi natijangizda to‘g‘ri javoblar soni ko‘proq yoki vaqt tezroq. Reytingdagi eski yaxshi natija saqlab qolindi.";
      } catch (error) {
        const localResult = upsertLocalBestAttempt(attempts, attempt);
        attempts = localResult.attempts;
        improved = localResult.improved;
        saveLocalAttempts(attempts);
        saveMessage = `Supabasega yozishda xatolik: ${escapeHtml(error.message || "noma’lum xatolik")}. Natija vaqtincha localStorage’da tekshirildi.`;
      }
    } else {
      const localResult = upsertLocalBestAttempt(attempts, attempt);
      attempts = localResult.attempts;
      improved = localResult.improved;
      saveLocalAttempts(attempts);
      saveMessage = improved
        ? "To‘g‘ri javoblar soni ushbu qurilmadagi eng yaxshi natija sifatida saqlandi."
        : "Oldingi eng yaxshi natijangizda to‘g‘ri javoblar soni ko‘proq yoki vaqt tezroq. Eski yaxshi natija saqlandi.";
    }

    const best = myBestAttempt() || attempt;
    const rank = currentRank();
    app.innerHTML = `
      <section class="ranked-card result-card">
        <span class="mini-label">Test yakunlandi</span>
        <h2>${correct} ta</h2>
        <p>Jami ${total} ta savoldan <b>${correct} ta</b> javob to‘g‘ri. Sarflangan vaqt: <b>${formatTime(durationSeconds)}</b>.</p>
        ${reason === "wrong-limit" ? `<div class="ranked-warning"><b>Test avtomatik yakunlandi:</b> 3 ta noto‘g‘ri javob belgilandi va natija saqlandi.</div>` : ""}
        <div class="ranked-note">${saveMessage}</div>
        <div class="stats-grid">
          <div class="stat-box"><strong>${rank ? `${rank}-o‘rin` : "—"}</strong><span>Joriy o‘rin</span></div>
          <div class="stat-box"><strong>${best.correct} ta</strong><span>Reytingdagi natija</span></div>
          <div class="stat-box"><strong>${formatTime(best.durationSeconds)}</strong><span>Reytingdagi vaqt</span></div>
          <div class="stat-box"><strong>${formatDate(best.finishedAt)}</strong><span>Reyting sanasi</span></div>
        </div>
        <div class="ranked-actions center">
          <button id="backDashboard" class="primary" type="button">Profil va reytingga qaytish</button>
          <button id="restartRanked" class="secondary" type="button">Yana test yechish</button>
        </div>
      </section>
      ${renderLeaderboard()}
    `;
    document.getElementById("backDashboard")?.addEventListener("click", () => { finishInProgress = false; renderDashboard(); });
    document.getElementById("restartRanked")?.addEventListener("click", startQuiz);
    scrollToAppTop();
  }

  function scrollToAppTop() {
    window.setTimeout(() => app.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  async function init() {
    profile = loadLocalProfile();
    attempts = getBestAttempts(loadLocalAttempts());
    if (isSupabaseReady()) {
      try {
        attempts = await dbLoadAttempts();
        saveLocalAttempts(attempts);
        if (profile?.phone) {
          const existing = await dbGetProfileByPhone(profile.phone);
          if (existing) {
            profile = dbProfileToLocal(existing);
            saveLocalProfile(profile);
          }
        }
      } catch (error) {
        console.warn("Supabase yuklash xatosi:", error);
      }
    }
    if (profile && localStorage.getItem(ACTIVE_SESSION_KEY)) renderDashboard();
    else renderProfileForm();
  }

  init();
})();
