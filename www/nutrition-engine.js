// ========== Nutrition engine ==========
function _normFa(s) {
  return String(s || "").replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/‌/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}
function _findFoodKey(name) {
  const n = _normFa(name);
  for (const [k, v] of Object.entries(IR_FOOD_DB)) {
    if (_normFa(k) === n) return k;
    if ((v.aliases || []).some(a => _normFa(a) === n || n.includes(_normFa(a)))) return k;
  }
  for (const [k, v] of Object.entries(IR_FOOD_DB)) {
    if (n.includes(_normFa(k))) return k;
  }
  return null;
}
function _macrosFromFood(foodKey, grams) {
  const f = IR_FOOD_DB[foodKey];
  if (!f) return { kcal: 0, p: 0, c: 0, f: 0, fiber: 0, foodKey, grams };
  const m = grams / 100;
  return {
    foodKey, grams: Math.round(grams),
    kcal: +(f.per100.kcal * m).toFixed(1),
    p: +(f.per100.p * m).toFixed(1),
    c: +(f.per100.c * m).toFixed(1),
    f: +(f.per100.f * m).toFixed(1),
    fiber: +(f.per100.fiber * m).toFixed(1)
  };
}
function _sumItems(items) {
  return items.reduce((a, it) => ({
    kcal: a.kcal + (it.kcal || 0), p: a.p + (it.p || 0), c: a.c + (it.c || 0),
    f: a.f + (it.f || 0), fiber: a.fiber + (it.fiber || 0)
  }), { kcal: 0, p: 0, c: 0, f: 0, fiber: 0 });
}
function _parseQuantity(text) {
  const t = _normFa(text);
  const faNums = { "یک": 1, "۱": 1, "دو": 2, "۲": 2, "سه": 3, "۳": 3, "چهار": 4, "۴": 4, "نیم": 0.5, "نصف": 0.5 };
  let qty = 1;
  const m = t.match(/(\d+(?:\.\d+)?)/);
  if (m) qty = parseFloat(m[1]);
  else {
    for (const [k, v] of Object.entries(faNums)) {
      if (t.includes(k)) { qty = v; break; }
    }
  }
  let unit = "بشقاب";
  const units = ["میلی‌لیتر","میلی لیتر","کف دست","بشقاب","پرس","کاسه","لیوان","قاشق","عدد","گرم","مشت"];
  for (const u of units) {
    if (t.includes(u)) { unit = u; break; }
  }
  if (t.includes("مشت")) unit = "مشت";
  return { qty, unit };
}
function resolveRecipe(text) {
  const t = _normFa(text);
  for (const [name, rec] of Object.entries(IR_RECIPES)) {
    const keys = [name].concat(rec.aliases || []);
    if (keys.some(k => t.includes(_normFa(k)))) return { name, rec };
  }
  return null;
}
function parseFoodText(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const { qty, unit } = _parseQuantity(raw);
  const recipeHit = resolveRecipe(raw);
  if (recipeHit) {
    let mult = qty;
    if (unit === "نصف" || qty === 0.5) mult = 0.5;
    const items = recipeHit.rec.ingredients.map(ing => {
      const row = _macrosFromFood(ing.food, ing.g * mult);
      return Object.assign({ name: ing.food }, row);
    });
    const totals = _sumItems(items);
    return {
      id: "m_" + Date.now().toString(36), text: raw, label: recipeHit.name,
      servingLabel: recipeHit.rec.servingLabel, servings: mult, estimated: true, items,
      totals: { kcal: Math.round(totals.kcal), protein: +totals.p.toFixed(1), carbs: +totals.c.toFixed(1), fat: +totals.f.toFixed(1), fiber: +totals.fiber.toFixed(1) }
    };
  }
  const items = [];
  if (/تخم/.test(_normFa(raw))) {
    const n = qty || 1;
    const g = (IR_FOOD_DB["تخم مرغ"].pieceG || 50) * n;
    items.push(Object.assign({ name: "تخم مرغ" }, _macrosFromFood("تخم مرغ", g)));
  }
  if (/سنگک|بربری|لواش|تافتون|نان/.test(_normFa(raw))) {
    let key = "نان سنگک";
    if (/بربری/.test(_normFa(raw))) key = "نان بربری";
    else if (/لواش/.test(_normFa(raw))) key = "نان لواش";
    else if (/تافتون/.test(_normFa(raw))) key = "نان تافتون";
    let g;
    if (unit === "کف دست") g = 40 * qty;
    else if (unit === "عدد") g = (IR_FOOD_DB[key].pieceG || 80) * qty;
    else if (unit === "گرم") g = qty;
    else g = (IR_FOOD_DB[key].pieceG || 80) * qty;
    items.push(Object.assign({ name: key }, _macrosFromFood(key, g)));
  }
  if (/ماست/.test(_normFa(raw))) {
    const g = unit === "کاسه" ? 200 * qty : (unit === "گرم" ? qty : 200);
    items.push(Object.assign({ name: "ماست" }, _macrosFromFood("ماست", g)));
  }
  if (/گردو/.test(_normFa(raw))) {
    const g = unit === "مشت" ? 20 * qty : (unit === "عدد" ? 5 * qty : 20);
    items.push(Object.assign({ name: "گردو" }, _macrosFromFood("گردو", g)));
  }
  if (!items.length) {
    const key = _findFoodKey(raw);
    if (key) {
      const db = IR_FOOD_DB[key];
      let g = 100;
      if (unit === "گرم") g = qty;
      else if (db.pieceG && (unit === "عدد" || unit === "بشقاب")) g = db.pieceG * qty;
      else g = 100 * qty;
      items.push(Object.assign({ name: key }, _macrosFromFood(key, g)));
    }
  }
  if (!items.length) {
    return { id: "m_" + Date.now().toString(36), text: raw, label: raw, servingLabel: "تخمین نشده", servings: 1, estimated: true, items: [], totals: { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }, unknown: true };
  }
  const totals = _sumItems(items);
  return {
    id: "m_" + Date.now().toString(36), text: raw, label: items.map(i => i.name).join(" + "),
    servingLabel: qty + " " + unit, servings: qty, estimated: true, items,
    totals: { kcal: Math.round(totals.kcal), protein: +totals.p.toFixed(1), carbs: +totals.c.toFixed(1), fat: +totals.f.toFixed(1), fiber: +totals.fiber.toFixed(1) }
  };
}
function scaleMeal(meal, newServings) {
  const factor = newServings / (meal.servings || 1);
  const items = (meal.items || []).map(it => {
    const g = (it.grams || 0) * factor;
    const row = _macrosFromFood(it.foodKey || it.name, g);
    return Object.assign({ name: it.name }, row);
  });
  const totals = _sumItems(items);
  return Object.assign({}, meal, {
    servings: newServings, items,
    totals: { kcal: Math.round(totals.kcal), protein: +totals.p.toFixed(1), carbs: +totals.c.toFixed(1), fat: +totals.f.toFixed(1), fiber: +totals.fiber.toFixed(1) }
  });
}
function getTodayNutritionLog() {
  const today = getTodayStr();
  let log = (state.nutritionLogs || []).find(l => l.date === today);
  if (!log) log = { date: today, meals: [], calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  if (!Array.isArray(log.meals)) log.meals = [];
  return log;
}
function recomputeDayTotals(log) {
  const t = (log.meals || []).reduce((a, m) => {
    const x = m.totals || {};
    return {
      calories: a.calories + (x.kcal || 0), protein: a.protein + (x.protein || 0),
      carbs: a.carbs + (x.carbs || 0), fat: a.fat + (x.fat || 0), fiber: a.fiber + (x.fiber || 0)
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  log.calories = Math.round(t.calories);
  log.protein = +t.protein.toFixed(1);
  log.carbs = +t.carbs.toFixed(1);
  log.fat = +t.fat.toFixed(1);
  log.fiber = +t.fiber.toFixed(1);
  return log;
}
function saveTodayNutritionLog(log) {
  recomputeDayTotals(log);
  state.nutritionLogs = (state.nutritionLogs || []).filter(l => l.date !== log.date);
  state.nutritionLogs.push(log);
  saveState(state);
}
function calcNutritionTargets(st) {
  const p = st.profile || {};
  const weight = Number(p.weight) || 70;
  const height = Number(p.height) || 170;
  const age = Number(p.age) || 30;
  const male = (p.gender || "male") === "male";
  let bmr = male ? 10 * weight + 6.25 * height - 5 * age + 5 : 10 * weight + 6.25 * height - 5 * age - 161;
  const actMap = { low: 1.2, moderate: 1.375, high: 1.55, athlete: 1.725 };
  const act = actMap[p.activityLevel] || 1.375;
  let tdee = bmr * act;
  const deficit = Number(p.goals && p.goals.deficit) || 300;
  const calories = Math.max(1400, Math.round(tdee - deficit));
  const protein = Number(p.goals && p.goals.protein) || Math.round(weight * 1.8);
  const proKcal = protein * 4;
  const fat = Math.round((calories * 0.28) / 9);
  const fatKcal = fat * 9;
  const carbs = Math.max(80, Math.round((calories - proKcal - fatKcal) / 4));
  const fiber = 30;
  return { calories, protein, carbs, fat, fiber, bmr: Math.round(bmr), tdee: Math.round(tdee) };
}
function analyzeNutritionGaps(totals, targets) {
  const gaps = [];
  const pct = (a, b) => (b ? a / b : 1);
  if (pct(totals.protein || 0, targets.protein) < 0.75) {
    gaps.push({ key: "protein", title: "پروتئین کمتر از هدف", detail: "حدود " + Math.round(targets.protein - (totals.protein || 0)) + " گرم کمتر از هدف روزانه (هدف غذایی، نه تشخیص پزشکی)." });
  }
  if (pct(totals.fiber || 0, targets.fiber) < 0.6) {
    gaps.push({ key: "fiber", title: "فیبر پایین نسبت به هدف", detail: "با سبزی، حبوبات و نان سبوس‌دار می‌توان فیبر را بالا برد. این یک مقایسه با هدف غذایی است." });
  }
  if (pct(totals.calories || 0, targets.calories) < 0.7) {
    gaps.push({ key: "calories", title: "کالری دریافتی کمتر از هدف", detail: "اگر هدف کاهش وزن شدید نیست، دریافت خیلی پایین می‌تواند ریکاوری را سخت کند." });
  }
  if (pct(totals.carbs || 0, targets.carbs) < 0.55) {
    gaps.push({ key: "carbs", title: "کربوهیدرات کمتر از هدف تقریبی", detail: "برای تمرین مقاومتی، کربوهیدرات کافی به عملکرد کمک می‌کند." });
  }
  return gaps;
}
function suggestSupplementsFromNutrition(gaps, totals, targets) {
  const tips = [];
  const proGap = targets.protein - (totals.protein || 0);
  if (proGap >= 25) {
    tips.push({
      name: "پروتئین وی / پروتئین مکمل",
      reason: "پروتئین ثبت‌شده حدود " + Math.round(proGap) + " گرم کمتر از هدف غذایی است. اول با غذا جبران کنید؛ در صورت سختی می‌توان از مکمل پروتئین استفاده کرد.",
      dose: "معمولاً ۲۰–۳۰ گرم پروتئین در هر سروینگ (برچسب محصول را بخوانید)",
      timing: "بین وعده‌ها یا بعد از تمرین — در صورت نیاز",
      warnings: "جایگزین رژیم متعادل نیست. در بیماری کلیوی یا تجویز پزشک، قبل از مصرف مشورت کنید. این پیشنهاد درمانی نیست."
    });
  }
  if (gaps.some(g => g.key === "fiber")) {
    tips.push({
      name: "فیبر غذایی (پسیلیوم) — اختیاری",
      reason: "فیبر ثبت‌شده نسبت به هدف پایین است. اولویت با سبزی، میوه، حبوبات و نان سبوس‌دار است.",
      dose: "در صورت استفاده، طبق برچسب و با آب کافی",
      timing: "همراه وعده",
      warnings: "با فاصله از داروها مصرف شود. پیشنهاد پزشکی نیست."
    });
  }
  if (gaps.some(g => g.key === "calories") && proGap < 25) {
    tips.push({
      name: "میان‌وعده کالری‌متراکم غذایی",
      reason: "کالری روزانه کمتر از هدف است. قبل از مکمل، آجیل، شیر، نان و پنیر یا یک پرس اضافه غذایی ساده‌تر است.",
      dose: "—", timing: "میان‌وعده", warnings: "مکمل جایگزین غذا نیست."
    });
  }
  return tips;
}
