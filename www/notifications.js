// ========== System notifications (Capacitor LocalNotifications + Web) ==========
// Uses OS default notification sound via Android channel / system Notification API.

const NOTIF_CHANNEL_ID = "fitai_reminders";
const NOTIF_CHANNEL_NAME = "یادآوری FitAI";

function isNativeApp() {
  try {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  } catch (e) {
    return !!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications);
  }
}

function getLocalNotificationsPlugin() {
  try {
    const Cap = window.Capacitor;
    if (!Cap) return null;
    if (Cap.Plugins && Cap.Plugins.LocalNotifications) return Cap.Plugins.LocalNotifications;
  } catch (e) {}
  return null;
}

async function ensureNotifChannel(LocalNotifications) {
  if (!LocalNotifications || !LocalNotifications.createChannel) return;
  try {
    await LocalNotifications.createChannel({
      id: NOTIF_CHANNEL_ID,
      name: NOTIF_CHANNEL_NAME,
      description: "یادآوری تمرین، مکمل و تایمر استراحت",
      importance: 5,
      visibility: 1,
      sound: "default",
      vibration: true,
      lights: true,
      lightColor: "#2DD4BF"
    });
  } catch (e) {
    console.warn("createChannel", e);
  }
}

function notifBase(id, title, body, atDate, extra) {
  return {
    id: id,
    title: title,
    body: body,
    channelId: NOTIF_CHANNEL_ID,
    sound: "default",
    extra: extra || {},
    largeBody: body,
    summaryText: "FitAI",
    schedule: {
      at: atDate,
      allowWhileIdle: true
    }
  };
}

async function cancelAllScheduled(LocalNotifications) {
  try {
    const pending = await LocalNotifications.getPending();
    const list = (pending && pending.notifications) || [];
    if (list.length) {
      await LocalNotifications.cancel({ notifications: list.map(function (x) { return { id: x.id }; }) });
    }
  } catch (e) {
    console.warn("cancel pending", e);
  }
}

function buildWorkoutNotificationList() {
  const list = [];
  if (typeof state === "undefined" || !state) return list;
  const wt = (state.settings && state.settings.preferredWorkoutTime) || "17:00";
  const parts = String(wt).split(":").map(Number);
  const hh = parts[0] || 17;
  const mm = parts[1] || 0;
  const remindMin = Number((state.settings && state.settings.reminderMinutesBefore) || 30);
  let map = {};
  try {
    map = typeof buildDaySessionMap === "function" ? buildDaySessionMap(state) : {};
  } catch (e) {}
  for (let i = 0; i < 21; i++) {
    const workoutAt = new Date();
    workoutAt.setSeconds(0, 0);
    workoutAt.setDate(workoutAt.getDate() + i);
    workoutAt.setHours(hh, mm, 0, 0);
    const remindAt = new Date(workoutAt.getTime() - remindMin * 60000);
    if (remindAt.getTime() <= Date.now() + 15000) continue;
    const wday = workoutAt.getDay();
    if (map[wday] == null) continue;
    let sessName = "تمرین امروز";
    try {
      const prog = typeof getActiveProgram === "function" ? getActiveProgram(state) : null;
      const sess = prog && (prog.sessions || []).find(function (s) { return s.id === map[wday]; });
      if (sess && sess.name) sessName = sess.name;
    } catch (e) {}
    list.push(notifBase(
      1000 + i,
      "یادآوری تمرین",
      sessName + " حدود " + remindMin + " دقیقه دیگر (" + wt + ")",
      remindAt,
      { type: "workout", sessionId: map[wday] }
    ));
  }
  return list;
}

