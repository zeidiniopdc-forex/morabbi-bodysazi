// ========== UX v4 — Jalali + Home ==========
function _div(a, b) { return Math.floor(a / b); }
function gregorianToJalali(gy, gm, gd) {
  var g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  var gy2 = (gm > 2) ? (gy + 1) : gy;
  var days = 355666 + (365 * gy) + _div(gy2 + 3, 4) - _div(gy2 + 99, 100) + _div(gy2 + 399, 400) + gd + g_d_m[gm - 1];
  var jy = -1595 + (33 * _div(days, 12053));
  days %= 12053;
  jy += 4 * _div(days, 1461);
  days %= 1461;
  if (days > 365) { jy += _div(days - 1, 365); days = (days - 1) % 365; }
  var jm = (days < 186) ? 1 + _div(days, 31) : 7 + _div(days - 186, 30);
  var jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return { jy: jy, jm: jm, jd: jd };
}
function jalaliToday() {
  var n = new Date();
  return gregorianToJalali(n.getFullYear(), n.getMonth() + 1, n.getDate());
}
var J_MONTHS = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
var IR_WEEK_ORDER_HOME = [6, 0, 1, 2, 3, 4, 5];
function formatJalaliDate(d) {
  d = d || new Date();
  var j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return j.jd + " " + J_MONTHS[j.jm - 1] + " " + j.jy;
}
function getWeekDayStatus(dayIdx, st) {
  var map = buildDaySessionMap(st);
  var sid = map[dayIdx];
  var today = getDayOfWeek();
  var hist = (st.workoutHistory || []).filter(function (w) { return w.completed; });
  var done = false;
  if (sid != null) {
    var weekAgo = Date.now() - 7 * 86400000;
    done = hist.some(function (w) {
      return w.sessionId === sid && new Date(w.date || w.completedAt || 0).getTime() > weekAgo;
    });
  }
  return {
    day: dayIdx, sessionId: sid, isToday: dayIdx === today, isRest: sid == null, done: !!done,
    session: sid != null ? (getActiveProgram(st).sessions || []).find(function (s) { return s.id === sid; }) : null
  };
}
function renderHomeWeekCalendar() {
  var cells = IR_WEEK_ORDER_HOME.map(function (d) {
    var st = getWeekDayStatus(d, state);
    var sess = st.session;
    var cls = "ux-day";
    if (st.isToday) cls += " is-today";
    if (st.isRest) cls += " is-rest"; else cls += " is-train";
    if (st.done) cls += " is-done";
    var label = DAY_NAMES_SHORT[d];
    var sub = st.isRest ? "استراحت" : (sess ? (sess.shortName || sess.name || "").replace("جلسه ", "ج") : "—");
    return '<button type="button" class="' + cls + '" data-day="' + d + '" onclick="onHomeDaySelect(' + d + ')">' +
      '<span class="ux-day-name">' + label + '</span><span class="ux-day-sub">' + sub + '</span>' +
      (st.done ? '<span class="ux-day-check">✓</span>' : '') + '</button>';
  }).join("");
  var j = jalaliToday();
  return '<div class="ux-cal card"><div class="ux-cal-head"><div><div class="ux-cal-title">تقویم هفته</div>' +
    '<div class="ux-cal-date">' + j.jd + ' ' + J_MONTHS[j.jm - 1] + ' ' + j.jy + '</div></div>' +
    '<div class="ux-cal-prog">' + (getActiveProgram(state).name || "برنامه") + '</div></div>' +
    '<div class="ux-week">' + cells + '</div></div>';
}
function onHomeDaySelect(dayIdx) {
  var st = getWeekDayStatus(dayIdx, state);
  if (st.isRest) { toast(DAY_NAMES_FA[dayIdx] + ": روز استراحت", "success"); return; }
  if (st.session) toast(DAY_NAMES_FA[dayIdx] + ": " + st.session.name, "success");
}
window.onHomeDaySelect = onHomeDaySelect;
function getSuppScheduleToday() {
  var enabled = (state.supplements || []).filter(function (s) { return s.enabled; });
  var catalog = typeof SUPPLEMENT_CATALOG !== "undefined" ? SUPPLEMENT_CATALOG : [];
  var now = new Date();
  var mins = now.getHours() * 60 + now.getMinutes();
  var preferred = state.settings.preferredWorkoutTime || "17:00";
  var parts = preferred.split(":").map(Number);
  var workoutMins = (parts[0] || 17) * 60 + (parts[1] || 0);
  return enabled.map(function (s) {
    var meta = catalog.find(function (c) { return c.id === s.id; }) || {};
    var timeStr = s.time || (s.times && s.times[0]) || null;
    var targetMins = null;
    if (timeStr && /^\d{1,2}:\d{2}$/.test(timeStr)) {
      var hm = timeStr.split(":").map(Number);
      targetMins = hm[0] * 60 + hm[1];
    } else {
      var timing = meta.timing || "";
      if (timing === "pre") targetMins = workoutMins - 45;
      else if (timing === "post") targetMins = workoutMins + 30;
      else if (timing === "morning") targetMins = 8 * 60;
      else if (timing === "night") targetMins = 22 * 60;
      else targetMins = 12 * 60;
      var hh = Math.floor(targetMins / 60) % 24;
      var mm = targetMins % 60;
      timeStr = String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
    }
    var taken = (state.supplementLogs || []).some(function (l) { return l.date === getTodayStr() && l.supplementId === s.id; });
    return { id: s.id, name: meta.name || s.id, dose: s.dose || meta.defaultDose || "", timeStr: timeStr, targetMins: targetMins, countdown: targetMins - mins, taken: taken, due: !taken && (targetMins - mins) <= 30 && (targetMins - mins) >= -60 };
  }).sort(function (a, b) { return a.targetMins - b.targetMins; });
}
function formatCountdown(mins) {
  if (mins == null) return "";
  if (mins < -60) return "گذشته";
  if (mins < 0) return "الان";
  var h = Math.floor(mins / 60);
  var m = mins % 60;
  if (h > 0) return h + "س " + m + "د";
  return m + " دقیقه";
}
function renderHomeTodayWorkout() {
  var sid = getTodaySessionId(state);
  var prog = getActiveProgram(state);
  var sess = (prog.sessions || []).find(function (s) { return s.id === sid; });
  if (state.activeWorkout) {
    return '<div class="ux-today-wo card is-active"><div class="ux-badge">در حال اجرا</div><div class="ux-today-title">جلسه فعال</div>' +
      '<button type="button" class="btn btn-primary btn-block btn-lg" onclick="resumeWorkout()">ادامه تمرین</button></div>';
  }
  if (!sess) {
    return '<div class="ux-today-wo card is-rest"><div class="ux-badge rest">روز استراحت</div><div class="ux-today-title">امروز تمرین برنامه‌ریزی نشده</div>' +
      '<p class="text-muted" style="font-size:0.85rem;margin:8px 0 12px">ریکاوری و مکمل‌های روزانه را جدی بگیر.</p>' +
      '<button type="button" class="btn btn-secondary btn-block" onclick="navigate(\'workouts\')">مشاهده برنامه هفته</button></div>';
  }
  var moves = (sess.exercises || []).length;
  var dur = state.profile.sessionDuration && state.profile.sessionDuration !== "auto" ? state.profile.sessionDuration + " دقیقه" : "≈ ۶۰–۷۵ دقیقه";
  return '<div class="ux-today-wo card"><div class="ux-badge train">تمرین امروز</div><div class="ux-today-title">' + sess.name + '</div>' +
    '<div class="ux-today-meta"><span>' + (prog.name || "برنامه") + '</span><span>·</span><span>' + moves + ' حرکت</span><span>·</span><span>' + dur + '</span></div>' +
    '<div class="ux-muscles">' + (sess.muscles || []).slice(0, 4).map(function (m) { return '<span class="tag tag-primary">' + m + '</span>'; }).join("") + '</div>' +
    '<button type="button" class="btn btn-primary btn-block btn-lg mt-1" onclick="startWorkout(' + sess.id + ')">شروع تمرین</button>' +
    '<button type="button" class="btn btn-secondary btn-block mt-1" onclick="navigate(\'workouts\')">جزئیات جلسه</button></div>';
}
function renderHomeSupplements() {
  var list = getSuppScheduleToday();
  if (!list.length) {
    return '<div class="card"><div class="card-title">مکمل‌های امروز</div><p class="text-muted" style="font-size:0.85rem">مکمل فعالی ندارید.</p>' +
      '<button class="btn btn-secondary btn-sm" onclick="navigate(\'supplements\')">مدیریت مکمل‌ها</button></div>';
  }
  var next = list.find(function (x) { return !x.taken; });
  var rows = list.slice(0, 5).map(function (s) {
    return '<div class="ux-supp-row ' + (s.taken ? "taken" : "") + ' ' + (s.due ? "due" : "") + '">' +
      '<div class="ux-supp-info"><strong>' + s.name + '</strong><small>' + (s.dose || "") + ' · ' + s.timeStr +
      (s.taken ? ' · مصرف‌شده' : ' · ' + formatCountdown(s.countdown)) + '</small></div><div class="ux-supp-actions">' +
      (s.taken ? '<span class="tag tag-success">✓</span>' :
        '<button type="button" class="btn btn-sm btn-primary" onclick="markSuppTakenHome(\'' + s.id + '\')">مصرف شد</button>' +
        '<button type="button" class="btn btn-sm btn-secondary" onclick="snoozeSuppHome(\'' + s.id + '\')">Snooze</button>') +
      '</div></div>';
  }).join("");
  return '<div class="card"><div class="flex-between mb-1"><div class="card-title" style="margin:0">مکمل‌های امروز</div>' +
    '<button type="button" class="btn btn-sm btn-secondary" onclick="navigate(\'supplements\')">همه</button></div>' +
    (next && !next.taken ? '<div class="ux-next-supp">بعدی: <strong>' + next.name + '</strong> تا ' + formatCountdown(next.countdown) + ' (' + next.timeStr + ')</div>' : '') +
    rows + '</div>';
}
function markSuppTakenHome(id) {
  var today = getTodayStr();
  state.supplementLogs = state.supplementLogs || [];
  if (!state.supplementLogs.some(function (l) { return l.date === today && l.supplementId === id; })) {
    state.supplementLogs.push({ date: today, supplementId: id, time: new Date().toISOString() });
    saveState(state);
  }
  toast("مصرف ثبت شد", "success");
  if (typeof render === "function") render();
}
function snoozeSuppHome(id) {
  toast("یادآوری ۱۵ دقیقه عقب افتاد", "success");
  window.__suppSnooze = window.__suppSnooze || {};
  window.__suppSnooze[id] = Date.now() + 15 * 60000;
}
window.markSuppTakenHome = markSuppTakenHome;
window.snoozeSuppHome = snoozeSuppHome;
function renderHomeDashboardV4() {
  var name = state.profile.name || "ورزشکار";
  var hour = new Date().getHours();
  var greet = hour < 12 ? "صبح بخیر" : hour < 18 ? "عصر بخیر" : "شب بخیر";
  var j = formatJalaliDate(new Date());
  return '<div class="ux-home-top anim-fade-up"><div class="ux-greet">' + greet + '</div><div class="ux-name">' + name + '</div>' +
    '<div class="ux-date-line">' + j + '</div></div>' +
    renderHomeWeekCalendar() + renderHomeTodayWorkout() + renderHomeSupplements() +
    '<div class="ux-quick-row">' +
    '<button type="button" class="ux-q" onclick="navigate(\'programs\')"><span>📋</span>برنامه‌ها</button>' +
    '<button type="button" class="ux-q" onclick="navigate(\'mealplan\')"><span>🥗</span>غذایی</button>' +
    '<button type="button" class="ux-q" onclick="navigate(\'nutrition\')"><span>🍽️</span>ثبت غذا</button>' +
    '<button type="button" class="ux-q" onclick="navigate(\'coach\')"><span>🧠</span>مربی AI</button></div>';
}
window.renderHomeDashboardV4 = renderHomeDashboardV4;
