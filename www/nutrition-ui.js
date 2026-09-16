// ========== Nutrition UI ==========
function renderNutritionDashboardBlock() {
  const targets = calcNutritionTargets(state);
  const log = getTodayNutritionLog();
  const totals = { calories: log.calories || 0, protein: log.protein || 0, carbs: log.carbs || 0, fat: log.fat || 0, fiber: log.fiber || 0 };
  const rem = {
    calories: Math.max(0, targets.calories - totals.calories),
    protein: Math.max(0, +(targets.protein - totals.protein).toFixed(1)),
    carbs: Math.max(0, +(targets.carbs - totals.carbs).toFixed(1)),
    fat: Math.max(0, +(targets.fat - totals.fat).toFixed(1)),
    fiber: Math.max(0, +(targets.fiber - totals.fiber).toFixed(1))
  };
  const gaps = analyzeNutritionGaps(totals, targets);
  const tips = suggestSupplementsFromNutrition(gaps, totals, targets);
  const pct = (a, b) => Math.min(100, Math.round((b ? a / b : 0) * 100));
  const mealsHtml = (log.meals || []).length
    ? log.meals.map(m => `
      <div class="nut-meal">
        <div class="nut-meal-top">
          <div>
            <strong>${m.label || m.text}</strong>
            ${m.estimated ? `<span class="tag tag-warning" style="margin-right:6px">تخمین</span>` : ""}
            <div class="text-muted" style="font-size:0.72rem;margin-top:2px">${m.text || ""}</div>
          </div>
          <div style="text-align:left;flex-shrink:0">
            <div style="font-weight:800">${m.totals?.kcal || 0} kcal</div>
            <div class="text-muted" style="font-size:0.7rem">P ${m.totals?.protein || 0} · C ${m.totals?.carbs || 0} · F ${m.totals?.fat || 0}</div>
          </div>
        </div>
        <div class="nut-meal-actions">
          <label class="text-muted" style="font-size:0.75rem">سروینگ
            <input type="number" step="0.25" min="0.25" value="${m.servings || 1}" style="width:64px;margin-right:6px"
              onchange="adjustMealServing('${m.id}', this.value)" />
          </label>
          <button type="button" class="btn btn-sm btn-secondary" onclick="showMealBreakdown('${m.id}')">جزئیات</button>
          <button type="button" class="btn btn-sm btn-danger" onclick="removeMeal('${m.id}')">حذف</button>
        </div>
      </div>`).join("")
    : `<div class="empty-state" style="padding:20px"><div class="icon">🍽️</div><p>هنوز غذایی ثبت نشده. از عبارت فارسی یا غذاهای سریع استفاده کنید.</p></div>`;
  const quick = (typeof QUICK_IRANIAN_FOODS !== "undefined" ? QUICK_IRANIAN_FOODS : []).map(q =>
    `<button type="button" class="nut-quick" onclick='addFoodFromText(${JSON.stringify(q.text)})'>${q.label}</button>`
  ).join("");
  const gapsHtml = gaps.length
    ? gaps.map(g => `<div class="nut-gap"><strong>${g.title}</strong><p>${g.detail}</p></div>`).join("")
    : `<p class="text-muted" style="font-size:0.82rem">نسبت به اهداف غذایی امروز فاصلهٔ قابل‌توجهی دیده نمی‌شود (بر اساس لاگ).</p>`;
  const tipsHtml = tips.length
    ? tips.map(t => `
      <div class="nut-supp">
        <strong>${t.name}</strong>
        <p>${t.reason}</p>
        <ul>
          <li>مقدار عمومی: ${t.dose}</li>
          <li>زمان: ${t.timing}</li>
          <li class="text-muted">${t.warnings}</li>
        </ul>
      </div>`).join("")
    : `<p class="text-muted" style="font-size:0.82rem">پیشنهاد مکمل خاصی بر اساس لاگ فعلی نیست. اولویت با غذای کامل است.</p>`;
  return `
    <div class="card nut-card" id="nutrition-dashboard">
      <div class="flex-between mb-1">
        <div class="card-title" style="margin:0">تغذیه امروز</div>
        <button type="button" class="btn btn-sm btn-secondary" onclick="navigate('nutrition')">کامل</button>
      </div>
      <div class="nut-calories">
        <div class="nut-cal-val">${totals.calories.toLocaleString("en")} <span>/ ${targets.calories.toLocaleString("en")} kcal</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct(totals.calories, targets.calories)}%"></div></div>
        <div class="text-muted" style="font-size:0.75rem;margin-top:4px">باقی‌مانده تقریبی: ${rem.calories} kcal</div>
      </div>
      <div class="nut-macros">
        <div class="nut-mac"><div class="nut-mac-val">${totals.protein}/${targets.protein}g</div><div class="nut-mac-lbl">پروتئین</div><div class="progress-bar"><div class="progress-fill" style="width:${pct(totals.protein, targets.protein)}%;background:var(--primary)"></div></div></div>
        <div class="nut-mac"><div class="nut-mac-val">${totals.carbs}/${targets.carbs}g</div><div class="nut-mac-lbl">کربوهیدرات</div><div class="progress-bar"><div class="progress-fill" style="width:${pct(totals.carbs, targets.carbs)}%;background:var(--warning)"></div></div></div>
        <div class="nut-mac"><div class="nut-mac-val">${totals.fat}/${targets.fat}g</div><div class="nut-mac-lbl">چربی</div><div class="progress-bar"><div class="progress-fill" style="width:${pct(totals.fat, targets.fat)}%;background:var(--accent)"></div></div></div>
      </div>
    </div>
    <div class="card nut-card">
      <div class="card-title">افزودن غذا (فارسی)</div>
      <textarea class="form-input" id="nut-nl-input" rows="2" placeholder="مثال: ظهر یک بشقاب قورمه‌سبزی با برنج خوردم"></textarea>
      <button type="button" class="btn btn-primary btn-block mt-1" onclick="submitFoodText()">ثبت تخمین وعده</button>
      <p class="text-muted" style="font-size:0.72rem;margin-top:8px;line-height:1.5">مقادیر تقریبی‌اند (سروینگ استاندارد داخلی). بعد از ثبت می‌توانید سروینگ را اصلاح کنید.</p>
      <div class="card-title" style="margin-top:12px">غذاهای سریع ایرانی</div>
      <div class="nut-quick-grid">${quick}</div>
    </div>
    <div class="card nut-card">
      <div class="card-title">وعده‌های امروز</div>
      ${mealsHtml}
    </div>
    <div class="card nut-card">
      <div class="card-title">باقی‌مانده اهداف</div>
      <div class="nut-remain">
        <div>کالری: <strong>${rem.calories}</strong> kcal</div>
        <div>پروتئین: <strong>${rem.protein}</strong> g</div>
        <div>کربوهیدرات: <strong>${rem.carbs}</strong> g</div>
        <div>چربی: <strong>${rem.fat}</strong> g</div>
        <div>فیبر: <strong>${rem.fiber}</strong> / ${targets.fiber} g</div>
      </div>
    </div>
    <div class="card nut-card">
      <div class="card-title">فاصله با اهداف غذایی</div>
      <p class="text-muted" style="font-size:0.75rem;margin-bottom:8px">این‌ها کمبود پزشکی/آزمایشگاهی نیستند؛ فقط مقایسه با هدف تغذیه‌ای پروفایل است.</p>
      ${gapsHtml}
    </div>
    <div class="card nut-card">
      <div class="card-title">پیشنهاد مکمل (غیردرمانی)</div>
      ${tipsHtml}
    </div>`;
}
function renderNutritionEnhanced() { return renderNutritionDashboardBlock(); }
function submitFoodText() {
  const el = document.getElementById("nut-nl-input");
  const text = (el && el.value || "").trim();
  if (!text) { toast("متن غذا را بنویسید", "warning"); return; }
  addFoodFromText(text);
  if (el) el.value = "";
}
function addFoodFromText(text) {
  const meal = parseFoodText(text);
  if (!meal) return;
  if (meal.unknown) toast("غذا شناخته نشد — از لیست سریع یا نام رایج‌تر استفاده کنید", "warning");
  const log = getTodayNutritionLog();
  log.meals.push(meal);
  saveTodayNutritionLog(log);
  toast((meal.estimated ? "تخمین ثبت شد: " : "ثبت شد: ") + (meal.totals.kcal || 0) + " kcal", meal.unknown ? "warning" : "success");
  if (typeof render === "function") render();
}
function adjustMealServing(id, val) {
  const v = Math.max(0.25, Number(val) || 1);
  const log = getTodayNutritionLog();
  const idx = log.meals.findIndex(m => m.id === id);
  if (idx < 0) return;
  log.meals[idx] = scaleMeal(log.meals[idx], v);
  saveTodayNutritionLog(log);
  if (typeof render === "function") render();
}
function removeMeal(id) {
  const log = getTodayNutritionLog();
  log.meals = log.meals.filter(m => m.id !== id);
  saveTodayNutritionLog(log);
  toast("وعده حذف شد", "success");
  if (typeof render === "function") render();
}
function showMealBreakdown(id) {
  const log = getTodayNutritionLog();
  const m = log.meals.find(x => x.id === id);
  if (!m) return;
  const lines = (m.items || []).map(it => it.name + ": " + it.grams + "g → " + it.kcal + " kcal | P" + it.p + " C" + it.c + " F" + it.f).join("\n");
  alert((m.estimated ? "⚠️ تخمین سروینگ استاندارد\n\n" : "") + (m.label || "") + "\n\n" + (lines || "جزئیات موجود نیست"));
}
window.renderNutritionDashboardBlock = renderNutritionDashboardBlock;
window.renderNutritionEnhanced = renderNutritionEnhanced;
window.submitFoodText = submitFoodText;
window.addFoodFromText = addFoodFromText;
window.adjustMealServing = adjustMealServing;
window.removeMeal = removeMeal;
window.showMealBreakdown = showMealBreakdown;
