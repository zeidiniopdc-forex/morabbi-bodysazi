// ========== UX v4 — Meal plan page ==========
function renderMealPlanPage() {
  const targets = typeof calcNutritionTargets === "function" ? calcNutritionTargets(state) : { calories: 2000, protein: 150, carbs: 200, fat: 60, fiber: 30 };
  const goal = state.profile.dietGoal || "fatloss";
  const mealsN = state.profile.mealsPerDay || 4;
  return `
    <div class="ux-page-title">برنامه غذایی</div>
    <div class="card">
      <div class="card-title">هدف</div>
      <select class="form-select" id="diet-goal" onchange="state.profile.dietGoal=this.value;saveState(state);render()">
        <option value="fatloss" ${goal==="fatloss"?"selected":""}>کاهش چربی</option>
        <option value="maintain" ${goal==="maintain"?"selected":""}>نگهداری وزن</option>
        <option value="muscle" ${goal==="muscle"?"selected":""}>افزایش عضله</option>
        <option value="recomp" ${goal==="recomp"?"selected":""}>Recomposition</option>
        <option value="retain" ${goal==="retain"?"selected":""}>حفظ عضله هنگام کات</option>
      </select>
      <div class="form-group mt-1">
        <label class="form-label">تعداد وعده</label>
        <select class="form-select" id="meals-n" onchange="state.profile.mealsPerDay=Number(this.value);saveState(state);render()">
          ${[3,4,5,6].map(n => `<option value="${n}" ${mealsN===n?"selected":""}>${n} وعده</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="card">
      <div class="card-title">اهداف محاسبه‌شده</div>
      <div class="nut-macros">
        <div class="nut-mac"><div class="nut-mac-val">${targets.calories}</div><div class="nut-mac-lbl">کالری</div></div>
        <div class="nut-mac"><div class="nut-mac-val">${targets.protein}g</div><div class="nut-mac-lbl">پروتئین</div></div>
        <div class="nut-mac"><div class="nut-mac-val">${targets.carbs}g</div><div class="nut-mac-lbl">کربوهیدرات</div></div>
      </div>
      <p class="text-muted" style="font-size:0.8rem;margin-top:10px">چربی ≈ ${targets.fat}g · فیبر ≈ ${targets.fiber}g · بر اساس پروفایل (تخمین)</p>
    </div>
    <div class="card">
      <div class="card-title">نمونه وعده‌های ایرانی (تخمینی)</div>
      ${buildSampleIranianDay(targets, mealsN)}
    </div>
    <div class="card">
      <div class="card-title">غذاهای حذف‌شده / مورد علاقه</div>
      <textarea class="form-input" id="diet-notes" rows="2" placeholder="مثلاً: بدون لبنیات · علاقه به جوجه و برنج"
        onchange="state.profile.dietNotes=this.value;saveState(state)">${state.profile.dietNotes || ""}</textarea>
    </div>
    <button class="btn btn-primary btn-block" onclick="navigate('nutrition')">ثبت غذای امروز</button>
    <p class="text-muted" style="font-size:0.75rem;margin-top:10px;line-height:1.5">این برنامه راهنمای عمومی است و جایگزین مشاوره متخصص تغذیه نیست.</p>
  `;
}
function buildSampleIranianDay(targets, n) {
  const per = Math.round(targets.calories / n);
  const samples = [
    { t: "صبحانه", e: "نان سنگک + پنیر + گردو + چای", k: Math.round(per * 0.9) },
    { t: "میان‌وعده", e: "ماست + میوه یا یک مشت آجیل", k: Math.round(per * 0.7) },
    { t: "ناهار", e: "چلو جوجه / قورمه با برنج (سروینگ کنترل‌شده)", k: Math.round(per * 1.15) },
    { t: "شام", e: "خوراک مرغ یا ماهی + سبزیجات + مقدار کم برنج", k: Math.round(per * 1.0) },
    { t: "قبل خواب", e: "کاسه ماست یا پنیر کم‌چرب (در صورت تحمل)", k: Math.round(per * 0.6) }
  ].slice(0, n);
  return samples.map(s => `
    <div class="ux-meal-row">
      <strong>${s.t}</strong>
      <div class="text-muted" style="font-size:0.82rem">${s.e}</div>
      <div style="font-weight:700;font-size:0.85rem">≈ ${s.k} kcal</div>
    </div>`).join("");
}
window.renderMealPlanPage = renderMealPlanPage;
