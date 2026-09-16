// ========== APP HOOKS UX v4 ==========
(function () {
  function upgradeProgress() {
    try {
      if (typeof currentView === "undefined" || currentView !== "progress") return;
      const main = document.getElementById("main-content");
      if (!main || typeof renderProgressEnhanced !== "function") return;
      if (document.getElementById("chart-weight") || document.getElementById("photo-pose")) {
        if (typeof afterProgressRender === "function") requestAnimationFrame(function () { afterProgressRender(); });
        return;
      }
      main.innerHTML = renderProgressEnhanced();
      if (typeof bindViewEvents === "function") bindViewEvents();
      if (typeof afterProgressRender === "function") requestAnimationFrame(function () { afterProgressRender(); });
    } catch (e) { console.warn("upgradeProgress", e); }
  }

  function stickyWorkoutChrome() {
    try {
      if (typeof currentView === "undefined" || currentView !== "active-workout") return;
      const main = document.getElementById("main-content");
      if (!main) return;
      var sticky = main.querySelector(".workout-sticky");
      var header = main.querySelector(".workout-header");
      var rest = main.querySelector("#rest-timer-box");
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
          var el = document.getElementById("rest-time");
          if (el && typeof formatTime === "function") el.textContent = formatTime(restSecondsLeft);
        }
      }
      if (!document.getElementById("ux-swap-program") && sticky) {
        var b = document.createElement("button");
        b.id = "ux-swap-program";
        b.type = "button";
        b.className = "btn btn-secondary btn-sm ux-swap-btn";
        b.textContent = "جایگزینی برنامه امروز";
        b.onclick = function () { if (typeof swapProgramInWorkout === "function") swapProgramInWorkout(); };
        sticky.appendChild(b);
      }
    } catch (e) { console.warn("stickyWorkoutChrome", e); }
  }

  function upgradeHome() {
    try {
      if (typeof currentView === "undefined" || currentView !== "dashboard") return;
      if (typeof renderHomeDashboardV4 !== "function") return;
      var main = document.getElementById("main-content");
      if (!main) return;
      if (main.querySelector(".ux-week")) return;
      main.innerHTML = renderHomeDashboardV4();
    } catch (e) { console.warn("upgradeHome", e); }
  }

  function upgradeProgramsView() {
    try {
      if (typeof currentView === "undefined") return;
      var main = document.getElementById("main-content");
      if (!main) return;
      if (currentView === "programs" && typeof renderProgramsPage === "function") {
        if (!main.querySelector(".ux-prog") && !main.querySelector(".ux-page-title")) {
          main.innerHTML = renderProgramsPage();
        }
      }
      if (currentView === "mealplan" && typeof renderMealPlanPage === "function") {
        if (!main.querySelector("#diet-goal")) main.innerHTML = renderMealPlanPage();
      }
      if (currentView === "nutrition" && typeof renderNutritionEnhanced === "function") {
        if (!main.querySelector("#nutrition-dashboard")) main.innerHTML = renderNutritionEnhanced();
      }
    } catch (e) { console.warn("upgradeProgramsView", e); }
  }

  function injectProfilesUI() {
    try {
      if (typeof renderProfilesPanel !== "function") return;
      if (typeof currentView === "undefined") return;
      if (currentView !== "settings" && currentView !== "more") return;
      var mainEl = document.getElementById("main-content");
      if (!mainEl || document.getElementById("profiles-panel")) return;
      var html = renderProfilesPanel();
      if (currentView === "settings") mainEl.insertAdjacentHTML("afterbegin", html);
      else {
        var first = mainEl.querySelector(".card, .menu-list, .creator-card");
        if (first) first.insertAdjacentHTML("beforebegin", html);
        else mainEl.insertAdjacentHTML("afterbegin", html);
      }
    } catch (e) {}
  }

  function enhanceMoreMenu() {
    try {
      if (typeof currentView === "undefined" || currentView !== "more") return;
      var main = document.getElementById("main-content");
      if (!main || document.getElementById("ux-more-extra")) return;
      var box = document.createElement("div");
      box.id = "ux-more-extra";
      box.className = "menu-list";
      box.innerHTML = '<button type="button" class="menu-item" onclick="navigate(\'programs\')"><span class="mi-icon">📋</span><span class="mi-text"><strong>برنامه‌های من</strong><small>مدیریت و تعویض برنامه</small></span><span class="mi-chev">‹</span></button>' +
        '<button type="button" class="menu-item" onclick="navigate(\'mealplan\')"><span class="mi-icon">🥗</span><span class="mi-text"><strong>برنامه غذایی</strong><small>هدف کالری و وعده‌ها</small></span><span class="mi-chev">‹</span></button>';
      var list = main.querySelector(".menu-list");
      if (list) list.parentNode.insertBefore(box, list);
      else main.insertAdjacentElement("afterbegin", box);
    } catch (e) {}
  }

  function patchNavigate() {
    if (window.__uxNavPatched) return;
    if (typeof navigate !== "function") return;
    var orig = navigate;
    window.navigate = function (view) {
      if (view === "programs" || view === "mealplan") {
        currentView = view;
        try {
          document.body.classList.toggle("workout-mode", false);
          var titles = { programs: "برنامه‌های من", mealplan: "برنامه غذایی" };
          var t = document.getElementById("page-title");
          if (t) t.textContent = titles[view] || view;
          if (typeof $$ === "function") $$(".nav-item").forEach(function (b) { b.classList.toggle("active", false); });
        } catch (e) {}
        var main = document.getElementById("main-content");
        if (main) {
          if (view === "programs" && typeof renderProgramsPage === "function") main.innerHTML = renderProgramsPage();
          if (view === "mealplan" && typeof renderMealPlanPage === "function") main.innerHTML = renderMealPlanPage();
        }
        return;
      }
      return orig(view);
    };
    window.__uxNavPatched = true;
  }

  function runUpgrades() {
    patchNavigate();
    upgradeHome();
    stickyWorkoutChrome();
    upgradeProgress();
    upgradeProgramsView();
    injectProfilesUI();
    enhanceMoreMenu();
  }

  document.addEventListener("click", function () { setTimeout(runUpgrades, 40); }, true);
  var main = document.getElementById("main-content");
  if (main && typeof MutationObserver !== "undefined") {
    new MutationObserver(function () { runUpgrades(); }).observe(main, { childList: true });
  }
  if (typeof initOfflineWatch === "function") initOfflineWatch();
  if (typeof ensureProgramsLibrary === "function") {
    try { ensureProgramsLibrary(); } catch (e) {}
  }
  setTimeout(runUpgrades, 100);
  console.log("[FitAI] UX v4 hooks active");
})();
