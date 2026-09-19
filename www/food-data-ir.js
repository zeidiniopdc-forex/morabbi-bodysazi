// ========== Iranian Food Database - Comprehensive ==========
// ارزش غذایی به ازای هر ۱۰۰ گرم (مگر اینکه ذکر شده باشد)
const IR_FOOD_DB = {
  // ===== غلات و نان =====
  "برنج سفید پخته": { unit: "g", per100: { kcal: 130, p: 2.7, c: 28, f: 0.3, fiber: 0.4 }, aliases: ["برنج", "چلو", "پلو", "برنج ایرانی", "برنج آبکش"] },
  "برنج قهوه‌ای": { unit: "g", per100: { kcal: 112, p: 2.6, c: 24, f: 0.9, fiber: 1.8 }, aliases: ["برنج سبوس‌دار"] },
  "نان سنگک": { unit: "g", per100: { kcal: 270, p: 9, c: 56, f: 1.2, fiber: 6 }, aliases: ["سنگک"], pieceG: 80 },
  "نان بربری": { unit: "g", per100: { kcal: 265, p: 8.5, c: 54, f: 1.5, fiber: 4 }, aliases: ["بربری"], pieceG: 100 },
  "نان لواش": { unit: "g", per100: { kcal: 275, p: 8, c: 58, f: 1, fiber: 2.5 }, aliases: ["لواش"], pieceG: 30 },
  "نان تافتون": { unit: "g", per100: { kcal: 270, p: 8, c: 55, f: 1.2, fiber: 3 }, aliases: ["تافتون"], pieceG: 50 },
  "نان باگت": { unit: "g", per100: { kcal: 290, p: 9, c: 58, f: 2, fiber: 2.5 }, aliases: ["باگت"], pieceG: 50 },
  "ماکارونی پخته": { unit: "g", per100: { kcal: 131, p: 5, c: 25, f: 1.1, fiber: 1.2 }, aliases: ["پاستا", "اسپاگتی", "ماکارونی"] },
  "جو پرک": { unit: "g", per100: { kcal: 350, p: 12, c: 67, f: 6, fiber: 10 }, aliases: ["جو دوسر", "اوتمیل"] },
  "بلغور گندم": { unit: "g", per100: { kcal: 120, p: 3.5, c: 24, f: 0.6, fiber: 3.5 }, aliases: ["بلغور"] },
  
  // ===== گوشت و پروتئین =====
  "سینه مرغ": { unit: "g", per100: { kcal: 165, p: 31, c: 0, f: 3.6, fiber: 0 }, aliases: ["مرغ", "جوجه", "گوشت مرغ", "سینه گریل شده"] },
  "ران مرغ": { unit: "g", per100: { kcal: 209, p: 26, c: 0, f: 11, fiber: 0 }, aliases: ["ران"] },
  "بال مرغ": { unit: "g", per100: { kcal: 290, p: 27, c: 0, f: 19, fiber: 0 }, aliases: ["بال"] },
  "گوشت گوساله بدون چربی": { unit: "g", per100: { kcal: 140, p: 26, c: 0, f: 3, fiber: 0 }, aliases: ["گوشت گوساله", "گوشت قرمز", "گوشت خورشتی", "راسته"] },
  "گوشت گوسفندی": { unit: "g", per100: { kcal: 240, p: 25, c: 0, f: 16, fiber: 0 }, aliases: ["گوسفند", "گوشت گوسفند"] },
  "قلوه‌گاه گوسفندی": { unit: "g", per100: { kcal: 320, p: 18, c: 0, f: 27, fiber: 0 }, aliases: ["قلوه‌گاه"] },
  "جگر گوساله": { unit: "g", per100: { kcal: 140, p: 26, c: 4, f: 3, fiber: 0 }, aliases: ["جگر", "جگر سفید"] },
  "دل گوساله": { unit: "g", per100: { kcal: 110, p: 17, c: 4, f: 3, fiber: 0 }, aliases: ["دل"] },
  "زبان گوساله": { unit: "g", per100: { kcal: 220, p: 17, c: 1, f: 16, fiber: 0 }, aliases: ["زبان"] },
  "ماهی قزل‌آلا": { unit: "g", per100: { kcal: 160, p: 22, c: 0, f: 7, fiber: 0 }, aliases: ["قزل‌آلا", "ماهی سالمون"] },
  "ماهی سفید": { unit: "g", per100: { kcal: 100, p: 20, c: 0, f: 2, fiber: 0 }, aliases: ["ماهی", "ماهی جنوب"] },
  "میگو": { unit: "g", per100: { kcal: 100, p: 24, c: 0.2, f: 0.3, fiber: 0 }, aliases: [] },
  "تن ماهی": { unit: "g", per100: { kcal: 190, p: 26, c: 0, f: 9, fiber: 0 }, aliases: ["کنسرو تن"] },
  "سوسیس گوساله": { unit: "g", per100: { kcal: 260, p: 14, c: 3, f: 21, fiber: 0 }, aliases: ["سوسیس"] },
  "کالباس": { unit: "g", per100: { kcal: 240, p: 16, c: 4, f: 17, fiber: 0 }, aliases: ["کالباس ژامبون"] },
  "همبرگر": { unit: "g", per100: { kcal: 250, p: 17, c: 2, f: 19, fiber: 0 }, aliases: ["برگر"] },
  
  // ===== لبنیات =====
  "شیر کم‌چرب": { unit: "ml", per100: { kcal: 50, p: 3.4, c: 5, f: 1.5, fiber: 0 }, aliases: ["شیر"] },
  "شیر پرچرب": { unit: "ml", per100: { kcal: 65, p: 3.2, c: 4.8, f: 3.5, fiber: 0 }, aliases: ["شیر محلی"] },
  "شیر شکلات": { unit: "ml", per100: { kcal: 85, p: 3, c: 12, f: 2.5, fiber: 0 }, aliases: ["شیر کاکائو"] },
  "ماست کم‌چرب": { unit: "g", per100: { kcal: 50, p: 3.5, c: 4.7, f: 1.5, fiber: 0 }, aliases: ["ماست"] },
  "ماست پرچرب": { unit: "g", per100: { kcal: 70, p: 3.2, c: 4.5, f: 4, fiber: 0 }, aliases: ["ماست سنتی"] },
  "ماست چکیده": { unit: "g", per100: { kcal: 90, p: 5, c: 4, f: 6, fiber: 0 }, aliases: ["چکیده"] },
  "ماست یونانی": { unit: "g", per100: { kcal: 60, p: 10, c: 3.5, f: 0.5, fiber: 0 }, aliases: ["ماست ایسلندی"] },
  "دوغ": { unit: "ml", per100: { kcal: 35, p: 1.5, c: 3, f: 1.5, fiber: 0 }, aliases: ["دوغ گازدار"] },
  "پنیر سفید صبحانه": { unit: "g", per100: { kcal: 260, p: 18, c: 1.5, f: 20, fiber: 0 }, aliases: ["پنیر", "پنیر لیقوان", "پنیر فتا"] },
  "پنیر خامه‌ای": { unit: "g", per100: { kcal: 340, p: 6, c: 4, f: 34, fiber: 0 }, aliases: ["خامه پنیر"] },
  "پنیر موزارلا": { unit: "g", per100: { kcal: 280, p: 22, c: 2, f: 21, fiber: 0 }, aliases: ["موزارلا"] },
  "پنیر چدار": { unit: "g", per100: { kcal: 400, p: 25, c: 1.5, f: 33, fiber: 0 }, aliases: ["چدار", "پنیر زرد"] },
  "پنیر پارمزان": { unit: "g", per100: { kcal: 430, p: 38, c: 4, f: 29, fiber: 0 }, aliases: ["پارمزان"] },
  "کره": { unit: "g", per100: { kcal: 717, p: 0.9, c: 0.1, f: 81, fiber: 0 }, aliases: ["کره حیوانی"] },
  "خامه": { unit: "g", per100: { kcal: 340, p: 2, c: 3, f: 36, fiber: 0 }, aliases: ["خامه صبحانه"] },
  "بستنی وانیلی": { unit: "g", per100: { kcal: 210, p: 3.5, c: 24, f: 11, fiber: 0 }, aliases: ["بستنی"] },
  "کشک": { unit: "g", per100: { kcal: 85, p: 12, c: 6, f: 1.5, fiber: 0 }, aliases: ["کشک پاستوریزه"] },
  
  // ===== حبوبات =====
  "لوبیا چیتی پخته": { unit: "g", per100: { kcal: 140, p: 9, c: 25, f: 0.5, fiber: 7 }, aliases: ["لوبیا چیتی", "لوبیا"] },
  "لوبیا قرمز پخته": { unit: "g", per100: { kcal: 127, p: 8.7, c: 23, f: 0.5, fiber: 6.5 }, aliases: ["لوبیا قرمز"] },
  "عدس پخته": { unit: "g", per100: { kcal: 116, p: 9, c: 20, f: 0.4, fiber: 8 }, aliases: ["عدس"] },
  "نخود پخته": { unit: "g", per100: { kcal: 164, p: 9, c: 27, f: 2.6, fiber: 8 }, aliases: ["نخود"] },
  "لپه پخته": { unit: "g", per100: { kcal: 118, p: 8, c: 20, f: 0.5, fiber: 5 }, aliases: ["لپه"] },
  "سویا دانه": { unit: "g", per100: { kcal: 450, p: 36, c: 30, f: 20, fiber: 9 }, aliases: ["سویا"] },
  "توفو": { unit: "g", per100: { kcal: 76, p: 8, c: 1.9, f: 4.8, fiber: 0.3 }, aliases: ["پنیر سویا"] },
  
  // ===== سبزیجات =====
  "سیب‌زمینی آبپز": { unit: "g", per100: { kcal: 87, p: 1.9, c: 20, f: 0.1, fiber: 1.8 }, aliases: ["سیب زمینی", "سیب‌زمینی"] },
  "سیب‌زمینی سرخ‌کرده": { unit: "g", per100: { kcal: 312, p: 3.5, c: 41, f: 15, fiber: 3 }, aliases: ["سیب زمینی سرخ کرده", "فرنچ فرایز"] },
  "بادمجان کبابی": { unit: "g", per100: { kcal: 35, p: 1, c: 6, f: 0.5, fiber: 3 }, aliases: ["بادمجان", "بادمجان کبابی"] },
  "گوجه‌فرنگی": { unit: "g", per100: { kcal: 18, p: 0.9, c: 3.9, f: 0.2, fiber: 1.2 }, aliases: ["گوجه", "گوجه"] },
  "خیار": { unit: "g", per100: { kcal: 15, p: 0.7, c: 3.6, f: 0.1, fiber: 0.5 }, aliases: [] },
  "کاهو": { unit: "g", per100: { kcal: 15, p: 1.4, c: 2.9, f: 0.2, fiber: 1.3 }, aliases: [] },
  "اسفناج": { unit: "g", per100: { kcal: 23, p: 2.9, c: 3.6, f: 0.4, fiber: 2.2 }, aliases: ["اسفناج پخته"] },
  "بروکلی": { unit: "g", per100: { kcal: 34, p: 2.8, c: 7, f: 0.4, fiber: 2.6 }, aliases: ["کلم بروکلی"] },
  "گل‌کلم": { unit: "g", per100: { kcal: 25, p: 2, c: 5, f: 0.3, fiber: 2 }, aliases: ["کلم گل"] },
  "کلم پیچ": { unit: "g", per100: { kcal: 49, p: 4.3, c: 9, f: 0.9, fiber: 3.6 }, aliases: ["کلم"] },
  "هویج": { unit: "g", per100: { kcal: 41, p: 0.9, c: 10, f: 0.2, fiber: 2.8 }, aliases: [] },
  "پیاز": { unit: "g", per100: { kcal: 40, p: 1.1, c: 9, f: 0.1, fiber: 1.7 }, aliases: ["پیاز خام"] },
  "سیر": { unit: "g", per100: { kcal: 149, p: 6.4, c: 33, f: 0.5, fiber: 2.1 }, aliases: [] },
  "قارچ": { unit: "g", per100: { kcal: 22, p: 3.1, c: 3.3, f: 0.3, fiber: 1 }, aliases: ["قارچ دکمه‌ای"] },
  "فلفل دلمه‌ای": { unit: "g", per100: { kcal: 31, p: 1, c: 6, f: 0.3, fiber: 2.1 }, aliases: ["فلفل"] },
  "کدو سبز": { unit: "g", per100: { kcal: 17, p: 1.2, c: 3.1, f: 0.3, fiber: 1 }, aliases: ["کدو"] },
  "بامیه": { unit: "g", per100: { kcal: 33, p: 1.9, c: 7, f: 0.2, fiber: 3.2 }, aliases: [] },
  "شلغم": { unit: "g", per100: { kcal: 28, p: 0.9, c: 6, f: 0.1, fiber: 1.8 }, aliases: [] },
  "چغندر": { unit: "g", per100: { kcal: 43, p: 1.6, c: 10, f: 0.2, fiber: 2.8 }, aliases: ["لبو"] },
  "سبزی خوردن": { unit: "g", per100: { kcal: 25, p: 2, c: 4, f: 0.3, fiber: 2.5 }, aliases: ["سبزی"] },
  "سبزی قورمه": { unit: "g", per100: { kcal: 35, p: 2.5, c: 5, f: 0.5, fiber: 3 }, aliases: ["سبزی خورشتی"] },
  "سالاد شیرازی": { unit: "g", per100: { kcal: 25, p: 0.8, c: 4, f: 0.5, fiber: 1.2 }, aliases: ["سالاد"] },
  
  // ===== میوه‌ها =====
  "سیب": { unit: "g", per100: { kcal: 52, p: 0.3, c: 14, f: 0.2, fiber: 2.4 }, aliases: [] },
  "موز": { unit: "g", per100: { kcal: 89, p: 1.1, c: 23, f: 0.3, fiber: 2.6 }, aliases: [] },
  "پرتقال": { unit: "g", per100: { kcal: 47, p: 0.9, c: 12, f: 0.1, fiber: 2.4 }, aliases: [] },
  "لیمو شیرین": { unit: "g", per100: { kcal: 43, p: 0.8, c: 11, f: 0.2, fiber: 1.8 }, aliases: [] },
  "انگور": { unit: "g", per100: { kcal: 67, p: 0.7, c: 17, f: 0.4, fiber: 0.9 }, aliases: [] },
  "انار": { unit: "g", per100: { kcal: 83, p: 1.7, c: 19, f: 1.2, fiber: 4 }, aliases: [] },
  "هندوانه": { unit: "g", per100: { kcal: 30, p: 0.6, c: 8, f: 0.2, fiber: 0.4 }, aliases: [] },
  "خربزه": { unit: "g", per100: { kcal: 34, p: 0.8, c: 8, f: 0.2, fiber: 0.9 }, aliases: ["طالبی"] },
  "کیوی": { unit: "g", per100: { kcal: 61, p: 1.1, c: 15, f: 0.6, fiber: 3 }, aliases: [] },
  "توت فرنگی": { unit: "g", per100: { kcal: 32, p: 0.7, c: 8, f: 0.3, fiber: 2 }, aliases: ["توت"] },
  "گیلاس": { unit: "g", per100: { kcal: 50, p: 1, c: 12, f: 0.3, fiber: 1.6 }, aliases: [] },
  "آلبالو": { unit: "g", per100: { kcal: 50, p: 1, c: 12, f: 0.3, fiber: 1.5 }, aliases: [] },
  "هلو": { unit: "g", per100: { kcal: 39, p: 0.9, c: 10, f: 0.3, fiber: 1.5 }, aliases: [] },
  "شلیل": { unit: "g", per100: { kcal: 44, p: 1, c: 11, f: 0.3, fiber: 1.7 }, aliases: [] },
  "زردآلو": { unit: "g", per100: { kcal: 48, p: 1.1, c: 11, f: 0.4, fiber: 2 }, aliases: [] },
  "انجیر تازه": { unit: "g", per100: { kcal: 74, p: 0.8, c: 19, f: 0.3, fiber: 3 }, aliases: ["انجیر"] },
  "خرمالو": { unit: "g", per100: { kcal: 70, p: 0.6, c: 18, f: 0.2, fiber: 3.6 }, aliases: [] },
  "به": { unit: "g", per100: { kcal: 57, p: 0.4, c: 15, f: 0.1, fiber: 1.9 }, aliases: [] },
  "آووکادو": { unit: "g", per100: { kcal: 160, p: 2, c: 9, f: 15, fiber: 7 }, aliases: [] },
  "انبه": { unit: "g", per100: { kcal: 60, p: 0.8, c: 15, f: 0.4, fiber: 1.6 }, aliases: [] },
  
  // ===== آجیل و دانه‌ها =====
  "گردو": { unit: "g", per100: { kcal: 654, p: 15, c: 14, f: 65, fiber: 7 }, aliases: [], pieceG: 5 },
  "بادام درختی": { unit: "g", per100: { kcal: 579, p: 21, c: 22, f: 50, fiber: 12 }, aliases: ["بادام"], pieceG: 1.2 },
  "پسته": { unit: "g", per100: { kcal: 560, p: 20, c: 27, f: 45, fiber: 10 }, aliases: [], pieceG: 0.5 },
  "فندق": { unit: "g", per100: { kcal: 628, p: 15, c: 17, f: 61, fiber: 10 }, aliases: [], pieceG: 1 },
  "بادام زمینی": { unit: "g", per100: { kcal: 567, p: 26, c: 16, f: 49, fiber: 8.5 }, aliases: [], pieceG: 1 },
  "کنجد": { unit: "g", per100: { kcal: 573, p: 18, c: 23, f: 50, fiber: 12 }, aliases: [] },
  "تخمه آفتابگردان": { unit: "g", per100: { kcal: 584, p: 21, c: 20, f: 51, fiber: 9 }, aliases: ["تخمه"] },
  "تخمه کدو": { unit: "g", per100: { kcal: 559, p: 30, c: 11, f: 49, fiber: 6 }, aliases: [] },
  "بادام هندی": { unit: "g", per100: { kcal: 553, p: 18, c: 30, f: 44, fiber: 3.3 }, aliases: ["کاجو"] },
  "تخم کتان": { unit: "g", per100: { kcal: 534, p: 18, c: 29, f: 42, fiber: 27 }, aliases: ["کتان"] },
  "دانه چیا": { unit: "g", per100: { kcal: 486, p: 17, c: 42, f: 31, fiber: 34 }, aliases: ["چیا"] },
  
  // ===== روغن‌ها و چربی‌ها =====
  "روغن مایع": { unit: "g", per100: { kcal: 884, p: 0, c: 0, f: 100, fiber: 0 }, aliases: ["روغن", "روغن آفتابگردان", "روغن ذرت"] },
  "روغن زیتون": { unit: "g", per100: { kcal: 884, p: 0, c: 0, f: 100, fiber: 0 }, aliases: ["زیتون"] },
  "روغن کنجد": { unit: "g", per100: { kcal: 884, p: 0, c: 0, f: 100, fiber: 0 }, aliases: [] },
  "روغن نارگیل": { unit: "g", per100: { kcal: 862, p: 0, c: 0, f: 100, fiber: 0 }, aliases: [] },
  "روغن حیوانی": { unit: "g", per100: { kcal: 900, p: 0, c: 0, f: 100, fiber: 0 }, aliases: ["روغن زرد", "کرمانشاهی"] },
  "پی کره": { unit: "g", per100: { kcal: 900, p: 0, c: 0, f: 100, fiber: 0 }, aliases: ["روغن دنبه"] },
  "سس مایونز": { unit: "g", per100: { kcal: 680, p: 1, c: 1, f: 75, fiber: 0 }, aliases: ["مایونز"] },
  "سس سالاد": { unit: "g", per100: { kcal: 120, p: 1, c: 8, f: 9, fiber: 0.5 }, aliases: ["سس"] },
  
  // ===== شیرینی و دسر =====
  "شکر سفید": { unit: "g", per100: { kcal: 387, p: 0, c: 100, f: 0, fiber: 0 }, aliases: ["شکر"] },
  "شکر قهوه‌ای": { unit: "g", per100: { kcal: 377, p: 0, c: 98, f: 0, fiber: 0 }, aliases: [] },
  "عسل": { unit: "g", per100: { kcal: 304, p: 0.3, c: 82, f: 0, fiber: 0.2 }, aliases: [] },
  "مربا": { unit: "g", per100: { kcal: 250, p: 0.5, c: 65, f: 0, fiber: 1 }, aliases: [] },
  "نوتلا": { unit: "g", per100: { kcal: 540, p: 6, c: 57, f: 30, fiber: 5 }, aliases: ["کرم شکلاتی"] },
  "شکلات تلخ": { unit: "g", per100: { kcal: 550, p: 8, c: 45, f: 35, fiber: 10 }, aliases: ["شکلات"] },
  "شکلات شیری": { unit: "g", per100: { kcal: 535, p: 7, c: 60, f: 30, fiber: 3 }, aliases: [] },
  "لواشک": { unit: "g", per100: { kcal: 220, p: 1, c: 55, f: 0.5, fiber: 3 }, aliases: [] },
  "پشمک": { unit: "g", per100: { kcal: 380, p: 2, c: 90, f: 1, fiber: 0 }, aliases: [] },
  "گز": { unit: "g", per100: { kcal: 400, p: 4, c: 80, f: 8, fiber: 1 }, aliases: [] },
  "سوهان": { unit: "g", per100: { kcal: 450, p: 5, c: 75, f: 15, fiber: 1 }, aliases: [] },
  "باقلوا": { unit: "g", per100: { kcal: 550, p: 6, c: 60, f: 30, fiber: 2 }, aliases: [] },
  "کیک ساده": { unit: "g", per100: { kcal: 320, p: 5, c: 50, f: 11, fiber: 1 }, aliases: ["کیک"] },
  "بیسکویت": { unit: "g", per100: { kcal: 450, p: 7, c: 65, f: 17, fiber: 2 }, aliases: ["کوکی"] },
  "وافل": { unit: "g", per100: { kcal: 350, p: 6, c: 55, f: 12, fiber: 1.5 }, aliases: [] },
  
  // ===== نوشیدنی‌ها =====
  "چای سیاه": { unit: "ml", per100: { kcal: 1, p: 0, c: 0.2, f: 0, fiber: 0 }, aliases: ["چای"] },
  "چای سبز": { unit: "ml", per100: { kcal: 1, p: 0, c: 0, f: 0, fiber: 0 }, aliases: [] },
  "قهوه اسپرسو": { unit: "ml", per100: { kcal: 2, p: 0.1, c: 0.2, f: 0, fiber: 0 }, aliases: ["اسپرسو", "قهوه"] },
  "قهوه فرانسه": { unit: "ml", per100: { kcal: 2, p: 0.2, c: 0.3, f: 0, fiber: 0 }, aliases: [] },
  "نسکافه": { unit: "ml", per100: { kcal: 50, p: 2, c: 8, f: 1.5, fiber: 0 }, aliases: ["قهوه فوری"] },
  "کاپوچینو": { unit: "ml", per100: { kcal: 60, p: 3, c: 7, f: 2.5, fiber: 0 }, aliases: [] },
  "لته": { unit: "ml", per100: { kcal: 55, p: 3, c: 6, f: 2, fiber: 0 }, aliases: [] },
  "آبمیوه طبیعی": { unit: "ml", per100: { kcal: 45, p: 0.5, c: 11, f: 0.2, fiber: 0.2 }, aliases: ["آب میوه"] },
  "نوشابه": { unit: "ml", per100: { kcal: 42, p: 0, c: 11, f: 0, fiber: 0 }, aliases: ["کوکا"] },
  "دلستر": { unit: "ml", per100: { kcal: 40, p: 0, c: 10, f: 0, fiber: 0 }, aliases: ["ماءالشعیر"] },
  "انرژی‌زا": { unit: "ml", per100: { kcal: 45, p: 0, c: 11, f: 0, fiber: 0 }, aliases: ["ردبول", "هایپ"] },
  "شیرموز": { unit: "ml", per100: { kcal: 90, p: 3.5, c: 14, f: 2, fiber: 0.5 }, aliases: [] },
  "معجون": { unit: "ml", per100: { kcal: 150, p: 5, c: 20, f: 6, fiber: 1 }, aliases: [] },
  "دمنوش": { unit: "ml", per100: { kcal: 2, p: 0, c: 0.5, f: 0, fiber: 0 }, aliases: ["چای گیاهی"] },
  
  // ===== تخم‌مرغ =====
  "تخم‌مرغ آبپز": { unit: "g", per100: { kcal: 155, p: 13, c: 1.1, f: 11, fiber: 0 }, aliases: ["تخم مرغ", "تخم‌مرغ"], pieceG: 50 },
  "تخم‌مرغ نیمرو": { unit: "g", per100: { kcal: 190, p: 12, c: 1.5, f: 15, fiber: 0 }, aliases: ["نیمرو"] },
  "تخم‌مرغ املت": { unit: "g", per100: { kcal: 150, p: 10, c: 4, f: 10, fiber: 1 }, aliases: ["املت"] },
  "سفیده تخم‌مرغ": { unit: "g", per100: { kcal: 52, p: 11, c: 0.7, f: 0.2, fiber: 0 }, aliases: ["سفیده"] },
  "زرده تخم‌مرغ": { unit: "g", per100: { kcal: 322, p: 16, c: 3.6, f: 27, fiber: 0 }, aliases: ["زرده"] },
  
  // ===== غذاهای آماده ایرانی =====
  "قورمه‌سبزی با برنج": { unit: "g", per100: { kcal: 180, p: 8, c: 25, f: 6, fiber: 3 }, aliases: ["قورمه سبزی", "خورشت قورمه"] },
  "قیمه با برنج": { unit: "g", per100: { kcal: 190, p: 9, c: 26, f: 6, fiber: 2.5 }, aliases: ["قیمه", "خورشت قیمه"] },
  "فسنجان با برنج": { unit: "g", per100: { kcal: 220, p: 7, c: 22, f: 12, fiber: 2 }, aliases: ["فسنجان", "خورشت فسنجان"] },
  "آبگوشت": { unit: "g", per100: { kcal: 150, p: 10, c: 15, f: 6, fiber: 3 }, aliases: ["دیزی", "آبگوشت سنتی"] },
  "کله‌پاچه": { unit: "g", per100: { kcal: 280, p: 18, c: 2, f: 22, fiber: 0 }, aliases: [] },
  "ترش": { unit: "g", per100: { kcal: 140, p: 8, c: 18, f: 4, fiber: 2 }, aliases: ["آب ترش", "ترش شمالی"] },
  "میرزاقاسمی": { unit: "g", per100: { kcal: 120, p: 3, c: 8, f: 9, fiber: 2 }, aliases: ["بادمجان کبابی"] },
  "کشک بادمجان": { unit: "g", per100: { kcal: 130, p: 5, c: 10, f: 8, fiber: 2.5 }, aliases: ["کشک و بادمجان"] },
  "یتیمچه": { unit: "g", per100: { kcal: 90, p: 2.5, c: 12, f: 4, fiber: 3 }, aliases: [] },
  "نرگسی اسفناج": { unit: "g", per100: { kcal: 140, p: 8, c: 5, f: 10, fiber: 2.5 }, aliases: ["نرگسی"] },
  "عدس پلو": { unit: "g", per100: { kcal: 160, p: 6, c: 28, f: 3, fiber: 3 }, aliases: ["عدس‌پلو"] },
  "لوبیا پلو": { unit: "g", per100: { kcal: 170, p: 7, c: 28, f: 4, fiber: 3.5 }, aliases: ["لوبیاپلو"] },
  "دمپختک": { unit: "g", per100: { kcal: 150, p: 4, c: 30, f: 2, fiber: 1 }, aliases: ["دمی گوجه"] },
  "استانبولی": { unit: "g", per100: { kcal: 140, p: 4, c: 28, f: 2, fiber: 2 }, aliases: ["دمی برنج"] },
  "تاس کباب": { unit: "g", per100: { kcal: 130, p: 8, c: 12, f: 6, fiber: 2 }, aliases: ["تاس"] },
  "خورشت کرفس": { unit: "g", per100: { kcal: 140, p: 7, c: 12, f: 7, fiber: 2.5 }, aliases: ["کرفس"] },
  "خورشت بامیه": { unit: "g", per100: { kcal: 120, p: 6, c: 14, f: 5, fiber: 3 }, aliases: ["بامیه"] },
  "خورشت هویج": { unit: "g", per100: { kcal: 150, p: 6, c: 18, f: 6, fiber: 2.5 }, aliases: ["هویج"] },
  "آش رشته": { unit: "g", per100: { kcal: 100, p: 4, c: 16, f: 2, fiber: 3 }, aliases: ["آش"] },
  "حلیم": { unit: "g", per100: { kcal: 120, p: 6, c: 15, f: 4, fiber: 1.5 }, aliases: [] },
  "حریره بادام": { unit: "g", per100: { kcal: 180, p: 5, c: 25, f: 7, fiber: 1 }, aliases: ["حریره"] },
  
  // ===== کباب‌ها =====
  "جوجه کباب": { unit: "g", per100: { kcal: 180, p: 28, c: 1, f: 7, fiber: 0 }, aliases: ["جوجه‌کباب", "جوجه"] },
  "کباب کوبیده": { unit: "g", per100: { kcal: 250, p: 20, c: 2, f: 18, fiber: 0 }, aliases: ["کوبیده", "کباب"] },
  "کباب برگ": { unit: "g", per100: { kcal: 220, p: 26, c: 0, f: 12, fiber: 0 }, aliases: ["برگ"] },
  "کباب سلطانی": { unit: "g", per100: { kcal: 240, p: 23, c: 1, f: 15, fiber: 0 }, aliases: ["سلطانی"] },
  "کباب چنجه": { unit: "g", per100: { kcal: 200, p: 26, c: 0, f: 10, fiber: 0 }, aliases: ["چنجه"] },
  "جگر کبابی": { unit: "g", per100: { kcal: 170, p: 25, c: 4, f: 6, fiber: 0 }, aliases: ["جگر", "جگرگاه"] },
  "دل کبابی": { unit: "g", per100: { kcal: 150, p: 22, c: 3, f: 5, fiber: 0 }, aliases: ["دل کباب"] },
  "قلیه کباب": { unit: "g", per100: { kcal: 210, p: 18, c: 5, f: 13, fiber: 1 }, aliases: ["قلیه"] },
  
  // ===== کوکو و کتلت =====
  "کتلت گوشت": { unit: "g", per100: { kcal: 220, p: 14, c: 12, f: 13, fiber: 1 }, aliases: ["کتلت"], pieceG: 70 },
  "کوکو سبزی": { unit: "g", per100: { kcal: 180, p: 8, c: 6, f: 14, fiber: 2 }, aliases: ["کوکو"], pieceG: 80 },
  "کوکو سیب‌زمینی": { unit: "g", per100: { kcal: 200, p: 6, c: 18, f: 12, fiber: 1.5 }, aliases: ["کوکو"], pieceG: 80 },
  "میرزا قاسمی": { unit: "g", per100: { kcal: 110, p: 2.5, c: 8, f: 8, fiber: 2 }, aliases: [], pieceG: 100 },
  "یتیمچه": { unit: "g", per100: { kcal: 85, p: 2, c: 12, f: 3.5, fiber: 3 }, aliases: [], pieceG: 150 },
  
  // ===== صبحانه =====
  "نان و پنیر و گردو": { unit: "g", per100: { kcal: 280, p: 10, c: 30, f: 14, fiber: 3 }, aliases: ["صبحانه ایرانی", "نان پنیر"] },
  "نان و پنیر و خیار": { unit: "g", per100: { kcal: 240, p: 9, c: 32, f: 9, fiber: 2.5 }, aliases: [] },
  "نان و تخم‌مرغ": { unit: "g", per100: { kcal: 260, p: 12, c: 28, f: 11, fiber: 2 }, aliases: [] },
  "نان و عسل": { unit: "g", per100: { kcal: 320, p: 7, c: 55, f: 8, fiber: 1.5 }, aliases: [] },
  "نان و مربا": { unit: "g", per100: { kcal: 300, p: 6, c: 58, f: 6, fiber: 1 }, aliases: [] },
  "نان و کره": { unit: "g", per100: { kcal: 350, p: 6, c: 45, f: 16, fiber: 1.5 }, aliases: [] },
  "عدسی": { unit: "g", per100: { kcal: 100, p: 6, c: 14, f: 2, fiber: 4 }, aliases: ["خوراک عدس"] },
  "لاله": { unit: "g", per100: { kcal: 160, p: 9, c: 8, f: 10, fiber: 1 }, aliases: ["نرگسی"] }
};

