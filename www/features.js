// ========== HIGH-VALUE FEATURES (v2.3) ==========
// Charts · Body photos · Shareable reports · Units (kg/lb) · Offline · Notifications helpers

const FEATURES_VERSION = "2.3";

// ---------- Units (kg ↔ lb) ----------
function getUnits() {
  return (state?.settings?.units === "lb") ? "lb" : "kg";
}

function kgToDisplay(kg) {
  if (kg == null || isNaN(kg)) return "—";
  const u = getUnits();
  if (u === "lb") return (Number(kg) * 2.20462).toFixed(1);
  return Number(kg).toFixed(1);
}

function displayToKg(val) {
  const n = Number(val);
  if (isNaN(n)) return null;
  return getUnits() === "lb" ? n / 2.20462 : n;
}

function weightUnitLabel() {
  return getUnits() === "lb" ? "پوند" : "کیلو";
}

function formatWeight(kg) {
  return `${kgToDisplay(kg)} ${weightUnitLabel()}`;
}

// ---------- Offline & robust save ----------
function isOnline() {
  return typeof navigator !== "undefined" ? navigator.onLine !== false : true;
}

function showOfflineBanner() {
  let el = document.getElementById("offline-banner");
  if (!el) {
    el = document.createElement("div");
    el.id = "offline-banner";
    el.className = "offline-banner";
    el.innerHTML = "📡 آفلاین هستید — داده‌ها فقط روی این دستگاه ذخیره می‌شوند";
    document.body.prepend(el);
  }
  el.classList.toggle("hidden", isOnline());
}

function safeSaveState(s) {
  try {
    saveState(s);
    return true;
  } catch (e) {
    console.error("Save failed", e);
    toast("خطا در ذخیره‌سازی — حافظه دستگاه پر است؟", "warning");
    return false;
  }
}

function initOfflineWatch() {
  window.addEventListener("online", () => {
    showOfflineBanner();
    toast("اتصال برقرار شد", "success");
  });
  window.addEventListener("offline", () => {
    showOfflineBanner();
    toast("حالت آفلاین", "warning");
  });
  showOfflineBanner();
}

// ---------- Canvas line chart ----------
function drawLineChart(canvasId, points, opts = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !points || points.length < 1) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 300;
  const h = canvas.clientHeight || 160;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const pad = { t: 16, r: 12, b: 28, l: 40 };
  const vals = points.map(p => p.v);
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const range = max - min || 1;

  ctx.strokeStyle = "rgba(148,163,184,0.2)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + ((h - pad.t - pad.b) * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
    const label = (max - (range * i) / 4).toFixed(1);
    ctx.fillStyle = "rgba(148,163,184,0.8)";
    ctx.font = "10px Vazirmatn, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(label, pad.l - 6, y + 3);
  }

  const color = opts.color || "#22d3ee";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = pad.l + ((w - pad.l - pad.r) * i) / Math.max(points.length - 1, 1);
    const y = pad.t + (h - pad.t - pad.b) * (1 - (p.v - min) / range);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.lineTo(
    pad.l + ((w - pad.l - pad.r) * (points.length - 1)) / Math.max(points.length - 1, 1),
    h - pad.b
  );
  ctx.lineTo(pad.l, h - pad.b);
  ctx.closePath();
  ctx.fillStyle = "rgba(34,211,238,0.12)";
  ctx.fill();

  points.forEach((p, i) => {
    const x = pad.l + ((w - pad.l - pad.r) * i) / Math.max(points.length - 1, 1);
    const y = pad.t + (h - pad.t - pad.b) * (1 - (p.v - min) / range);
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  ctx.fillStyle = "rgba(148,163,184,0.9)";
  ctx.font = "10px Vazirmatn, sans-serif";
  ctx.textAlign = "center";
  [0, Math.floor(points.length / 2), points.length - 1].forEach(i => {
    if (i < 0 || i >= points.length) return;
    const x = pad.l + ((w - pad.l - pad.r) * i) / Math.max(points.length - 1, 1);
    const label = points[i].label || "";
    ctx.fillText(label.slice(5) || label, x, h - 8);
  });
}

function buildWeightChartData() {
  const logs = [...(state.bodyLogs || [])].sort((a, b) => a.date.localeCompare(b.date));
  return logs.slice(-16).map(l => ({
    v: getUnits() === "lb" ? Number(l.weight) * 2.20462 : Number(l.weight),
    label: l.date
  }));
}

function buildVolumeChartData() {
  const hist = [...(state.workoutHistory || [])]
    .filter(w => w.completed)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-12);
  return hist.map(w => ({
    v: Number(w.totalVolume) || 0,
    label: w.date
  }));
}