function buildSupplementNotificationList() {
  const list = [];
  if (typeof state === "undefined" || !state) return list;
  const enabled = (state.supplements || []).filter(function (s) { return s.enabled && s.reminder !== false; });
  const catalog = typeof SUPPLEMENT_CATALOG !== "undefined" ? SUPPLEMENT_CATALOG : [];
  const preferred = (state.settings && state.settings.preferredWorkoutTime) || "17:00";
  const ph = preferred.split(":").map(Number);
  const workoutMins = (ph[0] || 17) * 60 + (ph[1] || 0);

  enabled.forEach(function (s, idx) {
    const meta = catalog.find(function (c) { return c.id === s.id; }) || {};
    let times = [];
    if (s.time && /^\d{1,2}:\d{2}$/.test(s.time)) times.push(s.time);
    if (Array.isArray(s.times)) {
      s.times.forEach(function (t) {
        if (t && /^\d{1,2}:\d{2}$/.test(t) && times.indexOf(t) < 0) times.push(t);
      });
    }
    if (!times.length) {
      const timing = meta.timing || "";
      let target = 12 * 60;
      if (timing === "pre") target = Math.max(0, workoutMins - 45);
      else if (timing === "post") target = Math.min(23 * 60 + 59, workoutMins + 30);
      else if (timing === "morning") target = 8 * 60;
      else if (timing === "night") target = 22 * 60;
      const h = Math.floor(target / 60);
      const m = target % 60;
      times.push(String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"));
    }

    times.forEach(function (tstr, ti) {
      const hm = tstr.split(":").map(Number);
      for (let day = 0; day < 7; day++) {
        const d = new Date();
        d.setSeconds(0, 0);
        d.setDate(d.getDate() + day);
        d.setHours(hm[0] || 0, hm[1] || 0, 0, 0);
        if (d.getTime() <= Date.now() + 15000) continue;
        try {
          if (typeof isWorkoutDay === "function" && meta.timing && (meta.timing === "pre" || meta.timing === "post")) {
            const map = typeof buildDaySessionMap === "function" ? buildDaySessionMap(state) : {};
            if (map[d.getDay()] == null) continue;
          }
        } catch (e) {}
        const id = 3000 + idx * 20 + day * 2 + ti;
        list.push(notifBase(
          id,
          "مکمل: " + (meta.name || s.id),
          (s.dose || meta.defaultDose || "") + " · ساعت " + tstr,
          d,
          { type: "supplement", supplementId: s.id }
        ));
      }
    });
  });
  return list;
}

async function scheduleAllSystemNotifications() {
  const LocalNotifications = getLocalNotificationsPlugin();
  if (LocalNotifications && isNativeApp()) {
    try {
      let perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") {
        perm = await LocalNotifications.requestPermissions();
      }
      if (perm.display !== "granted") {
        toast("مجوز اعلان سیستم داده نشد — از تنظیمات گوشی فعال کنید", "warning");
        return { ok: false, reason: "permission" };
      }
      await ensureNotifChannel(LocalNotifications);
      await cancelAllScheduled(LocalNotifications);

      const notifs = [].concat(buildWorkoutNotificationList()).concat(buildSupplementNotificationList());

      for (let i = 0; i < notifs.length; i += 40) {
        const chunk = notifs.slice(i, i + 40);
        if (chunk.length) await LocalNotifications.schedule({ notifications: chunk });
      }

      if (typeof state !== "undefined") {
        state.notificationsEnabled = true;
        if (typeof saveState === "function") saveState(state);
      }

      try {
        await LocalNotifications.schedule({
          notifications: [notifBase(
            9999,
            "FitAI — اعلان فعال شد",
            "صدای این پیام همان صدای استاندارد اعلان گوشی است",
            new Date(Date.now() + 2500),
            { type: "test" }
          )]
        });
      } catch (e) {}

      toast((notifs.length ? notifs.length + " یادآوری سیستم زمان‌بندی شد" : "اعلان فعال شد") + " (صدای استاندارد گوشی)", "success");
      return { ok: true, count: notifs.length };
    } catch (e) {
      console.error("schedule native", e);
      toast("خطا در زمان‌بندی اعلان بومی: " + (e.message || e), "danger");
    }
  }

  if (!("Notification" in window)) {
    toast("این محیط از اعلان پشتیبانی نمی‌کند. اپ اندروید را نصب کنید.", "warning");
    return { ok: false };
  }
  let p = Notification.permission;
  if (p !== "granted") {
    p = await Notification.requestPermission();
  }
  if (p !== "granted") {
    toast("مجوز اعلان رد شد", "warning");
    return { ok: false };
  }
  if (typeof state !== "undefined") {
    state.notificationsEnabled = true;
    if (typeof saveState === "function") saveState(state);
  }
  try {
    new Notification("FitAI — اعلان فعال شد", {
      body: "در مرورگر فقط وقتی اپ باز است یادآوری دقیق می‌آید. برای آلارم واقعی اپ اندروید را نصب کنید.",
      lang: "fa",
      dir: "rtl",
      silent: false
    });
  } catch (e) {}
  toast("اعلان وب فعال شد. برای آلارم پس‌زمینه از نسخه اندروید استفاده کنید.", "success");
  return { ok: true, web: true };
}