const IR_RECIPES = {
  "قورمه سبزی": {
    aliases: ["قورمه‌سبزی","قورمه سبزی با برنج","قورمه‌سبزی با برنج","خورشت قورمه"],
    servingLabel: "۱ بشقاب",
    ingredients: [
      { food: "برنج", g: 180 },
      { food: "گوشت گوساله", g: 70 },
      { food: "لوبیا", g: 40 },
      { food: "سبزی خورشتی", g: 60 },
      { food: "روغن", g: 12 }
    ]
  },
  "قیمه": {
    aliases: ["خوراک قیمه","قیمه با برنج","یک پرس قیمه","خورشت قیمه"],
    servingLabel: "۱ پرس",
    ingredients: [
      { food: "برنج", g: 180 },
      { food: "گوشت گوساله", g: 65 },
      { food: "نخود", g: 25 },
      { food: "سیب زمینی", g: 40 },
      { food: "روغن", g: 12 }
    ]
  },
  "پلو جوجه کباب": {
    aliases: ["پلو جوجه‌کباب","جوجه کباب با برنج","چلو جوجه","چلو جوجه کباب"],
    servingLabel: "۱ بشقاب",
    ingredients: [
      { food: "برنج", g: 200 },
      { food: "جوجه کباب", g: 150 },
      { food: "روغن", g: 8 },
      { food: "کره", g: 5 }
    ]
  },
  "چلو کباب کوبیده": {
    aliases: ["چلو کباب","چلوکباب","کباب با برنج"],
    servingLabel: "۱ پرس",
    ingredients: [
      { food: "برنج", g: 200 },
      { food: "کباب کوبیده", g: 120 },
      { food: "روغن", g: 5 }
    ]
  },
  "عدس پلو": {
    aliases: ["عدس‌پلو"],
    servingLabel: "۱ بشقاب",
    ingredients: [
      { food: "برنج", g: 180 },
      { food: "عدس", g: 60 },
      { food: "روغن", g: 10 }
    ]
  },
  "لوبیا پلو": {
    aliases: ["لوبیاپلو"],
    servingLabel: "۱ بشقاب",
    ingredients: [
      { food: "برنج", g: 180 },
      { food: "لوبیا", g: 70 },
      { food: "گوشت گوساله", g: 40 },
      { food: "روغن", g: 10 }
    ]
  },
  "مرغ و برنج": {
    aliases: ["خوراک مرغ","مرغ با برنج","چلو مرغ"],
    servingLabel: "۱ بشقاب",
    ingredients: [
      { food: "برنج", g: 180 },
      { food: "مرغ", g: 140 },
      { food: "روغن", g: 8 }
    ]
  },
  "صبحانه نان و پنیر": {
    aliases: ["نان و پنیر","صبحانه ایرانی"],
    servingLabel: "۱ وعده",
    ingredients: [
      { food: "نان سنگک", g: 80 },
      { food: "پنیر", g: 40 },
      { food: "گردو", g: 15 }
    ]
  },
  "نیمرو": {
    aliases: ["صبحانه تخم مرغ","تخم مرغ صبحانه"],
    servingLabel: "۲ عدد",
    ingredients: [
      { food: "تخم مرغ", g: 100 },
      { food: "روغن", g: 8 },
      { food: "نان سنگک", g: 60 }
    ]
  },
  "ماست و گردو": {
    aliases: ["یک کاسه ماست + گردو","ماست با گردو"],
    servingLabel: "۱ کاسه",
    ingredients: [
      { food: "ماست", g: 200 },
      { food: "گردو", g: 20 }
    ]
  }
};

