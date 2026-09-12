function renderCoachPrompt() {
  const prompt = buildAiPrompt();
  return `
    <div class="card">
      <div class="card-title">۲) پرامپت آماده برای هوش مصنوعی</div>
      <p style="font-size:0.9rem;margin-bottom:10px;line-height:1.6">
        این متن را کپی کنید و در ChatGPT / Claude / Gemini / هر AI دیگری بچسبانید.
        خروجی باید <strong>فقط JSON</strong> باشد.
      </p>
      <textarea class="form-input" id="ai-prompt-box" rows="16" style="font-size:0.75rem;line-height:1.45">${prompt.replace(/</g,"&lt;")}</textarea>
      <button class="btn btn-primary btn-lg btn-block mt-2" onclick="copyAiPrompt()">کپی پرامپت</button>
      <button class="btn btn-secondary btn-block mt-1" onclick="navigate('coach')">ویرایش مشخصات</button>
      <button class="btn btn-success btn-block mt-1" onclick="navigate('coach-import')">خروجی AI را گرفتم → وارد کردن</button>
    </div>
    <div class="card">
      <div class="card-title">راهنما</div>
      <p style="font-size:0.85rem;line-height:1.7">
        ۱. کپی پرامپت<br>
        ۲. در AI بفرستید<br>
        ۳. کل JSON پاسخ را کپی کنید<br>
        ۴. در صفحه بعد بچسبانید و تأیید کنید<br>
        برنامه جلسات + روشن/خاموش و دوز مکمل‌ها خودکار اعمال می‌شود.
      </p>
    </div>
  `;
}

function copyAiPrompt() {
  const el = document.getElementById("ai-prompt-box");
  const str = el ? el.value : buildAiPrompt();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(str).then(() => toast("پرامپت کپی شد", "success"))
      .catch(() => { el?.select(); document.execCommand("copy"); toast("پرامپت کپی شد", "success"); });
  } else {
    el?.select();
    document.execCommand("copy");
    toast("پرامپت کپی شد", "success");
  }
}
