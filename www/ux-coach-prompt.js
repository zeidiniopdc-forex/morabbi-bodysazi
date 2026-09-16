// ========== UX v4 — Enhanced AI program prompt ==========
(function () {
  const orig = typeof buildAiPrompt === "function" ? buildAiPrompt : null;
  window.buildAiPrompt = function () {
    let base = orig ? orig() : "";
    const pr = state.profile || {};
    const hist = (state.workoutHistory || []).filter(w => w.completed).slice(-8);
    const histLines = hist.length
      ? hist.map(w => "- " + (w.date || "?") + " session=" + w.sessionId).join("\n")
      : "هنوز تاریخچه کافی نیست.";
    const banned = [];
    const lims = pr.limitations || [];
    if (lims.includes("l4l5")) banned.push("اسکوات هالتر سنگین", "ددلیفت مرسوم", "RDL سنگین", "Good Morning", "Bent-over Row سنگین", "کرانچ با بار زیاد");
    if (lims.includes("knee")) banned.push("اسکوات عمیق سنگین", "لانج سنگین دردناک");
    if (lims.includes("shoulder")) banned.push("پرس پشت گردن", "پلاور سنگین پشت سر");
    const extra = "\n\n════════════════════════════════════\nالزامات سخت‌گیرانه شخصی‌سازی (UX v4)\n════════════════════════════════════\n" +
      "- حرکات ناسازگار با محدودیت‌ها را فقط هشدار نده؛ حذف کن و جایگزین ایمن بگذار.\n" +
      "- حذف اجباری در صورت محدودیت: " + (banned.join("، ") || "—") + "\n" +
      "- برای هر حرکت: name, muscle, sets, reps, rest, rir, note, tempo?, alternate, shortOnTime\n" +
      "- سابقه اخیر:\n" + histLines + "\n" +
      "- سطح: سابقه " + (pr.experienceYears || "?") + " سال · سبک " + (pr.trainStyle || "hypertrophy") + "\n" +
      "- خروجی فقط JSON معتبر با sessions[].exercises[] کامل برای UI.\n";
    return base + extra;
  };
})();
