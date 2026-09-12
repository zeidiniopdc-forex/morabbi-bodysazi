
// ========== MAIN APP ==========
let state = loadState();
let currentView = "dashboard";
let restTimerInterval = null;
let restSecondsLeft = 0;

/** صدای آلارم داخل‌برنامه‌ای (Web Audio — بدون فایل خارجی) */
let _audioCtx = null;
function getAudioCtx() {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    return _audioCtx;
  } catch (e) { return null; }
}
function playTone(freq, durationMs, type, gainVal) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || "sine";
  osc.frequency.value = freq;
  gain.gain.value = gainVal != null ? gainVal : 0.12;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.02);
}
/** type: rest | supplement | workout */
function playAppSound(kind) {
  const s = state?.settings || {};
  if (kind === "rest" && s.restTimerSound === false) return;
  if (kind === "supplement" && s.supplementSound === false) return;
  if (kind === "workout" && s.workoutReminderSound === false) return;
  try {
    if (kind === "rest") {
      playTone(880, 180, "sine", 0.14);
      setTimeout(() => playTone(1175, 220, "sine", 0.14), 200);
      setTimeout(() => playTone(1319, 280, "sine", 0.12), 420);
    } else if (kind === "supplement") {
      playTone(660, 160, "triangle", 0.12);
      setTimeout(() => playTone(880, 200, "triangle", 0.12), 180);
    } else if (kind === "workout") {
      playTone(523, 200, "square", 0.08);
      setTimeout(() => playTone(659, 200, "square", 0.08), 220);
      setTimeout(() => playTone(784, 320, "square", 0.1), 440);
    } else {
      playTone(800, 200, "sine", 0.1);
    }
  } catch (e) { /* ignore */ }
  if (navigator.vibrate) {
    try {
      if (kind === "rest") navigator.vibrate([180, 80, 180, 80, 250]);
      else if (kind === "workout") navigator.vibrate([300, 100, 300]);
      else navigator.vibrate([120, 60, 120]);
    } catch (e) {}
  }
}

let workoutStartTime = null;

// ---------- Utils ----------
function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return [...root.querySelectorAll(sel)]; }

function toast(msg, type = "") {
  const el = $("#toast");
  el.textContent = msg;
  el.className = "toast " + type;
  setTimeout(() => el.classList.add("hidden"), 2800);
}

function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("fa-IR");
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function volumeOfSets(sets) {
  return sets.reduce((sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0);
}

// ---------- Theme ----------
function applyTheme(theme) {
  const t = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", t);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t === "light" ? "#f1f5f9" : "#0f172a");
  const btn = document.getElementById("btn-theme");
  if (btn) btn.textContent = t === "light" ? "🌙" : "☀️";
}

function toggleTheme() {
  state = loadState();
  const next = (state.settings.theme === "light") ? "dark" : "light";
  state.settings.theme = next;
  saveState(state);
  applyTheme(next);
  toast(next === "light" ? "تم روشن" : "تم تاریک", "success");
}

// ---------- Navigation ----------
function navigate(view) {
  if (state.activeWorkout && view !== "active-workout") {
    // allow leaving but keep active
  }
  currentView = view;
  $$(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === view || (view === "active-workout" && b.dataset.view === "workouts")));
  document.body.classList.toggle("workout-mode", view === "active-workout");
  render();
}

$$(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => navigate(btn.dataset.view));
});

$("#btn-refresh")?.addEventListener("click", () => {
  state = loadState();
  toast("بروزرسانی شد", "success");
  render();
});

$("#btn-settings-header")?.addEventListener("click", () => navigate("settings"));

document.getElementById("btn-theme")?.addEventListener("click", toggleTheme);

// ---------- Double Progression ----------
function suggestNextWeight(exerciseId, lastSets, targetReps) {
  if (!lastSets || !lastSets.length) return null;
  const range = parseRepRange(targetReps);
  const allHitTop = lastSets.every(s => Number(s.reps) >= range.max && (s.rir === undefined || Number(s.rir) <= 2));
  if (allHitTop) {
    const lastW = Number(lastSets[0].weight) || 0;
    // small increase for isolation, larger for compounds
    const isIsolation = /نشر|فلای|جلو بازو|پشت بازو|ساق|کیک/.test(
      getActiveProgram(state).sessions.flatMap(s => s.exercises).find(e => e.id === exerciseId)?.name || ""
    );
    const bump = isIsolation ? Math.max(1, Math.round(lastW * 0.02)) : Math.max(2.5, Math.round(lastW * 0.025 * 2) / 2);
    return { suggested: lastW + bump, reason: `سقف تکرار (${range.max}) با RIR مناسب رسیده — افزایش وزنه` };
  }
  return { suggested: Number(lastSets[0].weight) || 0, reason: "ادامه با همین وزنه تا رسیدن به سقف تکرار" };
}

// ---------- Render Router ----------
function render() {
  state = loadState();
  const main = $("#main-content");
  const titles = {
    dashboard: "داشبورد",
    workouts: "برنامه تمرینی",
    supplements: "مکمل‌ها",
    progress: "پیشرفت بدن",
    more: "بیشتر",
    "active-workout": "جلسه فعال",
    history: "تاریخچه",
    nutrition: "تغذیه",
    settings: "تنظیمات",
    reports: "گزارش‌ها",
    coach: "مربی هوشمند",
    "coach-prompt": "پرامپت AI",
    "coach-import": "وارد کردن خروجی",
    "infographic-prompt": "اینفوگرافیک برنامه"
  };
  $("#page-title").textContent = titles[currentView] || "مربی";

  // week progress
  const week = getWeekNumber(state.profile.startDate);
  const totalWeeks = (getActiveProgram(state).weeks) || 8;
  $("#week-fill").style.width = `${Math.min(100, (week / totalWeeks) * 100)}%`;

  if (currentView === "dashboard") main.innerHTML = renderDashboard();
  else if (currentView === "workouts") main.innerHTML = renderWorkouts();
  else if (currentView === "active-workout") main.innerHTML = renderActiveWorkout();
  else if (currentView === "supplements") main.innerHTML = renderSupplements();
  else if (currentView === "progress") main.innerHTML = renderProgress();
  else if (currentView === "more") main.innerHTML = renderMore();
  else if (currentView === "history") main.innerHTML = renderHistory();
  else if (currentView === "nutrition") main.innerHTML = renderNutrition();
  else if (currentView === "settings") main.innerHTML = renderSettings();
  else if (currentView === "reports") main.innerHTML = renderReports();
  else if (currentView === "coach") main.innerHTML = renderCoach();
  else if (currentView === "coach-prompt") main.innerHTML = renderCoachPrompt();
  else if (currentView === "coach-import") main.innerHTML = renderCoachImport();
  else if (currentView === "infographic-prompt") main.innerHTML = renderInfographicPrompt();
  else main.innerHTML = "<p>صفحه یافت نشد</p>";

  bindViewEvents();
}

// ---------- DASHBOARD ----------
function renderDashboard() {
  const todaySessId = getTodaySessionId(state);
  const todaySess = getActiveProgram(state).sessions.find(s => s.id === todaySessId);
  const week = getWeekNumber(state.profile.startDate);
  const totalWeeks = getActiveProgram(state).weeks || 8;
  const doneSessions = state.workoutHistory.filter(w => w.completed).length;
  const latestWeight = state.bodyLogs.length
    ? [...state.bodyLogs].sort((a, b) => b.date.localeCompare(a.date))[0].weight
    : state.profile.weight;
  const today = getTodayStr();
  const enabledSupps = state.supplements.filter(s => s.enabled);
  const takenToday = state.supplementLogs.filter(l => l.date === today).length;
  const hasActive = !!state.activeWorkout;
  const prog = getActiveProgram(state);
  const name = state.profile.name || "ورزشکار";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "صبح بخیر" : hour < 18 ? "عصر بخیر" : "شب بخیر";
  const lims = state.profile.limitations || [];
  const safetyText = lims.includes("l4l5")
    ? "محدودیت L4-L5 فعال است — حرکات ممنوع را رعایت کنید."
    : (lims.length ? "محدودیت‌های ثبت‌شده را در تمرین رعایت کنید." : "برنامه شخصی‌سازی‌شده با مربی هوشمند بسازید.");

  const weekPct = Math.min(100, Math.round((week / totalWeeks) * 100));
  const dayName = DAY_NAMES_FA[getDayOfWeek()];

  return `
    <div class="home-hero anim-fade-up">
      <div class="home-hero-glow"></div>
      <div class="home-hero-top">
        <div>
          <div class="home-greet">${greet} 👋</div>
          <div class="home-name">${name}</div>
        </div>
        <div class="home-week-badge">
          <span class="home-week-num">هفته ${week}</span>
          <span class="home-week-sub">از ${totalWeeks}</span>
        </div>
      </div>
      <div class="home-progress-track">
        <div class="home-progress-fill" style="width:${weekPct}%"></div>
      </div>
      <div class="home-hero-meta">
        <span>${dayName}</span>
        <span>·</span>
        <span>${prog.name || "برنامه تمرینی"}</span>
      </div>
    </div>

    ${hasActive ? `
    <div class="feature-card fc-pulse anim-fade-up delay-1" onclick="resumeWorkout()">
      <div class="fc-icon">▶️</div>
      <div class="fc-body">
        <div class="fc-title">ادامه جلسه ناتمام</div>
        <div class="fc-sub">${prog.sessions.find(s => s.id === state.activeWorkout.sessionId)?.name || "جلسه فعال"}</div>
      </div>
      <div class="fc-arrow">‹</div>
    </div>` : ""}

    <div class="stat-row anim-fade-up delay-1">
      <div class="stat-chip sc-cyan">
        <div class="sc-val">${latestWeight ?? "—"}</div>
        <div class="sc-lbl">وزن (کیلو)</div>
      </div>
      <div class="stat-chip sc-violet">
        <div class="sc-val">${doneSessions}</div>
        <div class="sc-lbl">جلسات کامل</div>
      </div>
      <div class="stat-chip sc-amber">
        <div class="sc-val">${takenToday}/${enabledSupps.length || 0}</div>
        <div class="sc-lbl">مکمل امروز</div>
      </div>
    </div>

    <div class="feature-card fc-today anim-fade-up delay-2 ${todaySess ? "has-session" : "rest-day"}">
      <div class="fc-icon">${todaySess ? "💪" : "😴"}</div>
      <div class="fc-body">
        <div class="fc-title">${todaySess ? "تمرین امروز" : "روز استراحت"}</div>
        <div class="fc-sub">${todaySess ? (todaySess.name + " · " + (todaySess.muscles || []).slice(0, 3).join("، ")) : "ریکاوری و مکمل‌های روزانه"}</div>
      </div>
      ${todaySess ? `<button class="btn btn-sm btn-primary" onclick="event.stopPropagation();startWorkout(${todaySess.id})">شروع</button>` : `<button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();navigate('supplements')">مکمل</button>`}
    </div>

    <div class="section-label anim-fade-up delay-2">دسترسی سریع</div>
    <div class="quick-grid anim-fade-up delay-3">
      <button type="button" class="quick-tile qt-coach" onclick="navigate('coach')">
        <span class="qt-icon">🧠</span>
        <span class="qt-title">مربی هوشمند</span>
        <span class="qt-sub">ساخت برنامه با AI</span>
      </button>
      <button type="button" class="quick-tile qt-train" onclick="navigate('workouts')">
        <span class="qt-icon">🏋️</span>
        <span class="qt-title">تمرین</span>
        <span class="qt-sub">برنامه هفتگی</span>
      </button>
      <button type="button" class="quick-tile qt-supp" onclick="navigate('supplements')">
        <span class="qt-icon">💊</span>
        <span class="qt-title">مکمل‌ها</span>
        <span class="qt-sub">زمان‌بندی روزانه</span>
      </button>
      <button type="button" class="quick-tile qt-prog" onclick="navigate('progress')">
        <span class="qt-icon">📊</span>
        <span class="qt-title">پیشرفت</span>
        <span class="qt-sub">وزن و اندازه‌ها</span>
      </button>
      <button type="button" class="quick-tile qt-info" onclick="navigate('infographic-prompt')">
        <span class="qt-icon">🎨</span>
        <span class="qt-title">اینفوگرافیک</span>
        <span class="qt-sub">پوستر برنامه</span>
      </button>
      <button type="button" class="quick-tile qt-more" onclick="navigate('more')">
        <span class="qt-icon">☰</span>
        <span class="qt-title">بیشتر</span>
        <span class="qt-sub">تنظیمات و گزارش</span>
      </button>
    </div>

    <div class="safety-soft anim-fade-up delay-3">${safetyText}</div>

    <div class="creator-card anim-fade-up delay-4">
      <div class="creator-badge">سازنده و مربی</div>
      <div class="creator-name">امین زیدی</div>
      <div class="creator-role">مربی رسمی فدراسیون پرورش اندام ایران</div>
      <div class="creator-actions">
        <a class="creator-btn" href="tel:09981455945" onclick="event.stopPropagation()">📞 تماس</a>
        <button type="button" class="creator-btn" onclick="openExternalLink('https://wa.me/989981455945')">واتساپ</button>
        <button type="button" class="creator-btn" onclick="openExternalLink('https://t.me/+989981455945')">تلگرام</button>
      </div>
      <div class="creator-phone" dir="ltr">0998 145 5945</div>
    </div>
  `;
}

// ---------- WORKOUTS LIST ----------
function renderWorkouts() {
  const map = buildDaySessionMap(state);
  // هفته ایرانی: شنبه تا جمعه
  const weekHtml = IR_WEEK_ORDER.map(d => {
    const sid = map[d];
    const isToday = getDayOfWeek() === d;
    const border = isToday ? "var(--primary)" : "var(--border)";
    if (sid == null) {
      return `<div class="week-day-cell" style="border-color:${isToday ? "var(--primary)" : "transparent"}">
        <div class="week-day-name">${DAY_NAMES_SHORT[d]}</div>
        <div class="week-day-rest">استراحت</div>
      </div>`;
    }
    const sess = getActiveProgram(state).sessions.find(s => s.id === sid);
    const short = (sess?.shortName || "جلسه").replace("جلسه ", "ج");
    return `<div class="week-day-cell week-day-train" style="border-color:${border}">
      <div class="week-day-name">${DAY_NAMES_SHORT[d]}</div>
      <div class="week-day-sess" style="color:${sess?.color || "var(--primary)"}">${short}</div>
    </div>`;
  }).join("");

  return `
    <div class="safety-banner">حرکات ممنوع: اسکوات هالتر سنگین، ددلیفت، RDL، Good Morning، Bent-over Row سنگین، کرانچ سنگین، چرخش سنگین تنه.</div>
    <div class="card">
      <div class="card-title">برنامه هفتگی · شنبه تا جمعه</div>
      <div class="week-schedule">${weekHtml}</div>
      <p class="text-muted mt-1" style="font-size:0.8rem">روزهای استراحت برای ریکاوری ضروری‌اند. تغییر روزها از تنظیمات.</p>
    </div>
    ${getActiveProgram(state).sessions.map(s => `
      <div class="session-card" onclick="showSessionDetail(${s.id})">
        <div class="session-header">
          <div>
            <div class="session-name" style="color:${s.color}">${s.shortName}: ${s.name}</div>
            <div class="session-muscles">${s.muscles.join(" · ")} · ${s.exercises.length} حرکت</div>
          </div>
          <span class="tag tag-primary">${s.exercises.reduce((a, e) => a + e.sets, 0)} ست</span>
        </div>
        ${s.note ? `<p class="text-muted" style="font-size:0.85rem">${s.note}</p>` : ""}
        <button class="btn btn-primary btn-sm mt-1" onclick="event.stopPropagation();startWorkout(${s.id})">شروع این جلسه</button>
      </div>
    `).join("")}
    <button class="btn btn-secondary btn-block mt-2" onclick="navigate('infographic-prompt')">🎨 پرامپت اینفوگرافیک برنامه</button>
    <button class="btn btn-secondary btn-block mt-1" onclick="navigate('history')">تاریخچه جلسات</button>
  `;
}

function showSessionDetail(id) {
  const s = getActiveProgram(state).sessions.find(x => x.id === id);
  if (!s) return;
  const html = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal-sheet">
        <div class="modal-title" style="color:${s.color}">${s.name}</div>
        <p class="text-muted mb-2">${s.warmUp || ""}</p>
        ${s.exercises.map((e, i) => `
          <div class="exercise-item">
            <div class="flex-between" style="align-items:flex-start;gap:8px">
              <div class="exercise-name" style="flex:1">${i + 1}. ${e.name}</div>
              <button type="button" class="btn btn-sm btn-secondary demo-btn" onclick="event.stopPropagation();showExerciseDemo(decodeURIComponent('${encodeURIComponent(e.name)}'))">🖼 فرم</button>
            </div>
            <div class="exercise-meta">
              <span class="tag tag-accent">${e.muscle}</span>
              <span>${e.sets} ست × ${e.reps}</span>
              <span>استراحت ${e.rest}</span>
              <span>RIR ${e.rir}</span>
            </div>
            ${e.note ? `<p style="font-size:0.8rem;margin-top:4px;color:var(--text-muted)">${e.note}</p>` : ""}
            ${e.safety ? `<p style="font-size:0.8rem;color:var(--danger)">${e.safety}</p>` : ""}
          </div>
        `).join("")}
        <button class="btn btn-primary btn-block mt-2" onclick="closeModal();startWorkout(${s.id})">شروع جلسه</button>
        <button class="btn btn-secondary btn-block mt-1" onclick="closeModal()">بستن</button>
      </div>
    </div>`;
  $("#modal-root").innerHTML = html;
}

