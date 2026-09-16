// ========== UX v4 — Saved programs library ==========
function ensureProgramsLibrary() {
  state.savedPrograms = state.savedPrograms || [];
  if (state.customProgram && state.customProgram.sessions && state.customProgram.sessions.length) {
    const exists = state.savedPrograms.some(p => p.program && p.program.name === state.customProgram.name);
    if (!exists) {
      state.savedPrograms.unshift({
        id: state.customProgram.id || ("prog_" + Date.now().toString(36)),
        name: state.customProgram.name || "برنامه جاری",
        program: JSON.parse(JSON.stringify(state.customProgram)),
        savedAt: new Date().toISOString(),
        active: true
      });
      saveState(state);
    }
  }
  if (!state.savedPrograms.length && typeof PROGRAM !== "undefined") {
    state.savedPrograms.push({
      id: "prog_default",
      name: PROGRAM.name || "برنامه پیش‌فرض",
      program: JSON.parse(JSON.stringify(PROGRAM)),
      savedAt: new Date().toISOString(),
      active: !state.customProgram
    });
  }
}
function renderProgramsPage() {
  ensureProgramsLibrary();
  const activeName = (getActiveProgram(state).name) || "—";
  const list = state.savedPrograms.map(p => {
    const isActive = state.customProgram
      ? (state.customProgram.name === p.program.name || p.active)
      : p.id === "prog_default";
    const sessCount = (p.program.sessions || []).length;
    return `
      <div class="card ux-prog ${isActive ? "is-active" : ""}">
        <div class="flex-between">
          <div>
            <strong>${p.name || p.program.name}</strong>
            ${isActive ? '<span class="tag tag-success" style="margin-right:6px">جاری</span>' : ""}
            <div class="text-muted" style="font-size:0.78rem;margin-top:4px">${sessCount} جلسه · ${p.program.weeks || "—"} هفته</div>
          </div>
        </div>
        <div class="ux-prog-actions">
          ${!isActive ? `<button class="btn btn-sm btn-primary" onclick="activateSavedProgram('${p.id}')">انتخاب به‌عنوان جاری</button>` : ""}
          <button class="btn btn-sm btn-secondary" onclick="previewSavedProgram('${p.id}')">مشاهده</button>
          <button class="btn btn-sm btn-secondary" onclick="duplicateSavedProgram('${p.id}')">کپی</button>
          ${p.id !== "prog_default" ? `<button class="btn btn-sm btn-danger" onclick="deleteSavedProgram('${p.id}')">حذف</button>` : ""}
        </div>
      </div>`;
  }).join("");
  return `
    <div class="ux-page-title">برنامه‌های من</div>
    <p class="text-muted" style="font-size:0.85rem;margin-bottom:12px">برنامه جاری: <strong>${activeName}</strong></p>
    ${list || '<div class="empty-state"><p>برنامه‌ای ذخیره نشده</p></div>'}
    <button class="btn btn-primary btn-block mt-2" onclick="navigate('coach')">＋ ساخت برنامه جدید با مربی</button>
    <button class="btn btn-secondary btn-block mt-1" onclick="saveCurrentAsProgram()">ذخیره برنامه جاری در کتابخانه</button>
  `;
}
function saveCurrentAsProgram() {
  ensureProgramsLibrary();
  const prog = getActiveProgram(state);
  const name = prompt("نام برنامه:", prog.name || "برنامه من");
  if (name == null) return;
  state.savedPrograms.unshift({
    id: "prog_" + Date.now().toString(36),
    name: name.trim() || prog.name,
    program: JSON.parse(JSON.stringify(prog)),
    savedAt: new Date().toISOString(),
    active: false
  });
  saveState(state);
  toast("برنامه ذخیره شد", "success");
  render();
}
function activateSavedProgram(id) {
  ensureProgramsLibrary();
  const p = state.savedPrograms.find(x => x.id === id);
  if (!p) return;
  const cur = getActiveProgram(state);
  if (!confirm("برنامه جاری: " + (cur.name || "—") + "\n\nجایگزین با: " + (p.name || p.program.name) + "\n\nتاریخچه جلسات قبلی پاک نمی‌شود. ادامه؟")) return;
  state.customProgram = JSON.parse(JSON.stringify(p.program));
  state.customProgram.name = p.name || p.program.name;
  state.savedPrograms.forEach(x => { x.active = x.id === id; });
  if (p.program.workoutDays) state.settings.workoutDays = p.program.workoutDays.slice();
  if (p.program.sessionsPerWeek) state.profile.sessionsPerWeek = p.program.sessionsPerWeek;
  saveState(state);
  toast("برنامه جاری عوض شد", "success");
  navigate("dashboard");
}
function previewSavedProgram(id) {
  const p = (state.savedPrograms || []).find(x => x.id === id);
  if (!p) return;
  const lines = (p.program.sessions || []).map(s => "• " + s.name + " (" + (s.exercises || []).length + " حرکت)").join("\n");
  alert((p.name || "") + "\n" + (p.program.weeks || "?") + " هفته\n\n" + lines);
}
function duplicateSavedProgram(id) {
  ensureProgramsLibrary();
  const p = state.savedPrograms.find(x => x.id === id);
  if (!p) return;
  state.savedPrograms.push({
    id: "prog_" + Date.now().toString(36),
    name: (p.name || "برنامه") + " (کپی)",
    program: JSON.parse(JSON.stringify(p.program)),
    savedAt: new Date().toISOString(),
    active: false
  });
  saveState(state);
  toast("کپی شد", "success");
  render();
}
function deleteSavedProgram(id) {
  if (id === "prog_default") return;
  if (!confirm("حذف این برنامه از کتابخانه؟")) return;
  state.savedPrograms = (state.savedPrograms || []).filter(x => x.id !== id);
  saveState(state);
  toast("حذف شد", "success");
  render();
}
function swapProgramInWorkout() {
  ensureProgramsLibrary();
  const options = state.savedPrograms.map((p, i) => (i + 1) + ") " + (p.name || p.program.name)).join("\n");
  const ans = prompt("شماره برنامه جایگزین برای امروز:\n" + options);
  if (ans == null) return;
  const idx = Number(ans) - 1;
  const p = state.savedPrograms[idx];
  if (!p) { toast("نامعتبر", "warning"); return; }
  const sess = (p.program.sessions || [])[0];
  if (!sess) { toast("این برنامه جلسه‌ای ندارد", "warning"); return; }
  if (!confirm("جلسه امروز با «" + sess.name + "» از برنامه «" + (p.name || "") + "» جایگزین شود؟\nتاریخچه قبلی حفظ می‌شود.")) return;
  if (state.activeWorkout) {
    state.activeWorkout.sessionId = sess.id;
    state.activeWorkout.exercises = (sess.exercises || []).map(ex => Object.assign({}, ex, {
      setsData: Array.from({ length: ex.sets || 3 }, function () { return { weight: "", reps: "", done: false }; }),
      painFlag: false
    }));
    saveState(state);
    toast("برنامه جلسه عوض شد", "success");
    render();
  } else {
    state.customProgram = JSON.parse(JSON.stringify(p.program));
    saveState(state);
    toast("برنامه جاری عوض شد", "success");
    navigate("workouts");
  }
}
window.renderProgramsPage = renderProgramsPage;
window.saveCurrentAsProgram = saveCurrentAsProgram;
window.activateSavedProgram = activateSavedProgram;
window.previewSavedProgram = previewSavedProgram;
window.duplicateSavedProgram = duplicateSavedProgram;
window.deleteSavedProgram = deleteSavedProgram;
window.swapProgramInWorkout = swapProgramInWorkout;
window.ensureProgramsLibrary = ensureProgramsLibrary;