/** غیرفعال‌سازی تمام اعلان‌ها و پاک‌کردن زمان‌بندی‌ها */
async function disableSystemNotifications() {
  const LocalNotifications = getLocalNotificationsPlugin();
  if (LocalNotifications && isNativeApp()) {
    try {
      await cancelAllScheduled(LocalNotifications);
    } catch (e) {
      console.warn("cancel on disable", e);
    }
  }
  if (typeof state !== "undefined") {
    state.notificationsEnabled = false;
    if (typeof saveState === "function") saveState(state);
  }
  toast("اعلان‌ها غیرفعال شد", "success");
}

async function fireSystemNotification(title, body, extra) {
  const LocalNotifications = getLocalNotificationsPlugin();
  if (LocalNotifications && isNativeApp()) {
    try {
      await ensureNotifChannel(LocalNotifications);
      await LocalNotifications.schedule({
        notifications: [notifBase(
          8000 + Math.floor(Math.random() * 1000),
          title,
          body,
          new Date(Date.now() + 400),
          extra || { type: "instant" }
        )]
      });
      return;
    } catch (e) {
      console.warn("fire native", e);
    }
  }
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body: body, silent: false, lang: "fa", dir: "rtl" });
    } catch (e) {}
  }
}

async function enableSystemNotifications() {
  return scheduleAllSystemNotifications();
}

function installNotificationOverrides() {
  window.enableNotifications = function () {
    enableSystemNotifications();
  };
  window.disableNotifications = function () {
    disableSystemNotifications();
  };
  window.scheduleLocalReminders = function () {
    return scheduleAllSystemNotifications();
  };
  window.fireSystemNotification = fireSystemNotification;
  window.scheduleAllSystemNotifications = scheduleAllSystemNotifications;

  try {
    const _start = window.startRestTimer;
    if (typeof _start === "function" && !window.__restNotifPatched) {
      window.startRestTimer = function (seconds) {
        _start(seconds);
        if (window.__restNotifWatch) clearInterval(window.__restNotifWatch);
        window.__restNotifWatch = setInterval(function () {
          if (typeof restSecondsLeft === "undefined") return;
          if (restSecondsLeft <= 0) {
            clearInterval(window.__restNotifWatch);
            if (document.hidden) {
              fireSystemNotification("استراحت تمام شد", "ست بعدی را شروع کنید", { type: "rest" });
            }
          }
        }, 1000);
      };
      window.__restNotifPatched = true;
    }
  } catch (e) {}
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(installNotificationOverrides, 50);
  });
} else {
  setTimeout(installNotificationOverrides, 50);
}

setTimeout(function () {
  installNotificationOverrides();
  try {
    if (typeof state !== "undefined" && state && state.notificationsEnabled && isNativeApp()) {
      scheduleAllSystemNotifications();
    }
  } catch (e) {}
}, 1500);