function closeModal() {
  $("#modal-root").innerHTML = "";
}

/** مودال نمایش فرم حرکت — لینک تصویر گوگل و ویدیوی یوتیوب */
/** باز کردن لینک خارجی — کار در مرورگر و WebView/Capacitor */
function openExternalLink(url) {
  if (!url) return;
  try {
    const Cap = window.Capacitor;
    if (Cap?.Plugins?.Browser?.open) {
      Cap.Plugins.Browser.open({ url });
      return;
    }
  } catch (e) { /* ignore */ }
  try {
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (w) return;
  } catch (e) { /* ignore */ }
  // آخرین راه: رفتن مستقیم (مثلاً WebView محدود)
  window.location.href = url;
}

function getExerciseDemoLinksSafe(name) {
  try {
    if (typeof exerciseDemoLinks === "function") return exerciseDemoLinks(name);
  } catch (e) { /* ignore */ }
  const label = name || "حرکت";
  const q = encodeURIComponent(String(label) + " exercise form");
  const qFa = encodeURIComponent(String(label) + " آموزش حرکت بدنسازی");
  return {
    label,
    youtube: "https://www.youtube.com/results?search_query=" + q + "+tutorial",
    youtubeFa: "https://www.youtube.com/results?search_query=" + qFa,
    images: "https://www.google.com/search?tbm=isch&q=" + q
  };
}

