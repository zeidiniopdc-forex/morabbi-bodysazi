// ========== LOCAL STORAGE LAYER (v4 — multi-profile) ==========
const STORAGE_KEY = "bb_tracker_v2";
const MAX_PROFILES = 8;

function buildDefaultSupplements() {
  return SUPPLEMENT_CATALOG.map(s => ({
    id: s.id,
    enabled: !!s.defaultEnabled,
    dose: s.defaultDose,
    time: null,
    times: [],
    reminder: !!s.defaultEnabled,
    lastTaken: null,
    autoTime: true
  }));
}

function newProfileId() {
  return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function defaultProfileData(overrides) {
  overrides = overrides || {};
  const base = {
    id: newProfileId(),
    label: "پروفایل ۱",
    createdAt: new Date().toISOString(),
    profile: {
      name: "کاربر",
      weight: 70,
      height: 170,
      age: 30,
      gender: "male",
      experienceYears: 1,
      startDate: new Date().toISOString().slice(0, 10),
      startWeight: 70,
      startWaist: null,
      limitations: [],
      trainingGoals: ["general"],
      sessionsPerWeek: "auto",
      sessionDuration: 60,
      equipment: "gym",
      activityLevel: "moderate",
      sleepHours: 7,
      stressLevel: "medium",
      recoveryQuality: "medium",
      bodyFatEstimate: null,
      waistCm: null,
      trainStyle: "hypertrophy",
      jobActivity: "desk",
      includeBodyPhotos: false,
      goals: { protein: 140, deficit: 300, steps: 8000, weightLossWeek: 0.4 },
      setupDone: false
    },
    settings: {
      workoutDays: [],
      sessionOrder: [1, 2, 3, 4],
      preferredWorkoutTime: "17:00",
      reminderMinutesBefore: 30,
      restTimerSound: true,
      supplementSound: true,
      workoutReminderSound: true,
      units: "kg",
      theme: "dark"
    },
    customProgram: null,
    supplements: buildDefaultSupplements(),
    bodyLogs: [],
    workoutHistory: [],
    activeWorkout: null,
    nutritionLogs: [],
    supplementLogs: [],
    exercisePRs: {},
    lastExerciseData: {},
    notificationsEnabled: false,
    bodyPhotos: []
  };
  if (overrides.profile) base.profile = Object.assign({}, base.profile, overrides.profile);
  if (overrides.settings) base.settings = Object.assign({}, base.settings, overrides.settings);
  if (overrides.label) base.label = overrides.label;
  if (overrides.id) base.id = overrides.id;
  Object.keys(overrides).forEach(function (k) {
    if (k !== "profile" && k !== "settings" && k !== "label" && k !== "id") base[k] = overrides[k];
  });
  return base;
}

function flattenProfile(p, meta) {
  return {
    profile: p.profile,
    settings: p.settings,
    customProgram: p.customProgram,
    supplements: p.supplements,
    bodyLogs: p.bodyLogs || [],
    workoutHistory: p.workoutHistory || [],
    activeWorkout: p.activeWorkout || null,
    nutritionLogs: p.nutritionLogs || [],
    supplementLogs: p.supplementLogs || [],
    exercisePRs: p.exercisePRs || {},
    lastExerciseData: p.lastExerciseData || {},
    notificationsEnabled: !!p.notificationsEnabled,
    bodyPhotos: p.bodyPhotos || [],
    activeProfileId: meta.activeProfileId,
    profilesMeta: meta.profiles.map(function (x) {
      return {
        id: x.id,
        label: x.label,
        name: (x.profile && x.profile.name) || x.label,
        programName: (x.customProgram && x.customProgram.name) || null
      };
    }),
    version: 4
  };
}

function extractProfileSlice(state, id, label) {
  return {
    id: id || state.activeProfileId || newProfileId(),
    label: label || (state.profile && state.profile.name) || "پروفایل",
    createdAt: new Date().toISOString(),
    profile: state.profile,
    settings: state.settings,
    customProgram: state.customProgram || null,
    supplements: state.supplements || buildDefaultSupplements(),
    bodyLogs: state.bodyLogs || [],
    workoutHistory: state.workoutHistory || [],
    activeWorkout: state.activeWorkout || null,
    nutritionLogs: state.nutritionLogs || [],
    supplementLogs: state.supplementLogs || [],
    exercisePRs: state.exercisePRs || {},
    lastExerciseData: state.lastExerciseData || {},
    notificationsEnabled: !!state.notificationsEnabled,
    bodyPhotos: state.bodyPhotos || []
  };
}

function defaultStore() {
  var p = defaultProfileData({
    id: "p_default",
    label: "پروفایل اصلی",
    profile: {
      name: "کاربر",
      weight: 94,
      height: 178,
      age: 44,
      experienceYears: 30,
      startWeight: 94,
      limitations: ["l4l5"],
      trainingGoals: ["shoulder", "arms", "fatloss", "retain"],
      goals: { protein: 180, deficit: 400, steps: 9000, weightLossWeek: 0.45 }
    }
  });
  return { version: 4, activeProfileId: p.id, profiles: [p] };
}

function migrateToMultiProfile(parsed) {
  if (parsed && parsed.version >= 4 && Array.isArray(parsed.profiles) && parsed.profiles.length) {
    return {
      version: 4,
      activeProfileId: parsed.activeProfileId || parsed.profiles[0].id,
      profiles: parsed.profiles
    };
  }
  var id = "p_default";
  var def = defaultProfileData();
  var merged = Object.assign({}, def, parsed || {});
  merged.profile = Object.assign({}, def.profile, (parsed && parsed.profile) || {});
  merged.settings = Object.assign({}, def.settings, (parsed && parsed.settings) || {});
  var slice = extractProfileSlice(merged, id, (parsed && parsed.profile && parsed.profile.name) || "پروفایل اصلی");
  if (!slice.supplements || !slice.supplements.length) slice.supplements = buildDefaultSupplements();
  return { version: 4, activeProfileId: id, profiles: [slice] };
}

function readStore() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      var old = localStorage.getItem("bb_tracker_v1");
      if (old) {
        try {
          var store = migrateToMultiProfile(JSON.parse(old));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
          return store;
        } catch (e) {}
      }
      var s0 = defaultStore();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s0));
      return s0;
    }
    var parsed = JSON.parse(raw);
    var store = migrateToMultiProfile(parsed);
    if (!parsed.profiles || parsed.version < 4) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
    return store;
  } catch (e) {
    console.error("readStore error", e);
    return defaultStore();
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch (e) {
    console.error("writeStore error", e);
    try {
      if (e && (e.name === "QuotaExceededError" || e.code === 22)) {
        var slim = Object.assign({}, store, {
          profiles: store.profiles.map(function (p) {
            return Object.assign({}, p, { bodyPhotos: (p.bodyPhotos || []).slice(-3) });
          })
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
        return true;
      }
    } catch (e2) {
      console.error("writeStore retry failed", e2);
    }
    return false;
  }
}

function getActiveProfileFromStore(store) {
  var p = store.profiles.find(function (x) { return x.id === store.activeProfileId; });
  if (!p) {
    p = store.profiles[0];
    store.activeProfileId = p.id;
  }
  return p;
}

function loadState() {
  var store = readStore();
  var p = getActiveProfileFromStore(store);
  var existingIds = new Set((p.supplements || []).map(function (x) { return x.id; }));
  SUPPLEMENT_CATALOG.forEach(function (c) {
    if (!existingIds.has(c.id)) {
      p.supplements = p.supplements || [];
      p.supplements.push({
        id: c.id,
        enabled: !!c.defaultEnabled,
        dose: c.defaultDose,
        time: null,
        times: [],
        reminder: false,
        lastTaken: null,
        autoTime: true
      });
    }
  });
  return flattenProfile(p, store);
}

function saveState(state) {
  var store = readStore();
  var p = getActiveProfileFromStore(store);
  p.profile = state.profile;
  p.settings = state.settings;
  p.customProgram = state.customProgram || null;
  p.supplements = state.supplements;
  p.bodyLogs = state.bodyLogs || [];
  p.workoutHistory = state.workoutHistory || [];
  p.activeWorkout = state.activeWorkout || null;
  p.nutritionLogs = state.nutritionLogs || [];
  p.supplementLogs = state.supplementLogs || [];
  p.exercisePRs = state.exercisePRs || {};
  p.lastExerciseData = state.lastExerciseData || {};
  p.notificationsEnabled = !!state.notificationsEnabled;
  p.bodyPhotos = state.bodyPhotos || [];
  if (state.profile && state.profile.name) p.label = state.profile.name;
  var idx = store.profiles.findIndex(function (x) { return x.id === p.id; });
  if (idx >= 0) store.profiles[idx] = p;
  else store.profiles.push(p);
  return writeStore(store);
}

function updateState(updater) {
  var state = loadState();
  var next = typeof updater === "function" ? updater(state) : Object.assign({}, state, updater);
  saveState(next);
  return next;
}

function listProfiles() {
  var store = readStore();
  return store.profiles.map(function (p) {
    return {
      id: p.id,
      label: p.label || (p.profile && p.profile.name) || "بدون نام",
      name: (p.profile && p.profile.name) || p.label,
      active: p.id === store.activeProfileId,
      programName: (p.customProgram && p.customProgram.name) || "برنامه پیش‌فرض",
      weight: p.profile && p.profile.weight,
      sessions: (p.workoutHistory || []).filter(function (w) { return w.completed; }).length
    };
  });
}

function switchProfile(profileId) {
  var store = readStore();
  if (!store.profiles.some(function (p) { return p.id === profileId; })) {
    return { ok: false, error: "پروفایل یافت نشد" };
  }
  store.activeProfileId = profileId;
  writeStore(store);
  return { ok: true };
}

function createProfile(opts) {
  opts = opts || {};
  var store = readStore();
  if (store.profiles.length >= MAX_PROFILES) {
    return { ok: false, error: "حداکثر " + MAX_PROFILES + " پروفایل" };
  }
  var name = (opts.name || ("ورزشکار " + (store.profiles.length + 1))).trim();
  var p = defaultProfileData({
    label: name,
    profile: {
      name: name,
      weight: opts.weight != null ? Number(opts.weight) : 70,
      height: opts.height != null ? Number(opts.height) : 170,
      age: opts.age != null ? Number(opts.age) : 30,
      gender: opts.gender || "male",
      limitations: opts.limitations || [],
      setupDone: false
    }
  });
  if (opts.copyProgram && store.activeProfileId) {
    var cur = getActiveProfileFromStore(store);
    if (cur.customProgram) p.customProgram = JSON.parse(JSON.stringify(cur.customProgram));
  }
  store.profiles.push(p);
  if (opts.switchTo !== false) store.activeProfileId = p.id;
  writeStore(store);
  return { ok: true, id: p.id };
}

function renameProfile(profileId, label) {
  var store = readStore();
  var p = store.profiles.find(function (x) { return x.id === profileId; });
  if (!p) return { ok: false, error: "پروفایل یافت نشد" };
  var name = (label || "").trim();
  if (!name) return { ok: false, error: "نام خالی است" };
  p.label = name;
  if (p.profile) p.profile.name = name;
  writeStore(store);
  return { ok: true };
}

function deleteProfile(profileId) {
  var store = readStore();
  if (store.profiles.length <= 1) return { ok: false, error: "حداقل یک پروفایل باید بماند" };
  var idx = store.profiles.findIndex(function (p) { return p.id === profileId; });
  if (idx < 0) return { ok: false, error: "پروفایل یافت نشد" };
  store.profiles.splice(idx, 1);
  if (store.activeProfileId === profileId) store.activeProfileId = store.profiles[0].id;
  writeStore(store);
  return { ok: true };
}

function duplicateProfile(profileId) {
  var store = readStore();
  if (store.profiles.length >= MAX_PROFILES) return { ok: false, error: "حداکثر " + MAX_PROFILES + " پروفایل" };
  var src = store.profiles.find(function (p) { return p.id === profileId; });
  if (!src) return { ok: false, error: "پروفایل یافت نشد" };
  var copy = JSON.parse(JSON.stringify(src));
  copy.id = newProfileId();
  copy.label = (src.label || (src.profile && src.profile.name) || "پروفایل") + " (کپی)";
  if (copy.profile) copy.profile.name = copy.label;
  copy.createdAt = new Date().toISOString();
  copy.activeWorkout = null;
  store.profiles.push(copy);
  writeStore(store);
  return { ok: true, id: copy.id };
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekNumber(startDateStr) {
  var start = new Date(startDateStr);
  var now = new Date();
  var diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.min(99, Math.max(1, Math.floor(diff / 7) + 1));
}

function getDayOfWeek() {
  return new Date().getDay();
}

var IR_WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];
var DAY_NAMES_SHORT = ["ی", "د", "س", "چ", "پ", "ج", "ش"];

function sortIranWeekDays(days) {
  return days.slice().sort(function (a, b) {
    return IR_WEEK_ORDER.indexOf(a) - IR_WEEK_ORDER.indexOf(b);
  });
}

function suggestWorkoutDays(sessionsPerWeek) {
  var n = Math.min(6, Math.max(2, Number(sessionsPerWeek) || 4));
  var patterns = {
    2: [6, 2],
    3: [6, 1, 3],
    4: [6, 0, 2, 4],
    5: [6, 0, 2, 3, 5],
    6: [6, 0, 1, 2, 3, 4]
  };
  return patterns[n] || patterns[4];
}

function buildDaySessionMap(state) {
  var days = (state.settings.workoutDays && state.settings.workoutDays.length)
    ? sortIranWeekDays(state.settings.workoutDays)
    : suggestWorkoutDays((state.profile && state.profile.sessionsPerWeek) || 4);
  var order = state.settings.sessionOrder || [];
  var map = {};
  days.forEach(function (d, i) {
    map[d] = order[i] != null ? order[i] : (i + 1);
  });
  return map;
}

function getTodaySessionId(state) {
  var day = getDayOfWeek();
  var map = buildDaySessionMap(state);
  return map[day] != null ? map[day] : null;
}

function getActiveProgram(state) {
  if (state && state.customProgram && state.customProgram.sessions && state.customProgram.sessions.length) {
    return state.customProgram;
  }
  return PROGRAM;
}

function isWorkoutDay(state) {
  return getTodaySessionId(state) !== null;
}

function isSuppOnRestDay(timing) {
  return timing !== "pre" && timing !== "post";
}

var DAY_NAMES_FA = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
