// ========== Multi-profile UI ==========
function renderProfilesPanel() {
  const list = typeof listProfiles === "function" ? listProfiles() : [];
  return `
    <div class="card" id="profiles-panel">
      <div class="card-title">پروفایل‌ها و برنامه‌ها</div>
      <p class="text-muted" style="font-size:0.82rem;margin-bottom:12px;line-height:1.55">
        هر پروفایل برنامه تمرینی، مکمل‌ها، تاریخچه و اندازه‌های جداگانه دارد.
      </p>
      <div class="profile-list">
        ${list.map(p => `
          <div class="profile-row ${p.active ? "active" : ""}">
            <div class="profile-info" onclick="doSwitchProfile('${p.id}')">
              <div class="profile-avatar">${(p.name || "؟").slice(0, 1)}</div>
              <div class="profile-text">
                <strong>${p.name || p.label}${p.active ? " · فعال" : ""}</strong>
                <small>${p.programName || "برنامه پیش‌فرض"} · ${p.sessions || 0} جلسه</small>
              </div>
            </div>
            <div class="profile-actions">
              ${!p.active ? `<button type="button" class="btn btn-sm btn-primary" onclick="doSwitchProfile('${p.id}')">انتخاب</button>` : ""}
              <button type="button" class="btn btn-sm btn-secondary" onclick="doRenameProfile('${p.id}','${(p.name || "").replace(/'/g, "")}')">نام</button>
              <button type="button" class="btn btn-sm btn-secondary" onclick="doDuplicateProfile('${p.id}')">کپی</button>
              ${list.length > 1 ? `<button type="button" class="btn btn-sm btn-danger" onclick="doDeleteProfile('${p.id}')">حذف</button>` : ""}
            </div>
          </div>
        `).join("")}
      </div>
      <button type="button" class="btn btn-primary btn-block mt-2" onclick="doCreateProfile()">＋ پروفایل جدید</button>
      <label class="chip-check mt-1" style="margin-top:10px">
        <input type="checkbox" id="copy-program-on-create" />
        <span>کپی برنامه پروفایل فعلی روی پروفایل جدید</span>
      </label>
    </div>
  `;
}

function doSwitchProfile(id) {
  if (typeof switchProfile !== "function") return;
  if (state && state.activeWorkout) {
    if (!confirm("جلسه فعال در این پروفایل ذخیره می‌شود و به پروفایل دیگر می‌روید. ادامه؟")) return;
  }
  const r = switchProfile(id);
  if (!r.ok) {
    toast(r.error || "خطا", "warning");
    return;
  }
  state = loadState();
  if (typeof applyTheme === "function") applyTheme(state.settings.theme);
  toast("پروفایل عوض شد: " + (state.profile.name || ""), "success");
  if (typeof navigate === "function") navigate("dashboard");
  else if (typeof render === "function") render();
}

function doCreateProfile() {
  const name = prompt("نام پروفایل جدید:", "ورزشکار جدید");
  if (name == null) return;
  const copy = !!document.getElementById("copy-program-on-create")?.checked;
  const r = createProfile({ name: name.trim() || "ورزشکار جدید", copyProgram: copy, switchTo: true });
  if (!r.ok) {
    toast(r.error || "خطا", "warning");
    return;
  }
  state = loadState();
  toast("پروفایل ساخته شد", "success");
  if (typeof navigate === "function") navigate("settings");
  else if (typeof render === "function") render();
}

function doRenameProfile(id, current) {
  const name = prompt("نام جدید پروفایل:", current || "");
  if (name == null) return;
  const r = renameProfile(id, name);
  if (!r.ok) {
    toast(r.error || "خطا", "warning");
    return;
  }
  state = loadState();
  toast("نام به‌روز شد", "success");
  if (typeof render === "function") render();
}

function doDeleteProfile(id) {
  if (!confirm("این پروفایل و تمام داده‌هایش حذف شود؟")) return;
  const r = deleteProfile(id);
  if (!r.ok) {
    toast(r.error || "خطا", "warning");
    return;
  }
  state = loadState();
  toast("پروفایل حذف شد", "success");
  if (typeof applyTheme === "function") applyTheme(state.settings.theme);
  if (typeof navigate === "function") navigate("dashboard");
  else if (typeof render === "function") render();
}

function doDuplicateProfile(id) {
  const r = duplicateProfile(id);
  if (!r.ok) {
    toast(r.error || "خطا", "warning");
    return;
  }
  state = loadState();
  toast("کپی پروفایل ساخته شد", "success");
  if (typeof render === "function") render();
}

window.renderProfilesPanel = renderProfilesPanel;
window.doSwitchProfile = doSwitchProfile;
window.doCreateProfile = doCreateProfile;
window.doRenameProfile = doRenameProfile;
window.doDeleteProfile = doDeleteProfile;
window.doDuplicateProfile = doDuplicateProfile;
