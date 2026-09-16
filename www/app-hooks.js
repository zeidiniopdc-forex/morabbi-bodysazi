// ========== APP HOOKS v2.4 (load AFTER app.js) ==========
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

  function stickyWorkoutChrome() {
    try {
      if (typeof currentView === "undefined" || currentView !== "active-workout") return;
      const main = document.getElementById("main-content");
      if (!main) return;
      let sticky = main.querySelector(".workout-sticky");
      const header = main.querySelector(".workout-header");
      const rest = main.querySelector("#rest-timer-box");
      if (!header) return;
      if (!sticky) {
        sticky = document.createElement("div");
        sticky.className = "workout-sticky";
        header.parentNode.insertBefore(sticky, header);
        sticky.appendChild(header);
        if (rest) sticky.appendChild(rest);
      } else {
        if (header.parentNode !== sticky) sticky.appendChild(header);
        if (rest && rest.parentNode !== sticky) sticky.appendChild(rest);
      }
      if (typeof restSecondsLeft !== "undefined" && restSecondsLeft > 0) {
        sticky.classList.add("is-resting");
        if (rest) {
          rest.classList.remove("hidden");
          const el = document.getElementById("rest-time");
          if (el && typeof formatTime === "function") el.textContent = formatTime(restSecondsLeft);
        }
      } else {
        sticky.classList.remove("is-resting");
      }
    } catch (e) {
      console.warn("stickyWorkoutChrome", e);
    }
  }

  function upgradeNutrition() {
    try {
      if (typeof renderNutritionEnhanced !== "function") return;
      const main = document.getElementById("main-content");
      if (!main) return;
      if (typeof currentView !== "undefined" && currentView === "nutrition") {
        if (!main.querySelector("#nutrition-dashboard") || !main.querySelector(".nut-quick-grid")) {
          main.innerHTML = renderNutritionEnhanced();
        }
      }
      if (typeof currentView !== "undefined" && currentView === "dashboard") {
        if (document.getElementById("nutrition-dashboard")) return;
        const html = renderNutritionDashboardBlock();
        const creator = main.querySelector(".creator-card");
        if (creator) creator.insertAdjacentHTML("beforebegin", html);
        else main.insertAdjacentHTML("beforeend", html);
      }
    } catch (e) {
      console.warn("upgradeNutrition", e);
    }
  }

  function injectProfilesUI() {
    try {
      if (typeof renderProfilesPanel !== "function") return;
      if (typeof currentView === "undefined") return;
      if (currentView !== "settings" && currentView !== "more") return;
      const mainEl = document.getElementById("main-content");
      if (!mainEl) return;
      if (document.getElementById("profiles-panel")) return;
      const html = renderProfilesPanel();
      if (currentView === "settings") {
        mainEl.insertAdjacentHTML("afterbegin", html);
      } else {
        const first = mainEl.querySelector(".card, .menu-list, .creator-card");
        if (first) first.insertAdjacentHTML("beforebegin", html);
        else mainEl.insertAdjacentHTML("afterbegin", html);
      }
    } catch (e) {
      console.warn("injectProfilesUI", e);
    }
  }

  function runUpgrades() {
    upgradeProgress();
    upgradeReports();
    injectUnitsSelector();
    stickyWorkoutChrome();
    upgradeNutrition();
    injectProfilesUI();
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
      setTimeout(runUpgrades, 50);
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
  setTimeout(runUpgrades, 120);
  console.log("[FitAI] hooks v2.4 — sticky workout + nutrition + profiles");
})();