function showExerciseDemo(name) {
  const links = getExerciseDemoLinksSafe(name);
  // ذخیره موقت برای دکمه‌ها (جلوگیری از مشکل کوتیشن در onclick)
  window.__demoLinks = links;
  const html = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal-sheet">
        <div class="modal-title">فرم حرکت</div>
        <p style="text-align:center;font-weight:700;margin-bottom:12px">${links.label}</p>
        <p class="text-muted" style="font-size:0.85rem;line-height:1.6;margin-bottom:14px">
          برای یادگیری فرم صحیح یکی از گزینه‌ها را باز کنید. ویدیوی کوتاه با زاویه جانبی بهترین راهنماست.
        </p>
        <button type="button" class="btn btn-primary btn-block" onclick="openExternalLink(window.__demoLinks.youtubeFa)">▶ ویدیوی آموزشی (فارسی)</button>
        <button type="button" class="btn btn-secondary btn-block mt-1" onclick="openExternalLink(window.__demoLinks.youtube)">▶ YouTube (English form)</button>
        <button type="button" class="btn btn-secondary btn-block mt-1" onclick="openExternalLink(window.__demoLinks.images)">🖼 تصاویر فرم در گوگل</button>
        <button type="button" class="btn btn-secondary btn-block mt-2" onclick="closeModal()">بستن</button>
        <p class="text-muted text-center mt-2" style="font-size:0.75rem">نیاز به اینترنت · در اپ ممکن است مرورگر سیستم باز شود</p>
      </div>
    </div>`;
  $("#modal-root").innerHTML = html;
}

// ---------- START / ACTIVE WORKOUT ----------
function startWorkout(sessionId) {
  if (state.activeWorkout && state.activeWorkout.sessionId !== sessionId) {
    if (!confirm("یک جلسه ناتمام دارید. آن را لغو و جلسه جدید شروع شود؟")) return;
  }
  const session = getActiveProgram(state).sessions.find(s => s.id === sessionId);
  const exercises = session.exercises.map(ex => {
    const last = state.lastExerciseData[ex.id] || [];
    const suggestion = suggestNextWeight(ex.id, last, ex.reps);
    return {
      ...ex,
      setsData: Array.from({ length: ex.sets }, (_, i) => ({
        weight: last[i]?.weight ?? suggestion?.suggested ?? "",
        reps: "",
        rir: "",
        done: false,
        pain: false,
        note: ""
      })),
      lastPerformance: last,
      suggestion
    };
  });

  state.activeWorkout = {
    sessionId,
    startedAt: new Date().toISOString(),
    exercises,
    currentExerciseIndex: 0,
    notes: ""
  };
  saveState(state);
  workoutStartTime = Date.now();
  navigate("active-workout");
}

function resumeWorkout() {
  if (!state.activeWorkout) return;
  workoutStartTime = Date.now() - (state.activeWorkout.elapsedMs || 0);
  navigate("active-workout");
}

function renderActiveWorkout() {
  const w = state.activeWorkout;
  if (!w) {
    navigate("workouts");
    return "<p>جلسه‌ای فعال نیست</p>";
  }
  const session = getActiveProgram(state).sessions.find(s => s.id === w.sessionId);
  const elapsed = Math.floor((Date.now() - (workoutStartTime || Date.now())) / 1000);

  let html = `
    <div class="workout-header">
      <div class="flex-between">
        <div>
          <div style="font-weight:700;color:${session.color}">${session.shortName}</div>
          <div class="text-muted" style="font-size:0.85rem">${session.name}</div>
        </div>
        <div class="timer-display" id="workout-timer">${formatTime(elapsed)}</div>
      </div>
      <div class="progress-bar mt-1">
        <div class="progress-fill" style="width:${(w.exercises.filter(e => e.setsData.every(s => s.done)).length / w.exercises.length) * 100}%"></div>
      </div>
    </div>

    <div id="rest-timer-box" class="rest-timer ${restSecondsLeft > 0 ? "" : "hidden"}">
      <div class="text-muted">استراحت</div>
      <div class="time" id="rest-time">${formatTime(restSecondsLeft)}</div>
      <div class="flex gap-1 mt-1" style="justify-content:center">
        <button class="btn btn-sm btn-secondary" onclick="addRest(30)">+۳۰ث</button>
        <button class="btn btn-sm btn-secondary" onclick="skipRest()">رد کردن</button>
      </div>
    </div>
  `;

  w.exercises.forEach((ex, ei) => {
    const lastStr = ex.lastPerformance?.length
      ? ex.lastPerformance.map(s => `${s.weight}×${s.reps}`).join(" · ")
      : "—";
    html += `
      <div class="card" style="border-color:${ex.setsData.every(s => s.done) ? "var(--success)" : "var(--border)"}">
        <div class="flex-between mb-1" style="gap:8px;align-items:flex-start">
          <div class="exercise-name" style="flex:1">${ei + 1}. ${ex.name}</div>
          <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
            <button type="button" class="btn btn-sm btn-secondary demo-btn" onclick="showExerciseDemo(decodeURIComponent('${encodeURIComponent(ex.name)}'))">🖼</button>
            <span class="tag tag-accent">${ex.muscle}</span>
          </div>
        </div>
        <div class="exercise-meta mb-1">
          <span>${ex.sets}×${ex.reps}</span>
          <span>استراحت ${ex.rest}</span>
          <span>RIR ${ex.rir}</span>
        </div>
        ${ex.note ? `<p style="font-size:0.8rem;color:var(--text-muted)">${ex.note}</p>` : ""}
        ${ex.safety ? `<p style="font-size:0.8rem;color:var(--danger)">⚠ ${ex.safety}</p>` : ""}
        <p style="font-size:0.8rem;color:var(--primary)">آخرین: ${lastStr}</p>
        ${ex.suggestion ? `<p style="font-size:0.8rem;color:var(--warning)">${ex.suggestion.reason} → ${ex.suggestion.suggested} کیلو</p>` : ""}

        <div class="set-row" style="font-size:0.75rem;color:var(--text-muted);margin-top:8px">
          <div></div><div class="text-center">وزن</div><div class="text-center">تکرار</div><div class="text-center">RIR</div><div></div>
        </div>
        ${ex.setsData.map((set, si) => `
          <div class="set-row ${set.done ? "done" : ""}" data-ei="${ei}" data-si="${si}">
            <div class="set-num">${si + 1}</div>
            <input type="number" inputmode="decimal" placeholder="وزن" value="${set.weight}" data-field="weight"
              onchange="updateSet(${ei},${si},'weight',this.value)" ${set.done ? "readonly" : ""} />
            <input type="number" inputmode="numeric" placeholder="تکرار" value="${set.reps}" data-field="reps"
              onchange="updateSet(${ei},${si},'reps',this.value)" ${set.done ? "readonly" : ""} />
            <input type="number" inputmode="numeric" placeholder="RIR" value="${set.rir}" data-field="rir"
              onchange="updateSet(${ei},${si},'rir',this.value)" ${set.done ? "readonly" : ""} />
            <button class="check-btn ${set.done ? "checked" : ""}" onclick="toggleSetDone(${ei},${si})">${set.done ? "✓" : "○"}</button>
          </div>
        `).join("")}
        <div class="flex gap-1 mt-1">
          <button class="btn btn-sm btn-secondary" onclick="flagPain(${ei})">⚠ درد/ناراحتی</button>
          <button class="btn btn-sm btn-secondary" onclick="startRestFor(${ei})">تایمر استراحت</button>
        </div>
      </div>
    `;
  });

  html += `
    <div class="form-group mt-2">
      <label class="form-label">یادداشت جلسه</label>
      <textarea class="form-input" rows="2" id="session-note" onchange="state.activeWorkout.notes=this.value;saveState(state)">${w.notes || ""}</textarea>
    </div>
    <button class="btn btn-success btn-lg btn-block" onclick="finishWorkout()">پایان و ذخیره جلسه</button>
    <button class="btn btn-secondary btn-block mt-1" onclick="cancelWorkout()">لغو جلسه</button>
  `;

  // live timer
  setTimeout(() => {
    if (currentView !== "active-workout") return;
    const t = $("#workout-timer");
    if (t) {
      const tick = () => {
        if (currentView !== "active-workout") return;
        const el = Math.floor((Date.now() - (workoutStartTime || Date.now())) / 1000);
        t.textContent = formatTime(el);
        requestAnimationFrame(() => setTimeout(tick, 1000));
      };
      tick();
    }
  }, 100);

  return html;
}

function updateSet(ei, si, field, value) {
  if (!state.activeWorkout) return;
  state.activeWorkout.exercises[ei].setsData[si][field] = value;
  saveState(state);
}

function toggleSetDone(ei, si) {
  if (!state.activeWorkout) return;
  const set = state.activeWorkout.exercises[ei].setsData[si];
  if (!set.done && (!set.weight || !set.reps)) {
    toast("وزن و تکرار را وارد کنید", "warning");
    return;
  }
  set.done = !set.done;
  saveState(state);
  if (set.done) {
    const restSec = parseRestSeconds(state.activeWorkout.exercises[ei].rest);
    startRestTimer(restSec);
  }
  render();
}

function flagPain(ei) {
  if (!state.activeWorkout) return;
  state.activeWorkout.exercises[ei].painFlag = true;
  saveState(state);
  toast("⚠ درد ثبت شد. اگر تیرکشنده/بی‌حسی/گزگز است حرکت را متوقف کنید و ارزیابی کنید.", "danger");
  if (confirm("آیا درد تیرکشنده به پا، بی‌حسی، گزگز یا ضعف دارید؟\nدر این صورت حرکت را همین حالا متوقف کنید.")) {
    // mark remaining sets skipped conceptually
    state.activeWorkout.exercises[ei].setsData.forEach(s => { if (!s.done) s.note = "متوقف به دلیل درد"; });
    saveState(state);
    render();
  }
}

function startRestFor(ei) {
  const restSec = parseRestSeconds(state.activeWorkout.exercises[ei].rest);
  startRestTimer(restSec);
}

function startRestTimer(seconds) {
  clearInterval(restTimerInterval);
  restSecondsLeft = seconds;
  const box = $("#rest-timer-box");
  if (box) box.classList.remove("hidden");
  const update = () => {
    const el = $("#rest-time");
    if (el) el.textContent = formatTime(restSecondsLeft);
    if (restSecondsLeft <= 0) {
      clearInterval(restTimerInterval);
      if (box) box.classList.add("hidden");
      toast("استراحت تمام شد — ست بعدی", "success");
      playAppSound("rest");
    }
  };
  update();
  restTimerInterval = setInterval(() => {
    restSecondsLeft--;
    update();
  }, 1000);
}

function addRest(sec) {
  restSecondsLeft += sec;
  const el = $("#rest-time");
  if (el) el.textContent = formatTime(restSecondsLeft);
}

function skipRest() {
  restSecondsLeft = 0;
  clearInterval(restTimerInterval);
  const box = $("#rest-timer-box");
  if (box) box.classList.add("hidden");
}

function finishWorkout() {
  if (!state.activeWorkout) return;
  const w = state.activeWorkout;
  const durationSec = Math.floor((Date.now() - (workoutStartTime || Date.now())) / 1000);
  const completedSets = w.exercises.flatMap(e => e.setsData.filter(s => s.done));
  const totalVolume = volumeOfSets(completedSets);

  // update lastExerciseData & PRs
  w.exercises.forEach(ex => {
    const doneSets = ex.setsData.filter(s => s.done && s.weight && s.reps);
    if (doneSets.length) {
      state.lastExerciseData[ex.id] = doneSets.map(s => ({
        weight: Number(s.weight),
        reps: Number(s.reps),
        rir: s.rir !== "" ? Number(s.rir) : null
      }));
      const best = doneSets.reduce((a, s) => {
        const vol = Number(s.weight) * Number(s.reps);
        return vol > (a.vol || 0) ? { weight: Number(s.weight), reps: Number(s.reps), vol } : a;
      }, {});
      const prev = state.exercisePRs[ex.id];
      if (!prev || best.vol > (prev.volume || 0)) {
        state.exercisePRs[ex.id] = { weight: best.weight, reps: best.reps, volume: best.vol, date: getTodayStr() };
      }
    }
  });

  const record = {
    id: "w_" + Date.now(),
    sessionId: w.sessionId,
    date: getTodayStr(),
    startedAt: w.startedAt,
    finishedAt: new Date().toISOString(),
    durationSec,
    completed: true,
    notes: w.notes || $("#session-note")?.value || "",
    exercises: w.exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      muscle: ex.muscle,
      sets: ex.setsData.filter(s => s.done).map(s => ({
        weight: Number(s.weight) || 0,
        reps: Number(s.reps) || 0,
        rir: s.rir !== "" ? Number(s.rir) : null,
        pain: !!ex.painFlag
      })),
      painFlag: !!ex.painFlag
    })),
    totalSets: completedSets.length,
    totalVolume
  };

  state.workoutHistory.unshift(record);
  state.activeWorkout = null;
  saveState(state);
  clearInterval(restTimerInterval);
  toast(`جلسه ذخیره شد · ${completedSets.length} ست · حجم ${Math.round(totalVolume)}`, "success");
  navigate("dashboard");
}

function cancelWorkout() {
  if (!confirm("جلسه لغو شود؟ داده‌های ثبت‌شده از بین می‌رود.")) return;
  state.activeWorkout = null;
  saveState(state);
  clearInterval(restTimerInterval);
  navigate("workouts");
}

// ---------- SUPPLEMENTS ----------
function getSuppEffectiveTime(s, def) {
  const wt = state.settings.preferredWorkoutTime || "17:00";
  if (s.autoTime !== false && (s.time == null || s.time === "")) {
    return computeSuppTime(def.timing, def.offsetMin, wt);
  }
  return s.time || (s.times && s.times[0]) || computeSuppTime(def.timing, def.offsetMin, wt);
}

function renderSupplements() {
  const today = getTodayStr();
  const wt = state.settings.preferredWorkoutTime || "17:00";
  const levels = [
    { key: "A", title: "سطح A — شواهد قوی / ضروری" },
    { key: "B", title: "سطح B — مفید (اختیاری)" },
    { key: "C", title: "سطح C — در صورت نیاز" },
    { key: "optional", title: "معمولاً غیرضروری (پیش‌فرض خاموش)" }
  ];
  let html = `
    <div class="card">
      <div class="card-title">ساعت تمرین شما</div>
      <p style="font-size:0.9rem;margin-bottom:8px">زمان‌بندی خودکار مکمل‌ها بر اساس این ساعت محاسبه می‌شود.</p>
      <div class="flex gap-1">
        <input class="form-input" type="time" id="supp-workout-time" value="${wt}" style="flex:1" />
        <button class="btn btn-primary" onclick="updateWorkoutTimeFromSupp()">اعمال</button>
      </div>
      <p class="text-muted mt-1" style="font-size:0.8rem">الان: ${wt} — قبل تمرین ≈ ${computeSuppTime("pre", -45, wt)} · بعد تمرین ≈ ${computeSuppTime("post", 30, wt)}</p>
    </div>
    <div class="card">
      <div class="card-title">برنامه امروز (مکمل‌های روشن)</div>
      <p style="font-size:0.85rem;margin-bottom:8px;color:var(--text-muted)">
        ${isWorkoutDay(state)
          ? "🏋️ روز تمرین — مکمل‌های قبل/بعد تمرین + روزانه"
          : "😴 روز استراحت / ریکاوری — فقط مکمل‌های روزانه (کراتین، ویتامین، ...). پری‌ورک‌اوت و بعد تمرین امروز لازم نیست."}
      </p>
      ${state.supplements.filter(s => {
        if (!s.enabled) return false;
        const def = SUPPLEMENT_CATALOG.find(p => p.id === s.id);
        if (!def) return false;
        if (isWorkoutDay(state)) return true;
        return isSuppOnRestDay(def.timing);
      }).map(s => {
        const def = SUPPLEMENT_CATALOG.find(p => p.id === s.id);
        if (!def) return "";
        const t = getSuppEffectiveTime(s, def);
        const taken = state.supplementLogs.some(l => l.date === today && l.suppId === s.id && l.taken);
        const dayTag = isSuppOnRestDay(def.timing) ? "" : " <span class=\"tag tag-primary\">فقط تمرین</span>";
        return `<div class="flex-between" style="padding:6px 0;border-bottom:1px solid var(--border);font-size:0.9rem">
          <span>${taken ? "✅" : "⏰"} <strong>${t}</strong> — ${def.name} (${s.dose} ${def.unit})${dayTag}</span>
          ${!taken ? `<button class="btn btn-sm btn-success" onclick="markSuppTaken('${s.id}')">مصرف</button>` : ""}
        </div>`;
      }).join("") || "<p class='text-muted'>هیچ مکملی روشن نیست</p>"}
    </div>
  `;
  levels.forEach(lv => {
    const items = state.supplements.filter(s => {
      const def = SUPPLEMENT_CATALOG.find(p => p.id === s.id);
      return def && def.level === lv.key;
    });
    if (!items.length) return;
    html += `<div class="card"><div class="card-title">${lv.title}</div>
      ${items.map(s => renderSuppCard(s, today)).join("")}
    </div>`;
  });
  html += `
    <button class="btn btn-secondary btn-block mt-1" onclick="showSuppSettings()">تنظیم دستی دوز و ساعت</button>
    <button class="btn btn-secondary btn-block mt-1" onclick="recalcAllSuppTimes()">بازت محاسبه همه زمان‌ها از روی ساعت تمرین</button>
  `;
  return html;
}

function renderSuppCard(s, today) {
  const def = SUPPLEMENT_CATALOG.find(p => p.id === s.id);
  if (!def) return "";
  const taken = state.supplementLogs.some(l => l.date === today && l.suppId === s.id && l.taken);
  const t = getSuppEffectiveTime(s, def);
  const timingLabel = TIMING_LABELS[def.timing] || def.timing;
  return `
    <div class="supp-item">
      <div class="supp-icon">${s.enabled ? (taken ? "✅" : "💊") : "⏸️"}</div>
      <div class="supp-info">
        <div class="supp-name">${def.name}</div>
        <div class="supp-dose">${s.dose} ${def.unit} · ${timingLabel} · <strong>${t}</strong>
          ${!s.enabled ? " (خاموش)" : ""} ${s.autoTime === false ? " (دستی)" : " (خودکار)"}
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${def.note}</div>
      </div>
      <div class="supp-actions" style="flex-direction:column">
        ${s.enabled && !taken ? `<button class="btn btn-sm btn-success" onclick="markSuppTaken('${s.id}')">مصرف</button>` : ""}
        <button class="btn btn-sm btn-secondary" onclick="toggleSupp('${s.id}')">${s.enabled ? "خاموش" : "روشن"}</button>
      </div>
    </div>`;
}

function markSuppTaken(id) {
  const today = getTodayStr();
  state.supplementLogs = state.supplementLogs.filter(l => !(l.date === today && l.suppId === id));
  state.supplementLogs.push({ date: today, suppId: id, time: new Date().toTimeString().slice(0, 5), taken: true });
  const s = state.supplements.find(x => x.id === id);
  if (s) s.lastTaken = new Date().toISOString();
  saveState(state);
  toast("مصرف ثبت شد", "success");
  render();
}

function toggleSupp(id) {
  const s = state.supplements.find(x => x.id === id);
  if (s) {
    s.enabled = !s.enabled;
    s.reminder = s.enabled;
    saveState(state);
    render();
  }
}

function updateWorkoutTimeFromSupp() {
  const v = $("#supp-workout-time")?.value;
  if (!v) return;
  state.settings.preferredWorkoutTime = v;
  // auto-recalc times for autoTime supplements
  state.supplements.forEach(s => {
    const def = SUPPLEMENT_CATALOG.find(p => p.id === s.id);
    if (!def) return;
    if (s.autoTime !== false) {
      s.time = computeSuppTime(def.timing, def.offsetMin, v);
      s.times = [s.time];
    }
  });
  saveState(state);
  toast("ساعت تمرین و زمان مکمل‌ها به‌روز شد", "success");
  render();
}

function recalcAllSuppTimes() {
  const v = state.settings.preferredWorkoutTime || "17:00";
  state.supplements.forEach(s => {
    const def = SUPPLEMENT_CATALOG.find(p => p.id === s.id);
    if (!def) return;
    s.autoTime = true;
    s.time = computeSuppTime(def.timing, def.offsetMin, v);
    s.times = [s.time];
  });
  saveState(state);
  toast("همه زمان‌ها از نو محاسبه شد", "success");
  render();
}

function showSuppSettings() {
  const wt = state.settings.preferredWorkoutTime || "17:00";
  const html = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal-sheet">
        <div class="modal-title">دوز و ساعت مکمل‌ها</div>
        <p class="text-muted" style="font-size:0.85rem;margin-bottom:12px">اگر ساعت را خالی بگذارید، از روی ساعت تمرین (${wt}) خودکار حساب می‌شود.</p>
        ${state.supplements.map(s => {
          const def = SUPPLEMENT_CATALOG.find(p => p.id === s.id);
          if (!def) return "";
          const t = getSuppEffectiveTime(s, def);
          return `
            <div class="form-group">
              <label class="form-label">${def.name} <span class="tag tag-accent">${TIMING_LABELS[def.timing] || ""}</span></label>
              <div class="grid-2">
                <input class="form-input" type="number" step="0.1" value="${s.dose}" id="dose-${s.id}" placeholder="دوز" />
                <input class="form-input" type="time" value="${s.autoTime === false ? (s.time || t) : t}" id="time-${s.id}" />
              </div>
              <label style="font-size:0.8rem;display:flex;align-items:center;gap:6px;margin-top:4px">
                <input type="checkbox" id="auto-${s.id}" ${s.autoTime !== false ? "checked" : ""} /> زمان خودکار از ساعت تمرین
              </label>
            </div>`;
        }).join("")}
        <button class="btn btn-primary btn-block" onclick="saveSuppSettings()">ذخیره</button>
        <button class="btn btn-secondary btn-block mt-1" onclick="closeModal()">بستن</button>
      </div>
    </div>`;
  $("#modal-root").innerHTML = html;
}

function saveSuppSettings() {
  state.supplements.forEach(s => {
    const doseEl = document.getElementById("dose-" + s.id);
    const timeEl = document.getElementById("time-" + s.id);
    const autoEl = document.getElementById("auto-" + s.id);
    if (doseEl) s.dose = Number(doseEl.value) || s.dose;
    if (autoEl) s.autoTime = autoEl.checked;
    if (timeEl && !s.autoTime) {
      s.time = timeEl.value;
      s.times = [timeEl.value];
    } else if (s.autoTime) {
      const def = SUPPLEMENT_CATALOG.find(p => p.id === s.id);
      if (def) {
        s.time = computeSuppTime(def.timing, def.offsetMin, state.settings.preferredWorkoutTime || "17:00");
        s.times = [s.time];
      }
    }
  });
  saveState(state);
  closeModal();
  toast("تنظیمات مکمل ذخیره شد", "success");
  render();
}

// ---------- PROGRESS / BODY ----------
function renderProgress() {
  const logs = [...state.bodyLogs].sort((a, b) => b.date.localeCompare(a.date));
  const latest = logs[0];
  return `
    <div class="card">
      <div class="card-title">ثبت اندازه‌های جدید</div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">وزن (کیلو)</label>
          <input class="form-input" type="number" step="0.1" id="log-weight" value="${state.profile.weight}" />
        </div>
        <div class="form-group">
          <label class="form-label">دور کمر (سم)</label>
          <input class="form-input" type="number" step="0.1" id="log-waist" />
        </div>
        <div class="form-group">
          <label class="form-label">دور بازو</label>
          <input class="form-input" type="number" step="0.1" id="log-arm" />
        </div>
        <div class="form-group">
          <label class="form-label">دور شانه</label>
          <input class="form-input" type="number" step="0.1" id="log-shoulder" />
        </div>
        <div class="form-group">
          <label class="form-label">دور سینه</label>
          <input class="form-input" type="number" step="0.1" id="log-chest" />
        </div>
        <div class="form-group">
          <label class="form-label">دور ران</label>
          <input class="form-input" type="number" step="0.1" id="log-thigh" />
        </div>
      </div>
      <button class="btn btn-primary btn-block" onclick="saveBodyLog()">ثبت</button>
    </div>

    ${logs.length ? `
      <div class="card">
        <div class="card-title">روند وزن (آخرین ثبت‌ها)</div>
        <div class="chart-container">
          <div class="chart-bars">
            ${logs.slice(0, 12).reverse().map(l => {
              const max = Math.max(...logs.map(x => x.weight || 0), 1);
              const h = ((l.weight || 0) / max) * 100;
              return `<div class="chart-bar" style="height:${Math.max(h, 5)}%"><span>${l.weight}</span></div>`;
            }).join("")}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">تاریخچه اندازه‌ها</div>
        ${logs.slice(0, 15).map(l => `
          <div class="history-item">
            <div class="flex-between">
              <strong>${formatDate(l.date)}</strong>
              <span>${l.weight} کیلو</span>
            </div>
            <div class="text-muted" style="font-size:0.85rem">
              ${l.waist ? `کمر ${l.waist}` : ""} ${l.arm ? `· بازو ${l.arm}` : ""} ${l.shoulder ? `· شانه ${l.shoulder}` : ""}
            </div>
          </div>
        `).join("")}
      </div>
    ` : `<div class="empty-state"><div class="icon">📏</div><p>هنوز اندازه‌ای ثبت نشده</p></div>`}
  `;
}

