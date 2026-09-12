// ========== LOCAL STORAGE LAYER ==========
const STORAGE_KEY = "bb_tracker_v2";

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

const defaultState = () => ({
  profile: {
    name: "کاربر",
    weight: 94,
    height: 178,
    age: 44,
    gender: "male",
    experienceYears: 30,
    startDate: new Date().toISOString().slice(0, 10),
    startWeight: 94,
    startWaist: null,
    limitations: ["l4l5"],
    trainingGoals: ["shoulder", "arms", "fatloss", "retain"],
    sessionsPerWeek: 4,
    sessionDuration: 70,
    equipment: "gym",
    goals: {
      protein: 180,
      deficit: 400,
      steps: 9000,
      weightLossWeek: 0.45
    },
    setupDone: false
  },
  settings: {
    workoutDays: [1, 2, 4, 5],
    sessionOrder: [1, 2, 3, 4],
    preferredWorkoutTime: "17:00",
    reminderMinutesBefore: 30,
    restTimerSound: true,
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
  version: 2
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const old = localStorage.getItem("bb_tracker_v1");
      if (old) {
        try {
          const parsed = JSON.parse(old);
          const s = defaultState();
          s.profile = { ...s.profile, ...(parsed.profile || {}) };
          s.settings = { ...s.settings, ...(parsed.settings || {}) };
          s.bodyLogs = parsed.bodyLogs || [];
          s.workoutHistory = parsed.workoutHistory || [];
          s.nutritionLogs = parsed.nutritionLogs || [];
          s.exercisePRs = parsed.exercisePRs || {};
          s.lastExerciseData = parsed.lastExerciseData || {};
          const oldMap = {};
          (parsed.supplements || []).forEach(x => { oldMap[x.id] = x; });
          s.supplements = buildDefaultSupplements().map(ns => {
            const o = oldMap[ns.id];
            if (o) return { ...ns, enabled: o.enabled, dose: o.dose || ns.dose, time: o.time, reminder: o.reminder !== false };
            return ns;
          });
          saveState(s);
          return s;
        } catch (e) { /* fallthrough */ }
      }
      const s = defaultState();
      saveState(s);
      return s;
    }
    const parsed = JSON.parse(raw);
    const def = defaultState();
    const existingIds = new Set((parsed.supplements || []).map(x => x.id));
    let supps = parsed.supplements || def.supplements;
    SUPPLEMENT_CATALOG.forEach(c => {
      if (!existingIds.has(c.id)) {
        supps.push({
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
    return {
      ...def,
      ...parsed,
      profile: { ...def.profile, ...parsed.profile },
      settings: { ...def.settings, ...parsed.settings },
      supplements: supps,
      customProgram: parsed.customProgram || null
    };
  } catch (e) {
    console.error("Load error", e);
    return defaultState();
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Save error", e);
  }
}

function updateState(updater) {
  const state = loadState();
  const next = typeof updater === "function" ? updater(state) : { ...state, ...updater };
  saveState(next);
  return next;
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekNumber(startDateStr) {
  const start = new Date(startDateStr);
  const now = new Date();
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.min(99, Math.max(1, Math.floor(diff / 7) + 1));
}

function getDayOfWeek() {
  return new Date().getDay();
}

function suggestWorkoutDays(sessionsPerWeek) {
  const n = Math.min(6, Math.max(2, Number(sessionsPerWeek) || 4));
  const patterns = {
    2: [1, 4],
    3: [1, 3, 5],
    4: [1, 2, 4, 5],
    5: [1, 2, 4, 5, 6],
    6: [1, 2, 3, 4, 5, 6]
  };
  return patterns[n] || patterns[4];
}

function buildDaySessionMap(state) {
  const days = (state.settings.workoutDays && state.settings.workoutDays.length)
    ? [...state.settings.workoutDays].sort((a, b) => a - b)
    : suggestWorkoutDays(state.profile?.sessionsPerWeek || 4);
  const order = state.settings.sessionOrder || [];
  const map = {};
  days.forEach((d, i) => {
    map[d] = order[i] != null ? order[i] : (i + 1);
  });
  return map;
}

function getTodaySessionId(state) {
  const day = getDayOfWeek();
  const map = buildDaySessionMap(state);
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

const DAY_NAMES_FA = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