const UNIT_TO_G = {
  "بشقاب": 1, "پرس": 1, "کاسه": 1, "لیوان": 200, "قاشق": 12,
  "کف دست": 40, "عدد": 1, "گرم": 1, "میلی لیتر": 1, "میلی‌لیتر": 1, "ml": 1, "g": 1
};

const QUICK_IRANIAN_FOODS = [
  { label: "🍛 قورمه‌سبزی با برنج", text: "یک بشقاب قورمه سبزی با برنج" },
  { label: "🍗 پلو جوجه‌کباب", text: "یک بشقاب پلو جوجه کباب" },
  { label: "🍢 چلو کباب کوبیده", text: "یک پرس چلو کباب کوبیده" },
  { label: "🥘 قیمه با برنج", text: "یک پرس قیمه با برنج" },
  { label: "🍚 عدس‌پلو", text: "یک بشقاب عدس پلو" },
  { label: "🥖 ۲ کف دست سنگک + تخم‌مرغ", text: "دو کف دست نان سنگک و سه عدد تخم مرغ" },
  { label: "🥣 ماست و گردو", text: "یک کاسه ماست با یک مشت گردو" },
  { label: "🍗 چلو مرغ", text: "یک بشقاب مرغ با برنج" }
];

// لیست کامل مواد غذایی برای منوی دراپ‌داون
const FOOD_DROPDOWN_LIST = (function() {
  const list = [];
  for (const [name, data] of Object.entries(IR_FOOD_DB)) {
    list.push({
      name: name,
      unit: data.unit || 'g',
      kcal: data.per100.kcal,
      protein: data.per100.p,
      carbs: data.per100.c,
      fat: data.per100.f,
      fiber: data.per100.fiber,
      aliases: data.aliases || [],
      pieceG: data.pieceG || null
    });
  }
  // مرتب‌سازی بر اساس نام
  list.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
  return list;
})();