function saveBodyLog() {
  const weight = Number($("#log-weight")?.value);
  if (!weight) { toast("وزن را وارد کنید", "warning"); return; }
  const log = {
    date: getTodayStr(),
    weight,
    waist: Number($("#log-waist")?.value) || null,
    arm: Number($("#log-arm")?.value) || null,
    shoulder: Number($("#log-shoulder")?.value) || null,
    chest: Number($("#log-chest")?.value) || null,
    thigh: Number($("#log-thigh")?.value) || null
  };
  state.bodyLogs = state.bodyLogs.filter(l => l.date !== log.date);
  state.bodyLogs.push(log);
  state.profile.weight = weight;
  saveState(state);
  toast("اندازه‌ها ذخیره شد", "success");
  render();
}

// ---------- HISTORY ----------
function renderHistory() {
  const list = state.workoutHistory;
  if (!list.length) return `<div class="empty-state"><div class="icon">📋</div><p>هنوز جلسه‌ای ثبت نشده</p></div>`;
  return list.map(w => {
    const sess = getActiveProgram(state).sessions.find(s => s.id === w.sessionId);
    return `
      <div class="card">
        <div class="flex-between">
          <div>
            <div style="font-weight:700;color:${sess?.color || "var(--text)"}">${sess?.name || "جلسه"}</div>
            <div class="text-muted" style="font-size:0.85rem">${formatDate(w.date)} · ${formatTime(w.durationSec || 0)} · ${w.totalSets} ست</div>
          </div>
          <span class="tag tag-success">${Math.round(w.totalVolume || 0)} حجم</span>
        </div>
        ${w.notes ? `<p style="font-size:0.85rem;margin-top:6px">${w.notes}</p>` : ""}
        <div style="margin-top:8px;font-size:0.8rem">
          ${w.exercises.filter(e => e.sets.length).map(e =>
            `<div>${e.name}: ${e.sets.map(s => `${s.weight}×${s.reps}`).join(", ")}</div>`
          ).join("")}
        </div>
      </div>`;
  }).join("");
}

// ---------- NUTRITION ----------
function renderNutrition() {
  const today = getTodayStr();
  const log = state.nutritionLogs.find(l => l.date === today) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const targetP = state.profile.goals.protein || 180;
  return `
    <div class="card">
      <div class="card-title">اهداف تغذیه (کات)</div>
      <p style="font-size:0.9rem;line-height:1.7">
        کسری کالری: ${PROGRAM.nutritionTargets.calorieDeficit}<br>
        پروتئین: ${PROGRAM.nutritionTargets.protein}<br>
        کاهش وزن هدف: ${PROGRAM.nutritionTargets.weightLossPerWeek}/هفته<br>
        قدم روزانه: ${PROGRAM.nutritionTargets.steps}
      </p>
    </div>
    <div class="card">
      <div class="card-title">ثبت امروز (${formatDate(today)})</div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">کالری</label>
          <input class="form-input" type="number" id="nut-cal" value="${log.calories || ""}" />
        </div>
        <div class="form-group">
          <label class="form-label">پروتئین (گرم)</label>
          <input class="form-input" type="number" id="nut-pro" value="${log.protein || ""}" />
        </div>
        <div class="form-group">
          <label class="form-label">کربوهیدرات</label>
          <input class="form-input" type="number" id="nut-carb" value="${log.carbs || ""}" />
        </div>
        <div class="form-group">
          <label class="form-label">چربی</label>
          <input class="form-input" type="number" id="nut-fat" value="${log.fat || ""}" />
        </div>
      </div>
      <div class="progress-bar mb-1"><div class="progress-fill" style="width:${Math.min(100, ((log.protein || 0) / targetP) * 100)}%"></div></div>
      <p class="text-muted" style="font-size:0.85rem">پروتئین: ${log.protein || 0} / ${targetP} گرم</p>
      <button class="btn btn-primary btn-block mt-1" onclick="saveNutrition()">ذخیره تغذیه امروز</button>
    </div>
  `;
}

function saveNutrition() {
  const today = getTodayStr();
  const entry = {
    date: today,
    calories: Number($("#nut-cal")?.value) || 0,
    protein: Number($("#nut-pro")?.value) || 0,
    carbs: Number($("#nut-carb")?.value) || 0,
    fat: Number($("#nut-fat")?.value) || 0
  };
  state.nutritionLogs = state.nutritionLogs.filter(l => l.date !== today);
  state.nutritionLogs.push(entry);
  saveState(state);
  toast("تغذیه ذخیره شد", "success");
  render();
}

// ---------- SETTINGS ----------
function renderSettings() {
  const lims = state.profile.limitations || [];
  const daysLocked = Array.isArray(state.settings.workoutDays) && state.settings.workoutDays.length > 0
    && state.profile.sessionsPerWeek !== "auto";
  const days = daysLocked ? state.settings.workoutDays : [];
  const theme = state.settings.theme || "dark";
  const aiMode = !daysLocked;
  const dayChecks = IR_WEEK_ORDER.map(d => {
    const checked = days.includes(d) ? "checked" : "";
    return `<label class="day-check"><input type="checkbox" class="set-wday" value="${d}" ${checked} /> ${DAY_NAMES_FA[d]}</label>`;
  }).join("");
  const schedulePreview = IR_WEEK_ORDER.map(d => {
    if (aiMode) {
      return `<div class="week-day-cell"><div class="week-day-name">${DAY_NAMES_SHORT[d]}</div><div class="week-day-rest">AI</div></div>`;
    }
    const map = buildDaySessionMap(state);
    const sid = map[d];
    if (sid == null) {
      return `<div class="week-day-cell"><div class="week-day-name">${DAY_NAMES_SHORT[d]}</div><div class="week-day-rest">—</div></div>`;
    }
    const sess = getActiveProgram(state).sessions.find(s => s.id === sid);
    return `<div class="week-day-cell week-day-train"><div class="week-day-name">${DAY_NAMES_SHORT[d]}</div><div class="week-day-sess" style="color:${sess?.color || "var(--primary)"}">${(sess?.shortName || "").replace("جلسه ","ج")}</div></div>`;
  }).join("");
  return `
    <div class="card">
      <div class="card-title">ظاهر برنامه</div>
      <div class="flex-between">
        <span>تم ${theme === "light" ? "روشن" : "تاریک"}</span>
        <button class="btn btn-secondary btn-sm" onclick="toggleTheme()">${theme === "light" ? "🌙 تاریک" : "☀️ روشن"}</button>
      </div>
    </div>
    <div class="card">
      <div class="card-title">پروفایل</div>
      <div class="form-group">
        <label class="form-label">نام</label>
        <input class="form-input" id="set-name" value="${state.profile.name}" />
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">وزن فعلی</label>
          <input class="form-input" type="number" step="0.1" id="set-weight" value="${state.profile.weight}" />
        </div>
        <div class="form-group">
          <label class="form-label">هدف پروتئین</label>
          <input class="form-input" type="number" id="set-protein" value="${state.profile.goals.protein}" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">تاریخ شروع برنامه</label>
        <input class="form-input" type="date" id="set-start" value="${state.profile.startDate}" />
      </div>
    </div>
    <div class="card">
      <div class="card-title">روزهای تمرین (هفته ایرانی · شنبه تا جمعه)</div>
      <p style="font-size:0.85rem;margin-bottom:8px;color:var(--text-muted)">
        ${aiMode
          ? "🤖 فعلاً به هوش مصنوعی واگذار شده — بعد از وارد کردن خروجی AI، روزها تنظیم می‌شوند. اگر خودتان روزها را تیک بزنید، همان‌ها در پرامپت قفل می‌شوند."
          : "روزهای انتخاب‌شده در پرامپت قفل می‌شوند. برای واگذاری به AI همه تیک‌ها را بردارید یا دکمه زیر را بزنید."}
      </p>
      <div class="day-check-grid">${dayChecks}</div>
      <button class="btn btn-secondary btn-sm btn-block mt-1" onclick="applySuggestedDays()">🤖 واگذاری تعداد و روزها به هوش مصنوعی</button>
      <div class="card-title mt-2">پیش‌نمایش هفته</div>
      <div class="week-schedule">${schedulePreview}</div>
    </div>
    <div class="card">
      <div class="card-title">زمان تمرین</div>
      <input class="form-input" type="time" id="set-wtime" value="${state.settings.preferredWorkoutTime}" />
      <div class="form-group mt-1">
        <label class="form-label">یادآوری چند دقیقه قبل</label>
        <input class="form-input" type="number" id="set-remind" value="${state.settings.reminderMinutesBefore}" />
      </div>
    </div>
    <div class="card">
      <div class="card-title">آلارم صوتی و یادآوری</div>
      <label class="chip-check"><input type="checkbox" id="set-sound-rest" ${state.settings.restTimerSound !== false ? "checked" : ""} /><span>صدای پایان تایمر استراحت</span></label>
      <label class="chip-check"><input type="checkbox" id="set-sound-supp" ${state.settings.supplementSound !== false ? "checked" : ""} /><span>صدای یادآوری مکمل</span></label>
      <label class="chip-check"><input type="checkbox" id="set-sound-workout" ${state.settings.workoutReminderSound !== false ? "checked" : ""} /><span>صدای یادآوری جلسه تمرین</span></label>
      <button type="button" class="btn btn-secondary btn-sm btn-block mt-1" onclick="testAppSounds()">تست صداها</button>
      <button type="button" class="btn btn-secondary btn-sm btn-block mt-1" onclick="enableNotifications()">فعال‌سازی اعلان سیستم</button>
      <p class="text-muted" style="font-size:0.75rem;margin-top:8px">یادآوری‌ها وقتی اپ باز است بررسی می‌شوند. برای اعلان پس‌زمینه، مجوز اعلان را بدهید.</p>
    </div>
    <div class="card">
      <div class="card-title">محدودیت‌های ثبت‌شده</div>
      <p style="font-size:0.9rem">${lims.length ? lims.join("، ") : "موردی ثبت نشده"}</p>
      <button class="btn btn-secondary btn-block mt-1" onclick="navigate('coach')">ویرایش در مربی هوشمند</button>
    </div>
    <button class="btn btn-primary btn-block" onclick="saveSettings()">ذخیره تنظیمات</button>
    <button class="btn btn-danger btn-block mt-2" onclick="resetAllData()">پاک کردن تمام داده‌ها</button>
    <p class="text-muted text-center mt-2" style="font-size:0.8rem">نسخه ۲.۲ · هفته ایرانی · مربی سطح جهانی</p>
  `;
}

function saveSettings() {
  state.profile.name = $("#set-name")?.value || state.profile.name;
  state.profile.weight = Number($("#set-weight")?.value) || state.profile.weight;
  state.profile.goals.protein = Number($("#set-protein")?.value) || 180;
  state.profile.startDate = $("#set-start")?.value || state.profile.startDate;
  state.settings.preferredWorkoutTime = $("#set-wtime")?.value || "17:00";
  state.settings.reminderMinutesBefore = Number($("#set-remind")?.value) || 30;
  state.settings.restTimerSound = !!$("#set-sound-rest")?.checked;
  state.settings.supplementSound = !!$("#set-sound-supp")?.checked;
  state.settings.workoutReminderSound = !!$("#set-sound-workout")?.checked;
  // روزهای تمرین: اگر تیکی نباشد → واگذاری به AI
  const checked = sortIranWeekDays($$(".set-wday:checked").map(el => Number(el.value)));
  if (checked.length) {
    state.settings.workoutDays = checked;
    state.profile.sessionsPerWeek = checked.length;
  } else {
    state.settings.workoutDays = [];
    state.profile.sessionsPerWeek = "auto";
  }
  // همگام‌سازی زمان مکمل‌ها
  const wt = state.settings.preferredWorkoutTime;
  state.supplements.forEach(s => {
    const def = SUPPLEMENT_CATALOG.find(p => p.id === s.id);
    if (def && s.autoTime !== false) {
      s.time = computeSuppTime(def.timing, def.offsetMin, wt);
      s.times = [s.time];
    }
  });
  saveState(state);
  toast("تنظیمات ذخیره شد", "success");
  render();
}

function applySuggestedDays() {
  // واگذاری کامل به AI: هیچ روزی از قبل قفل نشود
  state.settings.workoutDays = [];
  state.profile.sessionsPerWeek = "auto";
  saveState(state);
  toast("تعداد جلسات و روزها به هوش مصنوعی واگذار شد", "success");
  render();
}

/** اگر کاربر تعداد مشخص کرده، الگوی ریکاوری ایرانی پیشنهاد بده (بدون اجبار AI) */
function applyRecoveryPatternForCount(n) {
  const count = Math.min(6, Math.max(2, Number(n) || 0));
  if (!count) {
    applySuggestedDays();
    return;
  }
  state.profile.sessionsPerWeek = count;
  state.settings.workoutDays = suggestWorkoutDays(count);
  const prog = getActiveProgram(state);
  const sessIds = (prog.sessions || []).map(s => s.id);
  state.settings.sessionOrder = sessIds.slice(0, count);
  while (state.settings.sessionOrder.length < count) {
    state.settings.sessionOrder.push(sessIds[state.settings.sessionOrder.length % sessIds.length] || 1);
  }
  saveState(state);
  toast(`الگوی ${count} جلسه با ریکاوری پیشنهاد شد — در صورت تمایل ذخیره کنید`, "success");
  render();
}

