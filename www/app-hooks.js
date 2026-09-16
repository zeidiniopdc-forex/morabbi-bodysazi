// ========== APP HOOKS v2.3 (load AFTER app.js) ==========
(function () {
  function upgradeProgress() {
    try {
      if (typeof currentView === "undefined" || currentView !== "progress") return;
      const main = document.getElementById("main-content");
      if (!main || typeof renderProgressEnhanced !== "function") return;
      if (document.getElementById("chart-weight") || document.getElementById("photo-pose")) {
        if (typeof afterProgressRender === "function") requestAnimationFrame(() => afterProgressRender());
        return;
      }
      main.innerHTML = renderProgressEnhanced();
      if (typeof bindViewEvents === "function") bindViewEvents();
      if (typeof afterProgressRender === "function") requestAnimationFrame(() => afterProgressRender());
    } catch (e) { console.warn("upgradeProgress", e); }
  }

  function upgradeReports() {
    try {
      if (typeof currentView === "undefined" || currentView !== "reports") return;
      const main = document.getElementById("main-content");
      if (!main || typeof renderReportsEnhanced !== "function") return;
      if (main.querySelector("[onclick*='shareReport']")) return;
      main.innerHTML = renderReportsEnhanced();
      if (typeof bindViewEvents === "function") bindViewEvents();
    } catch (e) { console.warn("upgradeReports", e); }
  }

  function injectUnitsSelector() {
    if (document.getElementById("set-units")) return;
    if (typeof currentView === "undefined" || currentView !== "settings") return;
    const soundEl = document.getElementById("set-sound-rest");
    if (!soundEl) return;
    const card = soundEl.closest(".card");
    if (!card || !card.parentNode) return;
    const units = (typeof state !== "undefined" && state.settings && state.settings.units) || "kg";
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML =
      '<div class="card-title">واحد وزن</div>' +
      '<select class="form-select" id="set-units">' +
      '<option value="kg"' + (units === "kg" ? " selected" : "") + '>کیلوگرم (kg)</option>' +
      '<option value="lb"' + (units === "lb" ? " selected" : "") + '>پوند (lb)</option>' +
      "</select>";
    card.parentNode.insertBefore(div, card);
  }

  function persistUnits() {
    const sel = document.getElementById("set-units");
    if (!sel || typeof state === "undefined") return;
    state.settings.units = sel.value === "lb" ? "lb" : "kg";
    if (typeof saveState === "function") saveState(state);
  }

  function upgradeDashboardWeight() {
    try {
      if (typeof currentView === "undefined" || currentView !== "dashboard") return;
      if (typeof kgToDisplay !== "function") return;
      const chips = document.querySelectorAll(".stat-chip .sc-val");
      if (!chips.length) return;
      // first chip is weight in dashboard
    } catch (e) {}
  }

  function runUpgrades() {
    upgradeProgress();
    upgradeReports();
    injectUnitsSelector();
  }

  window.enableNotifications = function () {
    if (typeof scheduleLocalReminders === "function") scheduleLocalReminders();
  };

  document.addEventListener(
    "click",
    function (e) {
      const t = e.target.closest("[onclick], .nav-item, .menu-item, .quick-tile, button");
      if (!t) return;
      const oc = t.getAttribute("onclick") || "";
      if (oc.includes("saveSettings")) {
        setTimeout(persistUnits, 120);
      }
      setTimeout(runUpgrades, 60);
    },
    true
  );

  const main = document.getElementById("main-content");
  if (main && typeof MutationObserver !== "undefined") {
    const obs = new MutationObserver(function () {
      runUpgrades();
    });
    obs.observe(main, { childList: true });
  }

  if (typeof initOfflineWatch === "function") initOfflineWatch();
  setTimeout(runUpgrades, 150);
  console.log("[FitAI] high-value features hooks v2.3 active");
})();