// ---------- Body progress photos ----------
function ensureBodyPhotos() {
  if (!Array.isArray(state.bodyPhotos)) state.bodyPhotos = [];
}

function renderPhotoGallery() {
  ensureBodyPhotos();
  const photos = [...state.bodyPhotos].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  if (!photos.length) {
    return `<div class="empty-state" style="padding:16px"><div class="icon">📷</div><p>هنوز عکسی ثبت نشده</p></div>`;
  }
  return `
    <div class="photo-grid">
      ${photos.map(p => `
        <div class="photo-card" onclick="viewBodyPhoto('${p.id}')">
          <img src="${p.thumb || p.data}" alt="${p.pose || "progress"}" loading="lazy" />
          <div class="photo-meta">${formatDate(p.date)} · ${p.pose || "—"}</div>
          <button type="button" class="photo-del" onclick="event.stopPropagation();deleteBodyPhoto('${p.id}')">×</button>
        </div>
      `).join("")}
    </div>
  `;
}

function compressImage(file, maxW = 800, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const data = c.toDataURL("image/jpeg", quality);
        const tw = 160, th = Math.round(h * (160 / w));
        const tc = document.createElement("canvas");
        tc.width = tw; tc.height = th;
        tc.getContext("2d").drawImage(img, 0, 0, tw, th);
        const thumb = tc.toDataURL("image/jpeg", 0.6);
        resolve({ data, thumb, width: w, height: h });
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function addBodyPhoto(file, pose) {
  try {
    ensureBodyPhotos();
    const { data, thumb } = await compressImage(file);
    const photo = {
      id: "ph_" + Date.now(),
      date: getTodayStr(),
      pose: pose || "front",
      data,
      thumb
    };
    state.bodyPhotos.push(photo);
    if (state.bodyPhotos.length > 20) {
      state.bodyPhotos = state.bodyPhotos.slice(-20);
    }
    if (!safeSaveState(state)) return;
    toast("عکس ذخیره شد", "success");
    render();
  } catch (e) {
    console.error(e);
    toast("خطا در ذخیره عکس", "warning");
  }
}

function deleteBodyPhoto(id) {
  if (!confirm("این عکس حذف شود؟")) return;
  ensureBodyPhotos();
  state.bodyPhotos = state.bodyPhotos.filter(p => p.id !== id);
  safeSaveState(state);
  toast("عکس حذف شد", "success");
  render();
}

function viewBodyPhoto(id) {
  ensureBodyPhotos();
  const p = state.bodyPhotos.find(x => x.id === id);
  if (!p) return;
  const root = document.getElementById("modal-root");
  if (!root) return;
  root.innerHTML = `
    <div class="modal-backdrop" onclick="closeModal()">
      <div class="modal photo-modal" onclick="event.stopPropagation()">
        <img src="${p.data}" alt="progress" style="width:100%;border-radius:12px" />
        <p class="text-center mt-1">${formatDate(p.date)} · ${p.pose || ""}</p>
        <button class="btn btn-secondary btn-block mt-1" onclick="closeModal()">بستن</button>
      </div>
    </div>
  `;
}

function onPhotoFileSelected(input) {
  const file = input?.files?.[0];
  if (!file) return;
  const pose = document.getElementById("photo-pose")?.value || "front";
  addBodyPhoto(file, pose);
  input.value = "";
}

// ---------- Shareable reports ----------
function buildWeeklyReportText() {
  const week = getWeekNumber(state.profile.startDate);
  const startW = state.profile.startWeight || state.profile.weight;
  const logs = [...(state.bodyLogs || [])].sort((a, b) => b.date.localeCompare(a.date));
  const latest = logs[0];
  const done = (state.workoutHistory || []).filter(w => w.completed).length;
  const thisWeekStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  })();
  const weekSessions = (state.workoutHistory || []).filter(w => w.completed && w.date >= thisWeekStart);
  const weekVol = weekSessions.reduce((s, w) => s + (Number(w.totalVolume) || 0), 0);
  const name = state.profile.name || "ورزشکار";

  let text = `📊 گزارش مربی بدنسازی — ${name}\n`;
  text += `هفته ${week} · ${formatDate(getTodayStr())}\n`;
  text += `────────────────\n`;
  text += `✅ جلسات کامل (کل): ${done}\n`;
  text += `🏋️ جلسات ۷ روز اخیر: ${weekSessions.length}\n`;
  text += `💪 حجم هفته: ${Math.round(weekVol)}\n`;
  text += `⚖️ وزن فعلی: ${formatWeight(latest?.weight ?? state.profile.weight)}\n`;
  if (latest && startW) {
    const delta = (latest.weight - startW).toFixed(1);
    text += `📉 تغییر از شروع: ${delta > 0 ? "+" : ""}${delta} کیلو\n`;
  }
  if (latest?.waist) text += `📏 دور کمر: ${latest.waist} سم\n`;
  const prs = Object.entries(state.exercisePRs || {}).slice(0, 5);
  if (prs.length) {
    text += `🏆 رکوردها:\n`;
    const prog = getActiveProgram(state);
    prs.forEach(([id, pr]) => {
      const n = prog.sessions.flatMap(s => s.exercises).find(e => e.id === id)?.name || id;
      text += `  • ${n}: ${pr.weight}×${pr.reps}\n`;
    });
  }
  text += `────────────────\n`;
  text += `ساخته‌شده با اپ مربی بدنسازی`;
  return text;
}