function resetAllData() {
  if (!confirm("همه داده‌ها پاک شود؟ این عمل برگشت‌ناپذیر است.")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  toast("داده‌ها پاک شد", "warning");
  navigate("dashboard");
}

// ---------- REPORTS ----------
function renderReports() {
  const week = getWeekNumber(state.profile.startDate);
  const done = state.workoutHistory.filter(w => w.completed).length;
  const startW = state.profile.startWeight || 94;
  const latest = [...state.bodyLogs].sort((a, b) => b.date.localeCompare(a.date))[0];
  const weightChange = latest ? (latest.weight - startW).toFixed(1) : "—";
  const waistChange = latest?.waist && state.profile.startWaist
    ? (latest.waist - state.profile.startWaist).toFixed(1)
    : "—";

  return `
    <div class="card">
      <div class="card-title">خلاصه ${week} هفته</div>
      <div class="grid-2">
        <div><div class="text-muted">جلسات</div><div class="card-value">${done}</div></div>
        <div><div class="text-muted">تغییر وزن</div><div class="card-value">${weightChange} کیلو</div></div>
      </div>
      <div class="mt-2">
        <div class="text-muted">پایبندی تقریبی</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, (done / (week * 4)) * 100)}%"></div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">رکوردهای قدرتی (حجم ست)</div>
      ${Object.keys(state.exercisePRs).length ? Object.entries(state.exercisePRs).slice(0, 12).map(([id, pr]) => {
        const name = getActiveProgram(state).sessions.flatMap(s => s.exercises).find(e => e.id === id)?.name || id;
        return `<div class="history-item flex-between"><span>${name}</span><span>${pr.weight}×${pr.reps}</span></div>`;
      }).join("") : "<p class='text-muted'>هنوز رکوردی نیست</p>"}
    </div>
    ${week >= 6 ? `
      <div class="card" style="border-color:var(--warning)">
        <p>زمان ارزیابی رسمی برنامه است. قدرت، دور کمر، دور بازو/شانه و پایبندی را بررسی کنید. در صورت نیاز برنامه را با مربی/فیزیوتراپیست بازبینی کنید.</p>
      </div>
    ` : ""}
  `;
}

// ---------- MORE ----------

// ---------- MORE ----------
function renderMore() {
  const prog = getActiveProgram(state);
  const isCustom = !!(state.customProgram && state.customProgram.sessions);
  return `
    <div class="creator-card featured anim-fade-up">
      <div class="creator-badge">سازنده اپلیکیشن</div>
      <div class="creator-avatar">AZ</div>
      <div class="creator-name">امین زیدی</div>
      <div class="creator-role">مربی رسمی فدراسیون پرورش اندام ایران</div>
      <p class="creator-bio">طراحی برنامه تمرینی ایمن و علمی با تمرکز بر هایپرتروفی، کات و محدودیت‌های اسکلتی-عضلانی.</p>
      <div class="creator-actions">
        <a class="creator-btn primary" href="tel:09981455945">📞 تماس مستقیم</a>
        <button type="button" class="creator-btn wa" onclick="openExternalLink('https://wa.me/989981455945')">واتساپ</button>
        <button type="button" class="creator-btn tg" onclick="openExternalLink('https://t.me/+989981455945')">تلگرام</button>
      </div>
      <div class="creator-phone" dir="ltr">0998 145 5945</div>
    </div>

    <div class="section-label anim-fade-up delay-1">منو</div>
    <div class="menu-list anim-fade-up delay-1">
      <button type="button" class="menu-item" onclick="navigate('coach')"><span class="mi-icon">🧠</span><span class="mi-text"><strong>مربی هوشمند</strong><small>ساخت و به‌روزرسانی برنامه با AI</small></span><span class="mi-chev">‹</span></button>
      <button type="button" class="menu-item" onclick="navigate('infographic-prompt')"><span class="mi-icon">🎨</span><span class="mi-text"><strong>اینفوگرافیک برنامه</strong><small>پرامپت پوستر هفتگی</small></span><span class="mi-chev">‹</span></button>
      <button type="button" class="menu-item" onclick="navigate('history')"><span class="mi-icon">📜</span><span class="mi-text"><strong>تاریخچه تمرین</strong><small>جلسات و رکوردها</small></span><span class="mi-chev">‹</span></button>
      <button type="button" class="menu-item" onclick="navigate('nutrition')"><span class="mi-icon">🍽️</span><span class="mi-text"><strong>تغذیه</strong><small>کالری و پروتئین</small></span><span class="mi-chev">‹</span></button>
      <button type="button" class="menu-item" onclick="navigate('reports')"><span class="mi-icon">📈</span><span class="mi-text"><strong>گزارش‌ها</strong><small>ارزیابی دوره‌ای</small></span><span class="mi-chev">‹</span></button>
      <button type="button" class="menu-item" onclick="navigate('settings')"><span class="mi-icon">⚙️</span><span class="mi-text"><strong>تنظیمات</strong><small>تم، روزها، پروفایل</small></span><span class="mi-chev">‹</span></button>
    </div>

    <div class="card anim-fade-up delay-2">
      <div class="card-title">برنامه فعال</div>
      <p style="font-size:0.9rem;margin-bottom:8px">${prog.name || "—"} · ${(prog.sessions || []).length} جلسه · ${prog.weeks || "?"} هفته ${isCustom ? "· سفارشی" : ""}</p>
      <button class="btn btn-secondary btn-block" onclick="exportProgram()">کپی JSON برنامه</button>
      <button class="btn btn-secondary btn-block mt-1" onclick="showProgramImport()">وارد کردن JSON</button>
      ${isCustom ? `<button class="btn btn-danger btn-block mt-1" onclick="resetToDefaultProgram()">بازگشت به برنامه پیش‌فرض</button>` : ""}
    </div>
  `;
}

// ---------- AI COACH FLOW ----------
const LIMITATION_OPTIONS = [
  { id: "l4l5", label: "دیسک کمر L4-L5 / کمردرد" },
  { id: "knee", label: "مشکل زانو" },
  { id: "shoulder", label: "مشکل شانه" },
  { id: "elbow", label: "مشکل آرنج" },
  { id: "hypertension", label: "فشار خون" },
  { id: "none", label: "بدون محدودیت خاص" }
];

const GOAL_OPTIONS = [
  { id: "shoulder", label: "حجم و فرم سرشانه" },
  { id: "arms", label: "حجم بازو" },
  { id: "chest", label: "سینه" },
  { id: "back", label: "پشت / عرض" },
  { id: "legs", label: "پا" },
  { id: "fatloss", label: "کاهش چربی شکم و پهلو" },
  { id: "retain", label: "حفظ توده عضلانی در کات" },
  { id: "strength", label: "قدرت" },
  { id: "general", label: "آمادگی عمومی" }
];

function renderCoach() {
  const pr = state.profile;
  const lims = pr.limitations || [];
  const goals = pr.trainingGoals || [];
  const daysLocked = Array.isArray(state.settings.workoutDays) && state.settings.workoutDays.length > 0
    && pr.sessionsPerWeek !== "auto" && pr.sessionsPerWeek != null;
  const days = daysLocked ? state.settings.workoutDays : [];
  const dayChecks = IR_WEEK_ORDER.map(d => {
    const checked = days.includes(d) ? "checked" : "";
    return `<label class="day-check"><input type="checkbox" class="c-wday" value="${d}" ${checked} /> ${DAY_NAMES_FA[d]}</label>`;
  }).join("");
  const sessIsAuto = pr.sessionsPerWeek === "auto" || pr.sessionsPerWeek == null || !daysLocked;
  const sel = (id, val) => (String(pr[id] ?? "") === String(val) ? "selected" : "");

  return `
    <div class="card" style="border-color:var(--accent)">
      <div class="card-title">🧠 مربی هوشمند</div>
      <p style="font-size:0.9rem;line-height:1.65;margin:0">
        هرچه اطلاعات کامل‌تر باشد، برنامه دقیق‌تر می‌شود. همه فیلدها در همین صفحه است.
      </p>
      <div class="coach-steps mt-2">
        <span class="coach-step active">۱ مشخصات</span>
        <span class="coach-step">۲ پرامپت</span>
        <span class="coach-step">۳ وارد کردن</span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">پروفایل بدنی</div>
      <div class="form-group">
        <label class="form-label">نام</label>
        <input class="form-input" id="c-name" value="${pr.name || ""}" placeholder="نام شما" />
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">سن</label>
          <input class="form-input" type="number" id="c-age" value="${pr.age || ""}" />
        </div>
        <div class="form-group">
          <label class="form-label">جنسیت</label>
          <select class="form-select" id="c-gender">
            <option value="male" ${pr.gender!=="female"?"selected":""}>مرد</option>
            <option value="female" ${pr.gender==="female"?"selected":""}>زن</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">وزن (کیلو)</label>
          <input class="form-input" type="number" step="0.1" id="c-weight" value="${pr.weight || ""}" />
        </div>
        <div class="form-group">
          <label class="form-label">قد (سم)</label>
          <input class="form-input" type="number" id="c-height" value="${pr.height || ""}" />
        </div>
        <div class="form-group">
          <label class="form-label">دور کمر (سم، اختیاری)</label>
          <input class="form-input" type="number" step="0.1" id="c-waist" value="${pr.waistCm || ""}" placeholder="مثلاً ۹۲" />
        </div>
        <div class="form-group">
          <label class="form-label">تخمین چربی بدن ٪</label>
          <input class="form-input" type="number" step="0.1" id="c-bf" value="${pr.bodyFatEstimate || ""}" placeholder="اختیاری" />
        </div>
        <div class="form-group">
          <label class="form-label">سابقه تمرین (سال)</label>
          <input class="form-input" type="number" id="c-exp" value="${pr.experienceYears ?? 0}" />
        </div>
        <div class="form-group">
          <label class="form-label">ساعت تمرین معمول</label>
          <input class="form-input" type="time" id="c-wtime" value="${state.settings.preferredWorkoutTime || "17:00"}" />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">سبک زندگی و ریکاوری</div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">سطح فعالیت روزانه</label>
          <select class="form-select" id="c-activity">
            <option value="sedentary" ${pr.activityLevel==="sedentary"?"selected":""}>کم‌تحرک (نشسته)</option>
            <option value="light" ${pr.activityLevel==="light"?"selected":""}>سبک</option>
            <option value="moderate" ${!pr.activityLevel||pr.activityLevel==="moderate"?"selected":""}>متوسط</option>
            <option value="high" ${pr.activityLevel==="high"?"selected":""}>بالا / شغل فیزیکی</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">نوع شغل</label>
          <select class="form-select" id="c-job">
            <option value="desk" ${!pr.jobActivity||pr.jobActivity==="desk"?"selected":""}>اداری / نشسته</option>
            <option value="standing" ${pr.jobActivity==="standing"?"selected":""}>ایستاده / متحرک</option>
            <option value="physical" ${pr.jobActivity==="physical"?"selected":""}>کار بدنی سنگین</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">خواب شبانه (ساعت)</label>
          <input class="form-input" type="number" step="0.5" id="c-sleep" value="${pr.sleepHours ?? 7}" />
        </div>
        <div class="form-group">
          <label class="form-label">استرس کلی</label>
          <select class="form-select" id="c-stress">
            <option value="low" ${pr.stressLevel==="low"?"selected":""}>کم</option>
            <option value="medium" ${!pr.stressLevel||pr.stressLevel==="medium"?"selected":""}>متوسط</option>
            <option value="high" ${pr.stressLevel==="high"?"selected":""}>زیاد</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">کیفیت ریکاوری</label>
          <select class="form-select" id="c-recovery">
            <option value="low" ${pr.recoveryQuality==="low"?"selected":""}>ضعیف</option>
            <option value="medium" ${!pr.recoveryQuality||pr.recoveryQuality==="medium"?"selected":""}>متوسط</option>
            <option value="high" ${pr.recoveryQuality==="high"?"selected":""}>خوب</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">سبک تمرینی مطلوب</label>
          <select class="form-select" id="c-style">
            <option value="hypertrophy" ${!pr.trainStyle||pr.trainStyle==="hypertrophy"?"selected":""}>هایپرتروفی / فرم</option>
            <option value="strength" ${pr.trainStyle==="strength"?"selected":""}>قدرت</option>
            <option value="mixed" ${pr.trainStyle==="mixed"?"selected":""}>ترکیبی</option>
            <option value="recomp" ${pr.trainStyle==="recomp"?"selected":""}>ریکامپ (چربی↓ عضله↑)</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">محدودیت‌ها و آسیب‌ها</div>
      <p class="text-muted" style="font-size:0.8rem;margin-bottom:8px">هر مورد مرتبط را علامت بزنید.</p>
      <div class="chip-grid">
      ${LIMITATION_OPTIONS.map(o => `
        <label class="chip-check">
          <input type="checkbox" class="c-lim" value="${o.id}" ${lims.includes(o.id) || (o.id==="none" && !lims.length) ? "checked" : ""} />
          <span>${o.label}</span>
        </label>`).join("")}
      </div>
    </div>

    <div class="card">
      <div class="card-title">اهداف تمرینی</div>
      <div class="chip-grid">
      ${GOAL_OPTIONS.map(o => `
        <label class="chip-check">
          <input type="checkbox" class="c-goal" value="${o.id}" ${goals.includes(o.id)?"checked":""} />
          <span>${o.label}</span>
        </label>`).join("")}
      </div>
    </div>

    <div class="card">
      <div class="card-title">جلسات، روزها و تجهیزات</div>
      <p class="text-muted" style="font-size:0.8rem;margin-bottom:10px;line-height:1.5">
        اگر «به انتخاب AI» باشد، تعداد و روزها قفل نمی‌شود.
      </p>
      <div class="form-group">
        <label class="form-label">تعداد جلسات در هفته</label>
        <select class="form-select" id="c-sessions" onchange="onCoachSessionsChange()">
          <option value="auto" ${sessIsAuto?"selected":""}>🤖 به انتخاب هوش مصنوعی</option>
          ${[3,4,5,6].map(n => `<option value="${n}" ${!sessIsAuto && Number(pr.sessionsPerWeek)===n?"selected":""}>${n} جلسه</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">روزهای تمرین (شنبه تا جمعه)</label>
        <div class="day-check-grid" id="c-days-wrap">${dayChecks}</div>
        <button type="button" class="btn btn-secondary btn-sm btn-block mt-1" onclick="clearCoachDays()">🤖 پاک کردن تیک‌ها — واگذاری به AI</button>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">مدت هر جلسه</label>
          <select class="form-select" id="c-duration">
            <option value="auto" ${pr.sessionDuration==="auto"||pr.sessionDuration==null?"selected":""}>🤖 انتخاب AI</option>
            <option value="45" ${pr.sessionDuration==45?"selected":""}>≈ ۴۵ دقیقه</option>
            <option value="60" ${pr.sessionDuration==60?"selected":""}>≈ ۶۰ دقیقه</option>
            <option value="70" ${pr.sessionDuration==70?"selected":""}>≈ ۷۰ دقیقه</option>
            <option value="75" ${pr.sessionDuration==75?"selected":""}>≈ ۷۵ دقیقه</option>
            <option value="90" ${pr.sessionDuration==90?"selected":""}>≈ ۹۰ دقیقه</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">طول دوره</label>
          <select class="form-select" id="c-weeks">
            <option value="auto" ${pr.planWeeks==="auto"?"selected":""}>🤖 انتخاب AI</option>
            <option value="4" ${pr.planWeeks==4?"selected":""}>۴ هفته</option>
            <option value="6" ${pr.planWeeks==6?"selected":""}>۶ هفته</option>
            <option value="8" ${pr.planWeeks==8||pr.planWeeks==null||pr.planWeeks===""?"selected":""}>۸ هفته</option>
            <option value="12" ${pr.planWeeks==12?"selected":""}>۱۲ هفته</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">تجهیزات</label>
        <select class="form-select" id="c-equip">
          <option value="gym" ${pr.equipment!=="home"&&pr.equipment!=="machines"?"selected":""}>باشگاه کامل</option>
          <option value="home" ${pr.equipment==="home"?"selected":""}>خانگی / محدود</option>
          <option value="machines" ${pr.equipment==="machines"?"selected":""}>عمدتاً دستگاه و سیم‌کش</option>
        </select>
      </div>
    </div>

    <div class="card">
      <div class="card-title">تغذیه (برای پرامپت)</div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">هدف پروتئین (گرم/روز)</label>
          <input class="form-input" type="number" id="c-protein" value="${pr.goals?.protein || 180}" />
        </div>
        <div class="form-group">
          <label class="form-label">کسری کالری تقریبی</label>
          <input class="form-input" type="number" id="c-deficit" value="${pr.goals?.deficit || 400}" placeholder="مثلاً 400" />
        </div>
      </div>
    </div>

    <div class="card" style="border-color:rgba(251,146,60,0.45)">
      <div class="card-title">📷 تصاویر بدن (اختیاری)</div>
      <label class="chip-check">
        <input type="checkbox" id="c-photos" ${pr.includeBodyPhotos ? "checked" : ""} />
        <span>همراه پرامپت، تحلیل تصاویر بدن هم درخواست شود</span>
      </label>
      <p class="text-muted" style="font-size:0.8rem;line-height:1.55;margin-top:10px">
        اگر تیک بزنید، در پرامپت نوشته می‌شود که AI تصاویر جلو / پهلو / پشت را تحلیل کند.
        بعد از کپی پرامپت، همان تصاویر را در ChatGPT یا Gemini <strong>ضمیمه</strong> کنید.
      </p>
    </div>

    <div class="card">
      <div class="card-title">توضیح اضافه برای مربی AI</div>
      <textarea class="form-input" id="c-extra" rows="3" placeholder="مثلاً: تمرکز روی دلتوئید میانی، باشگاه شلوغ عصرها، ترجیح دستگاه...">${pr.extraNotes || ""}</textarea>
    </div>

    <div class="coach-actions">
      <button class="btn btn-primary btn-lg btn-block" onclick="saveCoachProfileAndPrompt()">ذخیره و ساخت پرامپت AI</button>
      <button class="btn btn-secondary btn-block mt-1" onclick="navigate('coach-import')">از قبل خروجی AI دارم → وارد کردن</button>
    </div>
  `;
}


function saveCoachProfileAndPrompt() {
  const lims = [...document.querySelectorAll(".c-lim:checked")].map(el => el.value).filter(v => v !== "none");
  const goals = [...document.querySelectorAll(".c-goal:checked")].map(el => el.value);
  const dayChecks = sortIranWeekDays([...document.querySelectorAll(".c-wday:checked")].map(el => Number(el.value)));
  const sessVal = $("#c-sessions")?.value || "auto";
  const durVal = $("#c-duration")?.value || "auto";
  const weeksVal = $("#c-weeks")?.value || "auto";

  state.profile.name = ($("#c-name")?.value || "").trim() || state.profile.name || "کاربر";
  state.profile.age = Number($("#c-age")?.value) || state.profile.age;
  state.profile.gender = $("#c-gender")?.value || "male";
  state.profile.weight = Number($("#c-weight")?.value) || state.profile.weight;
  state.profile.height = Number($("#c-height")?.value) || state.profile.height;
  state.profile.experienceYears = Number($("#c-exp")?.value) || 0;
  state.profile.waistCm = Number($("#c-waist")?.value) || null;
  state.profile.bodyFatEstimate = Number($("#c-bf")?.value) || null;
  state.profile.activityLevel = $("#c-activity")?.value || "moderate";
  state.profile.jobActivity = $("#c-job")?.value || "desk";
  state.profile.sleepHours = Number($("#c-sleep")?.value) || 7;
  state.profile.stressLevel = $("#c-stress")?.value || "medium";
  state.profile.recoveryQuality = $("#c-recovery")?.value || "medium";
  state.profile.trainStyle = $("#c-style")?.value || "hypertrophy";
  state.profile.includeBodyPhotos = !!$("#c-photos")?.checked;
  state.profile.limitations = lims;
  state.profile.trainingGoals = goals.length ? goals : state.profile.trainingGoals;
  state.profile.equipment = $("#c-equip")?.value || "gym";
  state.profile.extraNotes = $("#c-extra")?.value || "";
  state.profile.planWeeks = weeksVal === "auto" ? "auto" : (Number(weeksVal) || 8);
  state.profile.sessionDuration = durVal === "auto" ? "auto" : (Number(durVal) || 70);
  state.profile.goals = state.profile.goals || {};
  state.profile.goals.protein = Number($("#c-protein")?.value) || state.profile.goals.protein || 180;
  state.profile.goals.deficit = Number($("#c-deficit")?.value) || state.profile.goals.deficit || 400;
  state.profile.setupDone = true;
  state.settings.preferredWorkoutTime = $("#c-wtime")?.value || "17:00";

  if (dayChecks.length) {
    state.settings.workoutDays = dayChecks;
    state.profile.sessionsPerWeek = dayChecks.length;
  } else if (sessVal === "auto") {
    state.settings.workoutDays = [];
    state.profile.sessionsPerWeek = "auto";
  } else {
    const n = Number(sessVal) || 4;
    state.profile.sessionsPerWeek = n;
    state.settings.workoutDays = [];
  }

  const wt = state.settings.preferredWorkoutTime;
  state.supplements.forEach(s => {
    const def = SUPPLEMENT_CATALOG.find(p => p.id === s.id);
    if (def && s.autoTime !== false) {
      s.time = computeSuppTime(def.timing, def.offsetMin, wt);
      s.times = [s.time];
    }
  });

  saveState(state);
  toast("مشخصات ذخیره شد — پرامپت آماده است", "success");
  navigate("coach-prompt");
}


function clearCoachDays() {
  $$(".c-wday").forEach(el => { el.checked = false; });
  const sel = $("#c-sessions");
  if (sel) sel.value = "auto";
  toast("روزها پاک شد — تصمیم با AI", "success");
}

function onCoachSessionsChange() {
  const sel = $("#c-sessions");
  if (!sel) return;
  if (sel.value === "auto") {
    $$(".c-wday").forEach(el => { el.checked = false; });
  }
}


function buildAiPrompt() {
  const pr = state.profile;
  const wt = state.settings.preferredWorkoutTime || "17:00";
  const gender = pr.gender === "female" ? "زن" : "مرد";
  const limLabels = (pr.limitations || []).map(id => LIMITATION_OPTIONS.find(o => o.id === id)?.label || id);
  const goalLabels = (pr.trainingGoals || []).map(id => GOAL_OPTIONS.find(o => o.id === id)?.label || id);
  const equipMap = { gym: "باشگاه کامل (دستگاه + سیم‌کش + دمبل + هالتر)", home: "خانگی/محدود", machines: "عمدتاً دستگاه و سیم‌کش" };

  const forbidden = [];
  if ((pr.limitations || []).includes("l4l5")) {
    forbidden.push("اسکوات هالتر سنگین", "ددلیفت", "Romanian Deadlift", "Good Morning", "Bent-over Row سنگین", "کرانچ سنگین با دامنه زیاد", "چرخش سنگین تنه");
  }
  if ((pr.limitations || []).includes("knee")) forbidden.push("اسکوات عمیق سنگین", "لانج سنگین اگر دردناک است");
  if ((pr.limitations || []).includes("shoulder")) forbidden.push("پرس نظامی پشت گردن", "پلاور سنگین پشت سر");

  const userDays = Array.isArray(state.settings.workoutDays) ? state.settings.workoutDays.filter(d => d >= 0 && d <= 6) : [];
  const daysLocked = userDays.length > 0 && pr.sessionsPerWeek !== "auto" && pr.sessionsPerWeek != null;
  const sessAuto = !daysLocked && (pr.sessionsPerWeek === "auto" || pr.sessionsPerWeek == null || userDays.length === 0);
  const durAuto = pr.sessionDuration === "auto" || pr.sessionDuration == null;
  const weeksAuto = pr.planWeeks === "auto";
  const lockedCount = daysLocked ? userDays.length : (Number(pr.sessionsPerWeek) || 0);
  const lockedDaysSorted = daysLocked ? sortIranWeekDays(userDays) : [];
  const lockedDayNames = lockedDaysSorted.map(d => DAY_NAMES_FA[d]).join("، ");

  const sessRule = sessAuto
    ? "تعداد جلسات هفتگی را خودت انتخاب کن (معمولاً ۳ تا ۶). بر اساس سابقه، اهداف، محدودیت‌ها، سن، ظرفیت ریکاوری و زمان در دسترس تصمیم بگیر. روی عدد ثابتی قفل نکن مگر شواهد پروفایل آن را ایجاب کند."
    : `تعداد جلسات در هفته باید دقیقاً ${lockedCount || pr.sessionsPerWeek} باشد.`;
  const daysRule = sessAuto
    ? "workoutDays را خودت با تقویم ایرانی انتخاب کن (۶=شنبه … ۵=جمعه). بین جلسات مشابه عضلانی ≥۴۸ ساعت فاصله بگذار. الگو فقط راهنماست نه اجبار: ۳→[۶,۱,۳] | ۴→[۶,۰,۲,۴] | ۵→[۶,۰,۲,۳,۵]."
    : `workoutDays باید دقیقاً این روزها باشد: [${lockedDaysSorted.join(", ")}] (${lockedDayNames}). ترتیب sessions را با همین روزها هم‌خوان کن.`;
  const durRule = durAuto
    ? "مدت هر جلسه واقع‌بینانه باشد (۴۵–۹۰ دقیقه). تعداد حرکات و ست‌ها را با این مدت هماهنگ کن؛ از حجم غیرقابل‌اجرا پرهیز کن."
    : `مدت تقریبی هر جلسه حدود ${pr.sessionDuration} دقیقه؛ حجم را با این زمان هماهنگ کن.`;
  const weeksRule = weeksAuto
    ? "طول دوره را بین ۶ تا ۱۲ هفته در فیلد weeks بنویس (برای هایپرتروفی معمولاً ۸–۱۰)."
    : `weeks باید ${pr.planWeeks || 8} باشد.`;
  const weeksJson = weeksAuto ? '"weeks": 8' : `"weeks": ${pr.planWeeks || 8}`;
  // در حالت auto فقط نمونه ساختاری؛ AI باید عدد نهایی را انتخاب کند
  const sessJson = sessAuto ? '"sessionsPerWeek": 4' : `"sessionsPerWeek": ${lockedCount || pr.sessionsPerWeek || 4}`;
  const daysJson = sessAuto ? '"workoutDays": [6, 0, 2, 4]' : `"workoutDays": ${JSON.stringify(lockedDaysSorted)}`;

  const bmiHint = (pr.weight && pr.height)
    ? (pr.weight / ((pr.height / 100) ** 2)).toFixed(1)
    : null;

  const actMap = { sedentary: "کم‌تحرک", light: "سبک", moderate: "متوسط", high: "بالا" };
  const stressMap = { low: "کم", medium: "متوسط", high: "زیاد" };
  const recMap = { low: "ضعیف", medium: "متوسط", high: "خوب" };
  const styleMap = { hypertrophy: "هایپرتروفی/فرم", strength: "قدرت", mixed: "ترکیبی", recomp: "ریکامپ" };
  const jobMap = { desk: "اداری/نشسته", standing: "ایستاده/متحرک", physical: "کار بدنی سنگین" };
  const photoBlock = pr.includeBodyPhotos ? `
════════════════════════════════════
تحلیل تصاویر بدن (الزامی)
════════════════════════════════════
کاربر تصاویر بدن خود را همراه این پرامپت پیوست می‌کند (ترجیحاً جلو، پهلو، پشت — لباس ورزشی، نور کافی).
قبل از طراحی برنامه:
1) ترکیب بدنی، نقاط قوت و ضعف عضلانی، و عدم‌تقارن احتمالی را از روی تصاویر برآورد کن.
2) اولویت عضلات ضعیف‌تر/کم‌توسعه را در حجم هفتگی بالاتر ببر.
3) اگر نشانه‌ای از مشکل پاسچر (شانه جلوآمده، لوردوز، ...) دیدی، در انتخاب حرکت و note جلسه لحاظ کن.
4) در coachNotes یک پاراگراف کوتاه از مشاهدات بصری بنویس.
اگر تصویری پیوست نشده بود، صریحاً در coachNotes بنویس که تحلیل بصری انجام نشده است.
` : "";

  return `تو یک مربی بدنسازی سطح جهانی (World-Class Strength & Hypertrophy Coach) هستی؛ دانش تو بر پایه شواهد علمی به‌روز (Schoenfeld, Israetel/RP, Helms, ACSM) و تجربه مربیگری حرفه‌ای است. فقط یک JSON معتبر برگردان. هیچ متنی قبل یا بعد از JSON ننویس. از { شروع کن و با } تمام کن.

════════════════════════════════════
نقش و استاندارد خروجی
════════════════════════════════════
- مثل مربی سطح ۱ المپیک / مربی خصوصی نخبگان فکر کن: دقیق، ایمن، قابل‌اجرا، بدون کلیشه.
- برنامه باید برای همین فرد شخصی‌سازی شود؛ کپی عمومی نده.
- اولویت‌ها به ترتیب: ۱) ایمنی و محدودیت‌های پزشکی  ۲) پیشرفت پایدار  ۳) پایبندی (adherence)  ۴) بهینه‌سازی جزئی.
- از حجم افراطی، حرکات پرریسک غیرضروری، و برنامه‌های نمایشی پرهیز کن.

════════════════════════════════════
ساختار JSON الزامی
════════════════════════════════════
{
  "program": {
    "name": "نام کوتاه و دقیق برنامه به فارسی",
    ${weeksJson},
    ${sessJson},
    ${daysJson},
    "periodization": "توضیح ۱–۲ جمله‌ای مدل پیشرفت (مثلاً double progression روی ست‌های ترکیبی)",
    "weeklyVolumeTargets": { "سرشانه": "18-20", "سینه": "10-12", "پشت": "12-16", "جلو بازو": "10-12", "پشت بازو": "10-14", "پا": "12-16", "میان‌تنه": "6-8" },
    "sessions": [
      {
        "id": 1,
        "name": "عنوان جلسه (عضلات اصلی)",
        "shortName": "جلسه ۱",
        "color": "#22d3ee",
        "muscles": ["عضله1", "عضله2"],
        "warmUp": "گرم‌کردن اختصاصی ۵–۱۰ دقیقه",
        "note": "نکته مربیگری کوتاه در صورت نیاز",
        "exercises": [
          {
            "id": "s1e1",
            "name": "نام حرکت به فارسی",
            "muscle": "گروه عضلانی اصلی",
            "sets": 3,
            "reps": "6-10",
            "rest": "2-3 دقیقه",
            "rir": "1-2",
            "tempo": "2-0-1",
            "note": "کوئینگ فرم یا پیشرفت",
            "safety": "هشدار ایمنی در صورت نیاز"
          }
        ]
      }
    ]
  },
  "supplements": [
    { "id": "creatine", "enabled": true, "dose": 5 },
    { "id": "whey", "enabled": true, "dose": 30 }
  ],
  "nutrition": {
    "proteinGrams": 180,
    "calorieDeficit": 400,
    "carbsNote": "کربوهیدرات اطراف تمرین",
    "notes": "نکته تغذیه کوتاه و عملی"
  },
  "coachNotes": "۲–۴ جمله راهنمای اجرای برنامه، علائم بیش‌تمرینی، و زمان reassessment"
}