async function shareReport(period = "week") {
  const text = buildWeeklyReportText();
  try {
    if (navigator.share) {
      await navigator.share({ title: "گزارش پیشرفت", text });
      toast("گزارش اشتراک‌گذاری شد", "success");
      return;
    }
  } catch (e) {
    if (e.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast("متن گزارش کپی شد", "success");
  } catch {
    const root = document.getElementById("modal-root");
    if (root) {
      root.innerHTML = `
        <div class="modal-backdrop" onclick="closeModal()">
          <div class="modal" onclick="event.stopPropagation()">
            <div class="card-title">گزارش قابل کپی</div>
            <textarea class="form-input" rows="12" id="report-text" style="font-size:0.85rem;direction:rtl">${text}</textarea>
            <button class="btn btn-primary btn-block mt-1" onclick="navigator.clipboard.writeText(document.getElementById('report-text').value);toast('کپی شد','success');closeModal()">کپی</button>
            <button class="btn btn-secondary btn-block mt-1" onclick="closeModal()">بستن</button>
          </div>
        </div>`;
    }
  }
}

function downloadReportImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 960;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, 720, 960);
  ctx.fillStyle = "#22d3ee";
  ctx.font = "bold 28px Vazirmatn, Tahoma, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("گزارش پیشرفت", 360, 60);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "18px Vazirmatn, Tahoma, sans-serif";
  const lines = buildWeeklyReportText().split("\n");
  lines.forEach((line, i) => {
    ctx.fillText(line, 360, 120 + i * 32);
  });
  const a = document.createElement("a");
  a.download = `report-${getTodayStr()}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
  toast("تصویر گزارش دانلود شد", "success");
}

// ---------- Enhanced notifications (Capacitor + Web) ----------
async function scheduleLocalReminders() {
  const Cap = window.Capacitor;
  const hasCap = Cap && Cap.Plugins && Cap.Plugins.LocalNotifications;
  state.notificationsEnabled = true;
  safeSaveState(state);

  if (hasCap) {
    try {
      const { LocalNotifications } = Cap.Plugins;
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== "granted") {
        toast("مجوز اعلان داده نشد", "warning");
        return;
      }
      const pending = await LocalNotifications.getPending();
      if (pending.notifications?.length) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
      const notifs = [];
      const wt = state.settings.preferredWorkoutTime || "17:00";
      const [hh, mm] = wt.split(":").map(Number);
      const remindMin = state.settings.reminderMinutesBefore || 30;
      for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        d.setHours(hh, mm, 0, 0);
        d.setMinutes(d.getMinutes() - remindMin);
        if (d <= new Date()) continue;
        const day = d.getDay();
        const map = buildDaySessionMap(state);
        if (map[day] == null) continue;
        notifs.push({
          id: 1000 + i,
          title: "یادآوری تمرین 💪",
          body: `حدود ${remindMin} دقیقه تا جلسه تمرین`,
          schedule: { at: d },
          extra: { type: "workout" }
        });
      }
      notifs.push({
        id: 2001,
        title: "مکمل روزانه 💊",
        body: "کراتین و مکمل‌های روزانه را فراموش نکنید",
        schedule: { at: (() => { const t = new Date(); t.setHours(9, 0, 0, 0); if (t <= new Date()) t.setDate(t.getDate() + 1); return t; })(), repeats: true, every: "day" },
        extra: { type: "supplement" }
      });
      if (notifs.length) {
        await LocalNotifications.schedule({ notifications: notifs });
        toast(`${notifs.length} یادآوری زمان‌بندی شد`, "success");
      } else {
        toast("روز تمرینی برای زمان‌بندی یافت نشد", "warning");
      }
      return;
    } catch (e) {
      console.warn("Capacitor notifications failed, falling back", e);
    }
  }

  if (!("Notification" in window)) {
    toast("مرورگر از اعلان پشتیبانی نمی‌کند", "warning");
    return;
  }
  const p = await Notification.requestPermission();
  if (p === "granted") {
    toast("اعلان سیستم فعال شد (در حالت باز بودن اپ)", "success");
    try { new Notification("مربی بدنسازی", { body: "یادآوری‌ها آماده‌اند" }); } catch (_) {}
  } else {
    toast("مجوز اعلان رد شد", "warning");
  }
}

// ---------- Enhanced renderProgress ----------
function renderProgressEnhanced() {
  const logs = [...(state.bodyLogs || [])].sort((a, b) => b.date.localeCompare(a.date));
  const unit = weightUnitLabel();
  const displayW = kgToDisplay(state.profile.weight);

  return `
    <div class="card">
      <div class="card-title">ثبت اندازه‌های جدید</div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">وزن (${unit})</label>
          <input class="form-input" type="number" step="0.1" id="log-weight" value="${displayW}" />
        </div>
        <div class="form-group">
          <label class="form-label">دور کمر (سم)</label>
          <input class="form-input" type="number" step="0.1" id="log-waist" value="${logs[0]?.waist ?? ""}" />
        </div>
        <div class="form-group">
          <label class="form-label">دور بازو</label>
          <input class="form-input" type="number" step="0.1" id="log-arm" value="${logs[0]?.arm ?? ""}" />
        </div>
        <div class="form-group">
          <label class="form-label">دور شانه</label>
          <input class="form-input" type="number" step="0.1" id="log-shoulder" value="${logs[0]?.shoulder ?? ""}" />
        </div>
        <div class="form-group">
          <label class="form-label">دور سینه</label>
          <input class="form-input" type="number" step="0.1" id="log-chest" value="${logs[0]?.chest ?? ""}" />
        </div>
        <div class="form-group">
          <label class="form-label">دور ران</label>
          <input class="form-input" type="number" step="0.1" id="log-thigh" value="${logs[0]?.thigh ?? ""}" />
        </div>
      </div>
      <button class="btn btn-primary btn-block" onclick="saveBodyLogEnhanced()">ثبت</button>
    </div>

    <div class="card">
      <div class="card-title">نمودار وزن</div>
      ${logs.length >= 2
        ? `<canvas id="chart-weight" class="progress-chart" height="160"></canvas>`
        : `<p class="text-muted">حداقل ۲ ثبت برای نمودار لازم است</p>`}
    </div>

    <div class="card">
      <div class="card-title">نمودار حجم تمرین</div>
      ${(state.workoutHistory || []).filter(w => w.completed).length >= 2
        ? `<canvas id="chart-volume" class="progress-chart" height="160"></canvas>`
        : `<p class="text-muted">حداقل ۲ جلسه کامل برای نمودار لازم است</p>`}
    </div>

    <div class="card">
      <div class="card-title">عکس پیشرفت بدن 📷</div>
      <div class="form-group">
        <label class="form-label">زاویه</label>
        <select class="form-select" id="photo-pose">
          <option value="front">جلو</option>
          <option value="side">پهلو</option>
          <option value="back">پشت</option>
        </select>
      </div>
      <label class="btn btn-secondary btn-block" style="cursor:pointer">
        انتخاب / گرفتن عکس
        <input type="file" accept="image/*" capture="environment" style="display:none" onchange="onPhotoFileSelected(this)" />
      </label>
      <div class="mt-2">${renderPhotoGallery()}</div>
    </div>

    ${logs.length ? `
      <div class="card">
        <div class="card-title">تاریخچه اندازه‌ها</div>
        ${logs.slice(0, 15).map(l => `
          <div class="history-item">
            <div class="flex-between">
              <strong>${formatDate(l.date)}</strong>
              <span>${formatWeight(l.weight)}</span>
            </div>
            <div class="text-muted" style="font-size:0.85rem">
              ${l.waist ? `کمر ${l.waist}` : ""} ${l.arm ? `بازو ${l.arm}` : ""} ${l.shoulder ? `شانه ${l.shoulder}` : ""} ${l.chest ? `سینه ${l.chest}` : ""} ${l.thigh ? `ران ${l.thigh}` : ""}
            </div>
          </div>
        `).join("")}
      </div>
    ` : `<div class="empty-state"><div class="icon">📏</div><p>هنوز اندازه‌ای ثبت نشده</p></div>`}
  `;
}

function saveBodyLogEnhanced() {
  const raw = $("#log-weight")?.value;
  const weight = displayToKg(raw);
  if (!weight) { toast("وزن را وارد کنید", "warning"); return; }
  const log = {
    date: getTodayStr(),
    weight: Math.round(weight * 10) / 10,
    waist: Number($("#log-waist")?.value) || null,
    arm: Number($("#log-arm")?.value) || null,
    shoulder: Number($("#log-shoulder")?.value) || null,
    chest: Number($("#log-chest")?.value) || null,
    thigh: Number($("#log-thigh")?.value) || null
  };
  state.bodyLogs = (state.bodyLogs || []).filter(l => l.date !== log.date);
  state.bodyLogs.push(log);
  state.profile.weight = log.weight;
  if (!safeSaveState(state)) return;
  toast("اندازه‌ها ذخیره شد", "success");
  render();
}

function afterProgressRender() {
  const wData = buildWeightChartData();
  if (wData.length >= 2) drawLineChart("chart-weight", wData, { color: "#22d3ee" });
  const vData = buildVolumeChartData();
  if (vData.length >= 2) drawLineChart("chart-volume", vData, { color: "#a78bfa" });
}

// ---------- Enhanced reports ----------
function renderReportsEnhanced() {
  const week = getWeekNumber(state.profile.startDate);
  const done = (state.workoutHistory || []).filter(w => w.completed).length;
  const startW = state.profile.startWeight || 94;
  const latest = [...(state.bodyLogs || [])].sort((a, b) => b.date.localeCompare(a.date))[0];
  const weightChange = latest ? (latest.weight - startW).toFixed(1) : "—";
  const waistChange = latest?.waist && state.profile.startWaist
    ? (latest.waist - state.profile.startWaist).toFixed(1)
    : "—";

  return `
    <div class="card">
      <div class="card-title">خلاصه ${week} هفته</div>
      <div class="stat-row">
        <div class="stat-chip sc-cyan"><div class="sc-val">${done}</div><div class="sc-lbl">جلسات</div></div>
        <div class="stat-chip sc-violet"><div class="sc-val">${weightChange}</div><div class="sc-lbl">Δ وزن (کیلو)</div></div>
        <div class="stat-chip sc-amber"><div class="sc-val">${waistChange}</div><div class="sc-lbl">Δ کمر</div></div>
      </div>
      <div class="mt-2">
        <div class="text-muted">پایبندی تقریبی</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, (done / (week * 4)) * 100)}%"></div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">اشتراک‌گذاری گزارش</div>
      <p class="text-muted" style="font-size:0.85rem;margin-bottom:10px">گزارش متنی یا تصویری بساز و با دوست/مربی به اشتراک بگذار.</p>
      <button class="btn btn-primary btn-block" onclick="shareReport('week')">📤 اشتراک / کپی گزارش هفتگی</button>
      <button class="btn btn-secondary btn-block mt-1" onclick="downloadReportImage()">🖼️ دانلود تصویر گزارش</button>
    </div>

    <div class="card">
      <div class="card-title">رکوردهای قدرتی (حجم ست)</div>
      ${Object.keys(state.exercisePRs || {}).length ? Object.entries(state.exercisePRs).slice(0, 12).map(([id, pr]) => {
        const name = getActiveProgram(state).sessions.flatMap(s => s.exercises).find(e => e.id === id)?.name || id;
        return `<div class="history-item flex-between"><span>${name}</span><span>${pr.weight}×${pr.reps}</span></div>`;
      }).join("") : "<p class='text-muted'>هنوز رکوردی نیست</p>"}
    </div>
    ${week >= 6 ? `
      <div class="card" style="border-color:var(--warning)">
        <p>زمان ارزیابی رسمی برنامه است. قدرت، دور کمر، دور بازو/شانه و پایبندی را بررسی کنید. در صورت نیاز برنامه را با مربی/فیزیوتراپیست بازبینی کنید.</p>
      </div>` : ""}
  `;
}

window.kgToDisplay = kgToDisplay;
window.displayToKg = displayToKg;
window.formatWeight = formatWeight;
window.weightUnitLabel = weightUnitLabel;
window.getUnits = getUnits;
window.shareReport = shareReport;
window.downloadReportImage = downloadReportImage;
window.onPhotoFileSelected = onPhotoFileSelected;
window.deleteBodyPhoto = deleteBodyPhoto;
window.viewBodyPhoto = viewBodyPhoto;
window.addBodyPhoto = addBodyPhoto;
window.saveBodyLogEnhanced = saveBodyLogEnhanced;
window.scheduleLocalReminders = scheduleLocalReminders;
window.renderProgressEnhanced = renderProgressEnhanced;
window.renderReportsEnhanced = renderReportsEnhanced;
window.afterProgressRender = afterProgressRender;
window.safeSaveState = safeSaveState;
window.initOfflineWatch = initOfflineWatch;
window.FEATURES_VERSION = FEATURES_VERSION;