شناسه‌های مجاز مکمل (فقط از این لیست):
creatine, whey, casein, caffeine, betaalanine, citrulline, citrulline_pure, betaine, taurine, electrolytes, vitd, omega3, magnesium, zinc, multivitamin, ashwagandha, vitamin_c, collagen, bcaa, glutamine, fatburner, preworkout_blend

════════════════════════════════════
اصول طراحی برنامه (اجباری)
════════════════════════════════════
1) ${sessRule}
2) ${daysRule}
3) ${durRule}
4) ${weeksRule}
5) تعداد آبجکت‌های sessions باید با sessionsPerWeek یکی باشد
6) workoutDays: آرایه اعداد JS getDay — ۶=شنبه، ۰=یکشنبه، ۱=دوشنبه، ۲=سه‌شنبه، ۳=چهارشنبه، ۴=پنجشنبه، ۵=جمعه (هفته ایرانی از شنبه). فاصله ریکاوری بین جلسات مشابه عضلانی ≥ ۴۸ ساعت.
6) ترتیب جلسات را طوری بچین که تداخل خستگی عضلات همپوشان کم شود (مثلاً سینه/سرشانه را پشت‌سرهم سنگین نگذار مگر با فاصله کافی).
7) انتخاب حرکت:
   - ابتدا الگوی حرکتی ترکیبی ایمن متناسب تجهیزات و محدودیت
   - سپس ایزوله برای نقاط ضعف / هایپرتروفی هدف
   - نام حرکات واقعی و رایج باشگاه‌های ایران، به فارسی
8) حجم و شدت (هایپرتروفی):
   - ست‌های مؤثر هفتگی نزدیک MEV→MAV؛ از MRV مزمن پرهیز کن
   - RIR بیشتر حرکات ترکیبی: ۱–۳ ؛ ایزوله: ۰–۲ ؛ failure فقط گاهی روی ایزوله آخر
   - پیشرفت: double progression (اول سقف تکرار، بعد افزایش وزنه کوچک)
9) استراحت: ترکیبی سنگین ۲–۳ دقیقه؛ ایزوله ۶۰–۹۰ث
10) sets عدد صحیح؛ reps مثل "6-10" یا "12-15"؛ rest مثل "90ث" یا "2 دقیقه"؛ rir مثل "1-2"
11) id حرکات یکتا: s1e1, s1e2, s2e1 ...
12) رنگ جلسات فقط از: "#22d3ee", "#a78bfa", "#fbbf24", "#34d399", "#f87171", "#fb923c"
13) warmUp کوتاه و عملی؛ برای محدودیت کمر/شانه کوئینگ ایمنی در safety بنویس
14) اگر محدودیت L4-L5: فقط الگوهای کم‌فشار روی دیسک (پرس پا با کمر متکی، دستگاه‌ها، لت، قایقی سینه‌تکیه، پشت‌پا، جلوپا، پالوف، ددباگ، پلانک بغل). از لود محوری و خم‌شدن تحت بار اجتناب.

════════════════════════════════════
مکمل و تغذیه
════════════════════════════════════
- فقط مکمل‌های با شواهد قوی/مفید برای این هدف را enabled:true کن
- کراتین مونوهیدرات تقریباً همیشه برای حجم/قدرت مناسب است (هر روز حتی استراحت)
- وی فقط اگر رسیدن به پروتئین روزانه سخت است
- pre/post (کافئین، سیترولین، …) فقط اگر به عملکرد کمک می‌کند؛ در روز استراحت لازم نیست
- BCAA / گلوتامین / چربی‌سوز را مگر دلیل قوی enabled:false بگذار
- پروتئین: حدود ۱.۶–۲.۲ گرم به ازای هر کیلو وزن بدن (با در نظر گرفتن کات/حجم)
- اگر هدف کاهش چربی است کسری ملایم (حدود ۳۰۰–۵۰۰ کیلوکالری) و حفظ پروتئین بالا

════════════════════════════════════
پروفایل این شاگرد
════════════════════════════════════
- ${gender}، ${pr.age || "?"} ساله
- وزن: ${pr.weight || "?"} کیلو · قد: ${pr.height || "?"} سم${bmiHint ? ` · BMI≈${bmiHint}` : ""}
${pr.waistCm ? `- دور کمر: ${pr.waistCm} سم` : ""}
${pr.bodyFatEstimate ? `- تخمین چربی بدن: ${pr.bodyFatEstimate}٪` : ""}
- سابقه تمرین: ${pr.experienceYears || 0} سال
- ساعت تمرین معمول: ${wt}
- تجهیزات: ${equipMap[pr.equipment] || pr.equipment || "باشگاه"}
- سطح فعالیت روزانه: ${actMap[pr.activityLevel] || pr.activityLevel || "متوسط"}
- شغل: ${jobMap[pr.jobActivity] || pr.jobActivity || "اداری"}
- خواب: حدود ${pr.sleepHours ?? 7} ساعت
- استرس: ${stressMap[pr.stressLevel] || "متوسط"} · ریکاوری: ${recMap[pr.recoveryQuality] || "متوسط"}
- سبک مطلوب: ${styleMap[pr.trainStyle] || "هایپرتروفی"}
- محدودیت‌ها: ${limLabels.length ? limLabels.join("، ") : "ندارد"}
- اهداف: ${goalLabels.length ? goalLabels.join("، ") : "عمومی"}
- هدف پروتئین اعلامی: ${pr.goals?.protein || "?"} گرم · کسری کالری: ${pr.goals?.deficit || "?"}
${forbidden.length ? "- حرکات ممنوع / پرریسک: " + forbidden.join("، ") : ""}
${(pr.limitations || []).includes("l4l5") ? "- پروتکل کمر: کمر خنثی، تکیه‌گاه، قطع حرکت با درد تیرکشنده/بی‌حسی/گزگز" : ""}
${pr.extraNotes ? "- توضیح اضافه شاگرد: " + pr.extraNotes : ""}
${photoBlock}
حجم و شدت را با خواب، استرس و ریکاوری واقعی این فرد هماهنگ کن (اگر ریکاوری ضعیف یا استرس بالاست، از MRV فاصله بگیر).

فقط JSON نهایی را برگردان.`;
}


function renderCoachPrompt() {
  const prompt = buildAiPrompt();
  const photoHint = state.profile.includeBodyPhotos
    ? `<div class="safety-soft" style="border-color:rgba(251,146,60,0.35);background:rgba(251,146,60,0.1)">📷 حالت تصاویر بدن فعال است. بعد از کپی پرامپت، عکس‌های جلو/پهلو/پشت را در همان گفتگوی AI ضمیمه کنید.</div>`
    : "";
  return `
    <div class="card" style="border-color:var(--accent)">
      <div class="coach-steps mb-2">
        <span class="coach-step">۱ مشخصات</span>
        <span class="coach-step active">۲ پرامپت</span>
        <span class="coach-step">۳ وارد کردن</span>
      </div>
      <div class="card-title">پرامپت آماده برای هوش مصنوعی</div>
      ${photoHint}
      <p style="font-size:0.9rem;margin-bottom:10px;line-height:1.6">
        این متن را کپی کنید و در ChatGPT / Claude / Gemini / هر AI دیگری بچسبانید.
        خروجی باید <strong>فقط JSON</strong> باشد.
      </p>
      <textarea class="form-input" id="ai-prompt-box" rows="16" style="font-size:0.75rem;line-height:1.45">${prompt.replace(/</g,"&lt;")}</textarea>
      <button class="btn btn-primary btn-lg btn-block mt-2" onclick="copyAiPrompt()">کپی پرامپت</button>
      <button class="btn btn-secondary btn-block mt-1" onclick="navigate('coach')">ویرایش مشخصات</button>
      <button class="btn btn-success btn-block mt-1" onclick="navigate('coach-import')">خروجی AI را گرفتم → وارد کردن</button>
    </div>
    <div class="card">
      <div class="card-title">راهنما</div>
      <p style="font-size:0.85rem;line-height:1.7">
        ۱. کپی پرامپت<br>
        ۲. در AI بفرستید<br>
        ۳. کل JSON پاسخ را کپی کنید<br>
        ۴. در صفحه بعد بچسبانید و تأیید کنید<br>
        برنامه جلسات + روشن/خاموش و دوز مکمل‌ها خودکار اعمال می‌شود.
      </p>
    </div>
  `;
}

function copyAiPrompt() {
  const el = document.getElementById("ai-prompt-box");
  const str = el ? el.value : buildAiPrompt();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(str).then(() => toast("پرامپت کپی شد", "success"))
      .catch(() => { el?.select(); document.execCommand("copy"); toast("پرامپت کپی شد", "success"); });
  } else {
    el?.select();
    document.execCommand("copy");
    toast("پرامپت کپی شد", "success");
  }
}

function renderCoachImport() {
  return `
    <div class="card" style="border-color:var(--accent)">
      <div class="coach-steps mb-2">
        <span class="coach-step">۱ مشخصات</span>
        <span class="coach-step">۲ پرامپت</span>
        <span class="coach-step active">۳ وارد کردن</span>
      </div>
      <div class="card-title">وارد کردن خروجی هوش مصنوعی</div>
      <p style="font-size:0.9rem;margin-bottom:10px;line-height:1.6">
        کل JSON را اینجا بچسبانید. اگر AI متن اضافه نوشته، فقط از اولین <code>{</code> تا آخرین <code>}</code> را کپی کنید.
      </p>
      <textarea class="form-input" id="ai-import-box" rows="14" style="font-family:monospace;font-size:0.72rem;direction:ltr;text-align:left" placeholder='{"program":{...},"supplements":[...]}'></textarea>
      <button class="btn btn-primary btn-lg btn-block mt-2" onclick="applyAiImport()">اعمال برنامه و مکمل‌ها</button>
      <button class="btn btn-secondary btn-block mt-1" onclick="navigate('coach-prompt')">بازگشت به پرامپت</button>
    </div>
    <div class="card">
      <div class="card-title">فرمت قابل قبول</div>
      <p style="font-size:0.8rem;line-height:1.6" class="text-muted">
        • شیء کامل با program + supplements (پیشنهادی)<br>
        • یا فقط آبجکت program با sessions<br>
        • یا مستقیماً آرایه sessions<br>
        اپ تا حد امکان استخراج و نرمال‌سازی می‌کند.
      </p>
    </div>
  `;
}

function extractJsonObject(raw) {
  let s = (raw || "").trim();
  // strip markdown fences
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  return JSON.parse(s);
}

function normalizeProgram(data) {
  let prog = data;
  if (data.program) prog = data.program;
  if (Array.isArray(data)) prog = { name: "برنامه وارد شده", sessions: data };
  if (data.sessions && !prog.sessions) prog = data;
  if (!prog.sessions || !Array.isArray(prog.sessions) || !prog.sessions.length) {
    throw new Error("sessions یافت نشد");
  }
  prog.name = prog.name || "برنامه AI";
  prog.weeks = prog.weeks || state.profile.planWeeks || 8;
  prog.sessionsPerWeek = prog.sessionsPerWeek || prog.sessions.length;
  prog.sessions = prog.sessions.map((s, i) => ({
    id: s.id || (i + 1),
    name: s.name || ("جلسه " + (i + 1)),
    shortName: s.shortName || ("جلسه " + (i + 1)),
    color: s.color || ["#22d3ee","#a78bfa","#fbbf24","#34d399","#f87171"][i % 5],
    muscles: s.muscles || [],
    warmUp: s.warmUp || "",
    note: s.note || "",
    exercises: (s.exercises || []).map((e, j) => ({
      id: e.id || ("s" + (s.id || i + 1) + "e" + (j + 1)),
      name: e.name || "حرکت",
      muscle: e.muscle || "",
      sets: Number(e.sets) || 3,
      reps: String(e.reps || "8-12"),
      rest: String(e.rest || "90ث"),
      rir: e.rir != null ? String(e.rir) : "2",
      note: e.note || "",
      safety: e.safety || ""
    }))
  }));
  return prog;
}

function applySupplementsFromAi(list) {
  if (!Array.isArray(list) || !list.length) return 0;
  let n = 0;
  const wt = state.settings.preferredWorkoutTime || "17:00";
  list.forEach(item => {
    const id = item.id || item.name;
    const s = state.supplements.find(x => x.id === id);
    if (!s) return;
    if (item.enabled != null) s.enabled = !!item.enabled;
    if (item.dose != null) s.dose = Number(item.dose) || s.dose;
    s.reminder = s.enabled;
    const def = SUPPLEMENT_CATALOG.find(p => p.id === s.id);
    if (def && s.autoTime !== false) {
      s.time = computeSuppTime(def.timing, def.offsetMin, wt);
      s.times = [s.time];
    }
    n++;
  });
  return n;
}

function applyAiImport() {
  const raw = document.getElementById("ai-import-box")?.value || "";
  if (!raw.trim()) { toast("چیزی وارد نشده", "warning"); return; }
  try {
    const data = extractJsonObject(raw);
    const prog = normalizeProgram(data);
    state.customProgram = prog;
    state.settings.sessionOrder = prog.sessions.map(s => s.id);
    const spw = prog.sessionsPerWeek || prog.sessions.length || 4;
    state.profile.sessionsPerWeek = spw;
    if (Array.isArray(prog.workoutDays) && prog.workoutDays.length) {
      state.settings.workoutDays = prog.workoutDays.map(Number).filter(d => d >= 0 && d <= 6);
    } else {
      state.settings.workoutDays = suggestWorkoutDays(spw);
    }
    state.profile.startDate = state.profile.startDate || getTodayStr();
    state.profile.setupDone = true;

    let suppCount = 0;
    if (data.supplements) suppCount = applySupplementsFromAi(data.supplements);

    if (data.nutrition) {
      if (data.nutrition.proteinGrams) state.profile.goals.protein = Number(data.nutrition.proteinGrams) || state.profile.goals.protein;
      if (data.nutrition.calorieDeficit) state.profile.goals.deficit = Number(data.nutrition.calorieDeficit) || state.profile.goals.deficit;
    }

    saveState(state);
    toast(`اعمال شد: ${prog.sessions.length} جلسه` + (suppCount ? ` · ${suppCount} مکمل` : ""), "success");
    navigate("workouts");
  } catch (err) {
    toast("خطا در خواندن JSON: " + err.message, "danger");
  }
}

function showProgramImport() {
  navigate("coach-import");
}

function importProgramJson() {
  applyAiImport();
}


/** خلاصه متنی برنامه برای اینفوگرافیک */
function buildProgramSummaryForVisual() {
  const prog = getActiveProgram(state);
  const pr = state.profile;
  const map = buildDaySessionMap(state);
  const daysLine = IR_WEEK_ORDER.map(d => {
    const sid = map[d];
    if (sid == null) return DAY_NAMES_FA[d] + ": استراحت";
    const s = prog.sessions.find(x => x.id === sid);
    return DAY_NAMES_FA[d] + ": " + (s ? (s.shortName + " — " + s.name) : "تمرین");
  }).join("\n");

  const sessionsBlock = (prog.sessions || []).map(s => {
    const moves = (s.exercises || []).map((e, i) =>
      `  ${i + 1}. ${e.name} | ${e.muscle} | ${e.sets}×${e.reps} | استراحت ${e.rest} | RIR ${e.rir}`
    ).join("\n");
    return `【${s.shortName}】 ${s.name}\nعضلات: ${(s.muscles || []).join("، ")}\n${moves}`;
  }).join("\n\n");

  return {
    name: prog.name || "برنامه تمرینی",
    weeks: prog.weeks || 8,
    sessionsPerWeek: prog.sessionsPerWeek || (prog.sessions || []).length,
    daysLine,
    sessionsBlock,
    user: `${pr.gender === "female" ? "زن" : "مرد"}، ${pr.age || "؟"} ساله، وزن ${pr.weight || "؟"} کیلو`
  };
}

/** پرامپت آماده برای ابزارهای ساخت اینفوگرافیک / تصویر AI */
function buildInfographicPrompt() {
  const s = buildProgramSummaryForVisual();
  return `تو یک طراح اینفوگرافیک ورزشی حرفه‌ای هستی. یک پوستر/اینفوگرافیک تمیز و خوانا از برنامه تمرینی زیر طراحی کن.

════════════════════════════════════
مشخصات بصری (الزامی)
════════════════════════════════════
- زبان متن روی طرح: فارسی (راست‌چین)
- قالب: عمودی موبایل یا مربع اینستاگرام (ترجیح ۱:۱ یا ۹:۱۶)
- سبک: مدرن، مینیمال، باشگاهی، کنتراست بالا، خوانا از فاصله
- پس‌زمینه تیره (سرمه‌ای/زغال) با اکسنت فیروزه‌ای یا بنفش نئون
- بدون شلوغی؛ کارت‌های جدا برای هر روز/جلسه
- فونت خوانا؛ اعداد واضح؛ آیکون ساده دمبل/عضلات در صورت نیاز
- حاشیه و فاصله منظم؛ مناسب استوری و پست اینستاگرام
- هیچ واترمارک یا متن انگلیسی اضافه ننویس مگر مخفف عضلات

════════════════════════════════════
محتوای برنامه (باید روی طرح بیاید)
════════════════════════════════════
عنوان: ${s.name}
دوره: ${s.weeks} هفته · ${s.sessionsPerWeek} جلسه در هفته
شاخص کاربر (اختیاری کوچک پایین طرح): ${s.user}

تقویم هفتگی (شنبه تا جمعه):
${s.daysLine}

جزئیات جلسات:
${s.sessionsBlock}

════════════════════════════════════
چیدمان پیشنهادی
════════════════════════════════════
1) هدر: عنوان برنامه + تعداد جلسات/هفته
2) نوار هفته: ۷ خانه (ش ی د س چ پ ج) با برچسب جلسه یا استراحت
3) بدنه: برای هر جلسه یک کارت شامل نام جلسه، عضلات، و فهرست فشرده حرکات (نام + ست×تکرار)
4) فوتر کوچک: «ریکاوری مهم است» یا نکته ایمنی یک‌خطی

اگر ابزار تو تصویر می‌سازد: یک تصویر واحد با تمام متن فارسی خوانا تولید کن.
اگر ابزار تو متن می‌دهد: ساختار لایه‌ها، رنگ‌ها (hex) و متن هر بخش را مشخص کن تا در Canva/Figma پیاده شود.

خروجی را مستقیم و بدون توضیح اضافه بده.`;
}

function renderInfographicPrompt() {
  const prompt = buildInfographicPrompt();
  const prog = getActiveProgram(state);
  return `
    <div class="card" style="border-color:var(--primary)">
      <div class="card-title">🎨 پرامپت اینفوگرافیک برنامه</div>
      <p style="font-size:0.9rem;line-height:1.65;margin-bottom:10px">
        این متن را کپی کنید و در ابزارهایی مثل <strong>ChatGPT / Gemini / Claude</strong> (برای طرح و متن Canva)
        یا <strong>Ideogram / Midjourney / DALL·E</strong> (برای تصویر) بچسبانید تا پوستر هفتگی برنامه ساخته شود.
      </p>
      <p class="text-muted" style="font-size:0.8rem">برنامه فعال: <strong>${prog.name || "—"}</strong> · ${(prog.sessions || []).length} جلسه</p>
    </div>
    <div class="card">
      <textarea class="form-input" id="infographic-prompt-box" rows="18" style="font-size:0.78rem;line-height:1.5">${prompt.replace(/</g, "&lt;")}</textarea>
      <button class="btn btn-primary btn-lg btn-block mt-2" onclick="copyInfographicPrompt()">کپی پرامپت اینفوگرافیک</button>
      <button class="btn btn-secondary btn-block mt-1" onclick="navigate('workouts')">بازگشت به برنامه تمرینی</button>
    </div>
    <div class="card">
      <div class="card-title">راهنمای سریع</div>
      <p style="font-size:0.85rem;line-height:1.7" class="text-muted">
        ۱. اول برنامه را با مربی هوشمند بسازید یا از برنامه فعلی استفاده کنید<br>
        ۲. پرامپت را کپی کنید<br>
        ۳. در AI تصویر/طراحی بچسبانید<br>
        ۴. اگر متن فارسی در تصویر خراب بود، از AI بخواهید نسخه Canva (لایه‌ها + متن) بدهد
      </p>
    </div>
  `;
}

function copyInfographicPrompt() {
  const el = document.getElementById("infographic-prompt-box");
  const str = el ? el.value : buildInfographicPrompt();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(str).then(() => toast("پرامپت اینفوگرافیک کپی شد", "success"))
      .catch(() => { el?.select(); document.execCommand("copy"); toast("پرامپت کپی شد", "success"); });
  } else {
    el?.select();
    document.execCommand("copy");
    toast("پرامپت کپی شد", "success");
  }
}

function exportProgram() {
  const prog = getActiveProgram(state);
  const payload = {
    program: prog,
    supplements: state.supplements.filter(s => s.enabled).map(s => ({
      id: s.id, enabled: true, dose: s.dose
    }))
  };
  const str = JSON.stringify(payload, null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(str).then(() => toast("JSON در کلیپ‌بورد کپی شد", "success"))
      .catch(() => showExportModal(str));
  } else {
    showExportModal(str);
  }
}

function showExportModal(str) {
  $("#modal-root").innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal-sheet">
        <div class="modal-title">JSON برنامه</div>
        <textarea class="form-input" rows="14" style="font-family:monospace;font-size:0.7rem;direction:ltr;text-align:left" readonly>${str.replace(/</g,"&lt;")}</textarea>
        <button class="btn btn-secondary btn-block mt-1" onclick="closeModal()">بستن</button>
      </div>
    </div>`;
}

function resetToDefaultProgram() {
  if (!confirm("برنامه سفارشی حذف و برنامه پیش‌فرض برگردد؟")) return;
  state.customProgram = null;
  state.settings.sessionOrder = [1, 2, 3, 4];
  state.settings.workoutDays = [6, 0, 2, 4];
  state.profile.sessionsPerWeek = 4;
  saveState(state);
  toast("برنامه پیش‌فرض فعال شد", "success");
  render();
}

// ---------- Bind (for dynamically added inline handlers we use global functions) ----------
function bindViewEvents() {
  // already using onclick globals
}

// Expose globals for inline handlers
window.navigate = navigate;
window.startWorkout = startWorkout;
window.resumeWorkout = resumeWorkout;
window.showSessionDetail = showSessionDetail;
window.closeModal = closeModal;
window.updateSet = updateSet;
window.toggleSetDone = toggleSetDone;
window.flagPain = flagPain;
window.startRestFor = startRestFor;
window.addRest = addRest;
window.skipRest = skipRest;
window.finishWorkout = finishWorkout;
window.cancelWorkout = cancelWorkout;
window.markSuppTaken = markSuppTaken;
window.toggleSupp = toggleSupp;
window.showSuppSettings = showSuppSettings;
window.saveSuppSettings = saveSuppSettings;
window.saveCoachProfileAndPrompt = saveCoachProfileAndPrompt;
window.clearCoachDays = clearCoachDays;
window.onCoachSessionsChange = onCoachSessionsChange;
window.copyAiPrompt = copyAiPrompt;
window.applyAiImport = applyAiImport;
window.toggleTheme = toggleTheme;
window.showExerciseDemo = showExerciseDemo;
window.openExternalLink = openExternalLink;
window.applySuggestedDays = applySuggestedDays;
window.applyRecoveryPatternForCount = applyRecoveryPatternForCount;
window.showProgramImport = showProgramImport;
window.importProgramJson = importProgramJson;
window.exportProgram = exportProgram;
window.copyInfographicPrompt = copyInfographicPrompt;
window.buildInfographicPrompt = buildInfographicPrompt;
window.resetToDefaultProgram = resetToDefaultProgram;
window.updateWorkoutTimeFromSupp = updateWorkoutTimeFromSupp;
window.recalcAllSuppTimes = recalcAllSuppTimes;




window.saveBodyLog = saveBodyLog;
window.saveNutrition = saveNutrition;
window.saveSettings = saveSettings;
window.testAppSounds = testAppSounds;
window.enableNotifications = enableNotifications;
window.playAppSound = playAppSound;
window.resetAllData = resetAllData;

// ---------- Simple reminder check (in-app, when open) ----------
function testAppSounds() {
  toast("پخش تست صدا…", "success");
  playAppSound("supplement");
  setTimeout(() => playAppSound("rest"), 900);
  setTimeout(() => playAppSound("workout"), 1800);
}
function enableNotifications() {
  if (!("Notification" in window)) {
    toast("این دستگاه اعلان سیستم را پشتیبانی نمی‌کند", "warning");
    return;
  }
  Notification.requestPermission().then(p => {
    if (p === "granted") {
      state.notificationsEnabled = true;
      saveState(state);
      toast("اعلان‌ها فعال شد", "success");
      try { new Notification("مربی بدنسازی", { body: "یادآوری‌ها آماده‌اند" }); } catch (e) {}
    } else {
      toast("مجوز اعلان داده نشد", "warning");
    }
  });
}
function checkReminders() {
  if (document.hidden) return;
  const now = new Date();
  const hhmm = now.toTimeString().slice(0, 5);
  const today = getTodayStr();
  // جلوگیری از تکرار آلارم در همان دقیقه
  if (!window.__alarmFired) window.__alarmFired = {};
  const fireKey = (k) => {
    const key = today + "_" + hhmm + "_" + k;
    if (window.__alarmFired[key]) return false;
    window.__alarmFired[key] = true;
    return true;
  };

  state.supplements.filter(s => s.enabled && s.reminder !== false).forEach(s => {
    const def = SUPPLEMENT_CATALOG.find(p => p.id === s.id);
    if (!def) return;
    if (!isWorkoutDay(state) && !isSuppOnRestDay(def.timing)) return;
    const t = getSuppEffectiveTime(s, def);
    if (t === hhmm) {
      const already = state.supplementLogs.some(l => l.date === today && l.suppId === s.id && l.taken);
      if (!already && fireKey("supp_" + s.id)) {
        toast(`زمان مصرف ${def.name}: ${s.dose} ${def.unit}`, "warning");
        playAppSound("supplement");
        if (Notification.permission === "granted") {
          try { new Notification(`مکمل: ${def.name}`, { body: `${s.dose} ${def.unit}` }); } catch (e) {}
        }
      }
    }
  });

  // یادآوری جلسه تمرین
  if (isWorkoutDay(state)) {
    const wt = state.settings.preferredWorkoutTime || "17:00";
    const minsBefore = Number(state.settings.reminderMinutesBefore) || 30;
    const [wh, wm] = wt.split(":").map(Number);
    let total = wh * 60 + wm - minsBefore;
    if (total < 0) total += 24 * 60;
    const rh = String(Math.floor(total / 60) % 24).padStart(2, "0");
    const rm = String(total % 60).padStart(2, "0");
    const remindAt = `${rh}:${rm}`;
    if (hhmm === remindAt && fireKey("workout")) {
      const sessId = getTodaySessionId(state);
      const sess = getActiveProgram(state).sessions.find(s => s.id === sessId);
      const name = sess?.name || "تمرین امروز";
      toast(`یادآوری تمرین: ${name} ساعت ${wt}`, "warning");
      playAppSound("workout");
      if (Notification.permission === "granted") {
        try { new Notification("یادآوری تمرین", { body: `${name} · ${wt}` }); } catch (e) {}
      }
    }
    if (hhmm === wt && fireKey("workout_now")) {
      toast("زمان شروع تمرین است 💪", "success");
      playAppSound("workout");
    }
  }
}

// Request notification permission (best-effort)
if ("Notification" in window && Notification.permission === "default") {
  // don't force; user can enable later
}

setInterval(checkReminders, 15000);

// PWA install prompt placeholder
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

// Init
applyTheme((loadState().settings && loadState().settings.theme) || "dark");
render();

  