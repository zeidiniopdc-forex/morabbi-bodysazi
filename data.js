// ========== PROGRAM DATA (from user's plan - DO NOT change training logic) ==========
const PROGRAM = {
  name: "برنامه ۴ جلسه‌ای سرشانه و بازو",
  weeks: 8,
  sessionsPerWeek: 4,
  user: {
    gender: "male",
    age: 44,
    weight: 94,
    height: 178,
    experienceYears: 30,
    limitation: "L4-L5 mild disc",
    goals: ["shoulder hypertrophy", "arm hypertrophy", "fat loss", "muscle retention"]
  },
  forbiddenMoves: [
    "اسکوات هالتر سنگین",
    "ددلیفت",
    "Romanian Deadlift",
    "Good Morning",
    "Bent-over Row سنگین",
    "حرکات چرخشی سنگین تنه",
    "کرانچ سنگین با دامنه زیاد"
  ],
  sessions: [
    {
      id: 1,
      name: "سرشانه + سینه + پشت بازو",
      shortName: "جلسه ۱",
      color: "#22d3ee",
      muscles: ["سرشانه", "سینه", "پشت بازو"],
      warmUp: "۸ دقیقه: ۵ دقیقه دوچرخه/الپتیکال + چرخش شانه + ۲ ست سبک حرکت اول",
      exercises: [
        { id: "s1e1", name: "پرس سینه دستگاه", muscle: "سینه", sets: 3, reps: "6–10", rest: "2–3 دقیقه", rir: "2", note: "فرم کامل، کمر خنثی", safety: "از قوس بیش از حد کمر پرهیز کنید" },
        { id: "s1e2", name: "پرس بالا سینه دستگاه", muscle: "سینه", sets: 2, reps: "8–12", rest: "2 دقیقه", rir: "2", note: "", safety: "" },
        { id: "s1e3", name: "پرس سرشانه دستگاه با پشتی", muscle: "سرشانه", sets: 2, reps: "8–12", rest: "2 دقیقه", rir: "2", note: "", safety: "پشتی کاملاً تکیه" },
        { id: "s1e4", name: "نشر جانب سیم‌کش", muscle: "سرشانه (میانی)", sets: 4, reps: "12–20", rest: "60–90ث", rir: "1–2", note: "وزنه را قربانی دامنه حرکت نکنید. هدف دلتوئید میانی است", safety: "" },
        { id: "s1e5", name: "فلای معکوس دستگاه", muscle: "سرشانه (خلفی)", sets: 2, reps: "12–20", rest: "60–90ث", rir: "1–2", note: "", safety: "" },
        { id: "s1e6", name: "پشت بازو سیم‌کش طنابی", muscle: "پشت بازو", sets: 3, reps: "8–12", rest: "75–90ث", rir: "1–2", note: "", safety: "" },
        { id: "s1e7", name: "پشت بازو سیم‌کش بالای سر", muscle: "پشت بازو", sets: 2, reps: "10–15", rest: "60–90ث", rir: "1–2", note: "", safety: "" }
      ]
    },
    {
      id: 2,
      name: "پشت + جلو بازو + پا + میان‌تنه",
      shortName: "جلسه ۲",
      color: "#a78bfa",
      muscles: ["پشت", "جلو بازو", "پا", "میان‌تنه"],
      warmUp: "۵–۸ دقیقه گرم کردن سبک + ۲ ست سبک حرکت اول",
      exercises: [
        { id: "s2e1", name: "لت‌پول‌داون دست خنثی", muscle: "پشت", sets: 3, reps: "8–12", rest: "2 دقیقه", rir: "2", note: "", safety: "" },
        { id: "s2e2", name: "قایقی دستگاه با تکیه‌گاه سینه", muscle: "پشت", sets: 3, reps: "8–12", rest: "2 دقیقه", rir: "2", note: "تکیه‌گاه سینه اجباری", safety: "از خم شدن کمر پرهیز" },
        { id: "s2e3", name: "پرس پا", muscle: "چهارسر", sets: 3, reps: "8–12", rest: "2–3 دقیقه", rir: "2–3", note: "کمر کاملاً خنثی و متکی. پایین رفتن بیش از دامنه گرد شدن لگن ممنوع", safety: "در صورت درد تیرکشنده متوقف شوید" },
        { id: "s2e4", name: "جلو پا دستگاه", muscle: "چهارسر", sets: 2, reps: "10–15", rest: "75–90ث", rir: "1–2", note: "", safety: "" },
        { id: "s2e5", name: "پشت پا نشسته", muscle: "همسترینگ", sets: 3, reps: "10–15", rest: "75–90ث", rir: "1–2", note: "", safety: "" },
        { id: "s2e6", name: "ساق نشسته", muscle: "ساق", sets: 3, reps: "10–15", rest: "60–90ث", rir: "1–2", note: "", safety: "" },
        { id: "s2e7", name: "جلو بازو لاری دستگاه", muscle: "جلو بازو", sets: 2, reps: "8–12", rest: "75–90ث", rir: "1–2", note: "", safety: "" },
        { id: "s2e8", name: "جلو بازو سیم‌کش", muscle: "جلو بازو", sets: 2, reps: "10–15", rest: "60–90ث", rir: "1–2", note: "", safety: "" },
        { id: "s2e9", name: "پالوف پرس", muscle: "میان‌تنه", sets: 2, reps: "10–15 هر طرف", rest: "45–60ث", rir: "—", note: "ثبات تنه", safety: "بدون چرخش سنگین" }
      ]
    },
    {
      id: 3,
      name: "سرشانه + بازو + پشت (تخصصی)",
      shortName: "جلسه ۳",
      color: "#fbbf24",
      muscles: ["سرشانه", "بازو", "پشت"],
      warmUp: "گرم کردن شانه و پشت + ۲ ست سبک",
      note: "مهم‌ترین جلسه برای تغییر ظاهر بالاتنه",
      exercises: [
        { id: "s3e1", name: "پرس سرشانه دستگاه با پشتی", muscle: "سرشانه", sets: 3, reps: "6–10", rest: "2 دقیقه", rir: "2", note: "", safety: "پشتی کامل" },
        { id: "s3e2", name: "نشر جانب دستگاه", muscle: "سرشانه (میانی)", sets: 4, reps: "12–20", rest: "60–90ث", rir: "1–2", note: "دامنه کامل، وزنه مناسب", safety: "" },
        { id: "s3e3", name: "فلای معکوس دستگاه", muscle: "سرشانه (خلفی)", sets: 3, reps: "12–20", rest: "60–90ث", rir: "1–2", note: "", safety: "" },
        { id: "s3e4", name: "لت‌پول‌داون", muscle: "پشت", sets: 3, reps: "8–12", rest: "2 دقیقه", rir: "2", note: "", safety: "" },
        { id: "s3e5", name: "قایقی سینه‌تکیه", muscle: "پشت", sets: 3, reps: "8–12", rest: "2 دقیقه", rir: "2", note: "سینه‌تکیه اجباری", safety: "" },
        { id: "s3e6", name: "جلو بازو دمبل روی میز شیب‌دار", muscle: "جلو بازو", sets: 3, reps: "8–12", rest: "75–90ث", rir: "1–2", note: "اگر کمر/شانه ناراحت بود → جلو بازو دستگاه", safety: "جایگزین دستگاه در صورت ناراحتی" },
        { id: "s3e7", name: "جلو بازو چکشی طنابی", muscle: "جلو بازو", sets: 2, reps: "10–15", rest: "60–90ث", rir: "1", note: "", safety: "" },
        { id: "s3e8", name: "پشت بازو طنابی", muscle: "پشت بازو", sets: 3, reps: "8–12", rest: "75–90ث", rir: "1–2", note: "", safety: "" },
        { id: "s3e9", name: "پشت بازو تک‌دست سیم‌کش", muscle: "پشت بازو", sets: 2, reps: "10–15", rest: "60ث", rir: "1", note: "", safety: "" },
        { id: "s3e10", name: "شراگ دستگاه/سیم‌کش", muscle: "ذوزنقه", sets: 2, reps: "10–15", rest: "75ث", rir: "1–2", note: "با تکیه مناسب", safety: "" }
      ]
    },
    {
      id: 4,
      name: "پا + سینه + سرشانه + بازو",
      shortName: "جلسه ۴",
      color: "#34d399",
      muscles: ["پا", "سینه", "سرشانه", "بازو"],
      warmUp: "گرم کردن پا و بالاتنه",
      exercises: [
        { id: "s4e1", name: "پرس پا", muscle: "چهارسر", sets: 3, reps: "8–12", rest: "2–3 دقیقه", rir: "2–3", note: "کمر خنثی و متکی", safety: "در صورت درد تیرکشنده متوقف شوید" },
        { id: "s4e2", name: "پشت پا نشسته/خوابیده", muscle: "همسترینگ", sets: 3, reps: "8–12", rest: "90ث", rir: "1–2", note: "", safety: "" },
        { id: "s4e3", name: "جلو پا دستگاه", muscle: "چهارسر", sets: 2, reps: "10–15", rest: "75ث", rir: "1–2", note: "", safety: "" },
        { id: "s4e4", name: "کیک‌بک باسن دستگاه/سیم‌کش", muscle: "باسن", sets: 2, reps: "12–15", rest: "60–75ث", rir: "1–2", note: "", safety: "" },
        { id: "s4e5", name: "ساق نشسته", muscle: "ساق", sets: 3, reps: "10–15", rest: "60–90ث", rir: "1–2", note: "", safety: "" },
        { id: "s4e6", name: "پرس سینه دستگاه", muscle: "سینه", sets: 3, reps: "8–12", rest: "2 دقیقه", rir: "2", note: "", safety: "" },
        { id: "s4e7", name: "نشر جانب سیم‌کش", muscle: "سرشانه", sets: 3, reps: "15–20", rest: "60ث", rir: "1", note: "", safety: "" },
        { id: "s4e8", name: "جلو بازو سیم‌کش", muscle: "جلو بازو", sets: 2, reps: "10–15", rest: "60ث", rir: "1", note: "", safety: "" },
        { id: "s4e9", name: "پشت بازو طنابی", muscle: "پشت بازو", sets: 2, reps: "10–15", rest: "60ث", rir: "1", note: "", safety: "" },
        { id: "s4e10", name: "پلانک بغل", muscle: "میان‌تنه", sets: 2, reps: "30–45ث هر طرف", rest: "45ث", rir: "—", note: "", safety: "" },
        { id: "s4e11", name: "ددباگ", muscle: "میان‌تنه", sets: 2, reps: "8–12 هر طرف", rest: "45ث", rir: "—", note: "", safety: "کنترل کمر" }
      ]
    }
  ],
  volumeTargets: {
    "سرشانه": "18–19",
    "جلو بازو": "11",
    "پشت بازو": "12",
    "پشت": "12",
    "سینه": "8",
    "چهارسر ران": "7",
    "همسترینگ": "6",
    "باسن": "2 مستقیم + غیرمستقیم",
    "ساق": "6",
    "میان‌تنه": "6"
  },
  cardio: [
    { name: "جلسه A – دوچرخه ثابت", duration: "30–35 دقیقه", intensity: "متوسط" },
    { name: "جلسه B – الپتیکال/دوچرخه", duration: "30–40 دقیقه", intensity: "متوسط" }
  ],
  nutritionTargets: {
    calorieDeficit: "300–500 کیلوکالری",
    weightLossPerWeek: "0.3–0.6 کیلوگرم",
    protein: "170–190 گرم",
    steps: "8000–10000"
  }
};

// ========== کاتالوگ کامل مکمل‌های ورزشی ==========
// timing: pre | post | daily | morning | evening | with_meal | anytime
// offsetMin: دقیقه قبل (منفی) یا بعد از ساعت تمرین برای محاسبه خودکار
const SUPPLEMENT_CATALOG = [
  // سطح A — شواهد قوی
  {
    id: "creatine",
    name: "کراتین مونوهیدرات",
    dose: "3–5 گرم",
    defaultDose: 5,
    unit: "گرم",
    level: "A",
    category: "عملکرد / حجم",
    timing: "daily",
    offsetMin: 0,
    defaultEnabled: true,
    note: "هر روز حتی استراحت. زمان دقیق مهم نیست؛ می‌توانید بعد تمرین یا با وعده مصرف کنید. بارگیری لازم نیست."
  },
  {
    id: "whey",
    name: "پروتئین وی",
    dose: "25–35 گرم",
    defaultDose: 30,
    unit: "گرم",
    level: "A",
    category: "پروتئین",
    timing: "post",
    offsetMin: 30,
    defaultEnabled: true,
    note: "برای تکمیل پروتئین روزانه (۱۷۰–۱۹۰ گرم). بعد تمرین یا بین وعده‌ها. وی جادویی نیست؛ فقط ابزار رسیدن به هدف پروتئین است."
  },
  {
    id: "casein",
    name: "کازئین",
    dose: "25–40 گرم",
    defaultDose: 30,
    unit: "گرم",
    level: "B",
    category: "پروتئین",
    timing: "evening",
    offsetMin: 0,
    defaultEnabled: false,
    note: "پروتئین کندرهش؛ مناسب قبل خواب اگر پروتئین شام کافی نیست."
  },
  // سطح B — مفید
  {
    id: "caffeine",
    name: "کافئین",
    dose: "100–200 میلی‌گرم",
    defaultDose: 150,
    unit: "میلی‌گرم",
    level: "B",
    category: "انرژی / تمرکز",
    timing: "pre",
    offsetMin: -45,
    defaultEnabled: true,
    note: "۳۰–۶۰ دقیقه قبل تمرین. اگر تمرین شبانه است یا به کافئین حساسید، دوز را کم کنید یا خاموش کنید."
  },
  {
    id: "betaalanine",
    name: "بتاآلانین",
    dose: "3–6 گرم",
    defaultDose: 4,
    unit: "گرم",
    level: "B",
    category: "عملکرد",
    timing: "daily",
    offsetMin: 0,
    defaultEnabled: false,
    note: "مصرف روزانه برای اشباع. ممکن است گزگز پوست ایجاد کند (بی‌خطر). برای ست‌های طولانی‌تر مفید است."
  },
  {
    id: "citrulline",
    name: "سیترولین مالات",
    dose: "6–8 گرم",
    defaultDose: 6,
    unit: "گرم",
    level: "B",
    category: "پمپ / استقامت",
    timing: "pre",
    offsetMin: -45,
    defaultEnabled: false,
    note: "۳۰–۶۰ دقیقه قبل تمرین. به پمپ و کاهش خستگی کمک می‌کند."
  },
  {
    id: "citrulline_pure",
    name: "ال-سیترولین",
    dose: "3–6 گرم",
    defaultDose: 4,
    unit: "گرم",
    level: "B",
    category: "پمپ",
    timing: "pre",
    offsetMin: -40,
    defaultEnabled: false,
    note: "جایگزین سیترولین مالات؛ قبل تمرین."
  },
  {
    id: "betaine",
    name: "بتائین (TMG)",
    dose: "2–2.5 گرم",
    defaultDose: 2.5,
    unit: "گرم",
    level: "B",
    category: "عملکرد",
    timing: "pre",
    offsetMin: -45,
    defaultEnabled: false,
    note: "قبل تمرین؛ شواهد متوسط برای قدرت و حجم."
  },
  {
    id: "taurine",
    name: "تائورین",
    dose: "1–3 گرم",
    defaultDose: 2,
    unit: "گرم",
    level: "B",
    category: "عملکرد",
    timing: "pre",
    offsetMin: -45,
    defaultEnabled: false,
    note: "گاهی در پری‌ورک‌اوت‌ها؛ قبل تمرین."
  },
  {
    id: "electrolytes",
    name: "الکترولیت / نمک",
    dose: "طبق تعریق",
    defaultDose: 1,
    unit: "وعده",
    level: "B",
    category: "هیدراتاسیون",
    timing: "pre",
    offsetMin: -15,
    defaultEnabled: false,
    note: "در تمرین طولانی یا تعریق زیاد؛ قبل/حین تمرین."
  },
  // سطح C — در صورت نیاز / غذایی
  {
    id: "vitd",
    name: "ویتامین D",
    dose: "طبق آزمایش",
    defaultDose: 2000,
    unit: "IU",
    level: "C",
    category: "ویتامین",
    timing: "morning",
    offsetMin: 0,
    defaultEnabled: false,
    note: "فقط در صورت کمبود آزمایشگاهی یا توصیه پزشک. با غذای چرب بهتر جذب می‌شود."
  },
  {
    id: "omega3",
    name: "امگا ۳ (EPA+DHA)",
    dose: "1–2 گرم",
    defaultDose: 1.5,
    unit: "گرم",
    level: "C",
    category: "چربی ضروری",
    timing: "with_meal",
    offsetMin: 0,
    defaultEnabled: false,
    note: "اگر ماهی چرب منظم نمی‌خورید. با وعده غذایی."
  },
  {
    id: "magnesium",
    name: "منیزیم",
    dose: "200–400 میلی‌گرم",
    defaultDose: 300,
    unit: "میلی‌گرم",
    level: "C",
    category: "مواد معدنی",
    timing: "evening",
    offsetMin: 0,
    defaultEnabled: false,
    note: "در صورت کمبود غذایی؛ عصر/قبل خواب. به خواب و ریکاوری کمک می‌کند."
  },
  {
    id: "zinc",
    name: "زینک",
    dose: "15–30 میلی‌گرم",
    defaultDose: 15,
    unit: "میلی‌گرم",
    level: "C",
    category: "مواد معدنی",
    timing: "evening",
    offsetMin: 0,
    defaultEnabled: false,
    note: "فقط در صورت کمبود. زیاده‌روی مضر است."
  },
  {
    id: "multivitamin",
    name: "مولتی‌ویتامین",
    dose: "۱ عدد",
    defaultDose: 1,
    unit: "عدد",
    level: "C",
    category: "عمومی",
    timing: "morning",
    offsetMin: 0,
    defaultEnabled: false,
    note: "پوشش کمبودهای جزئی؛ جایگزین رژیم غذایی نیست."
  },
  {
    id: "ashwagandha",
    name: "آشوگاندا",
    dose: "300–600 میلی‌گرم",
    defaultDose: 300,
    unit: "میلی‌گرم",
    level: "C",
    category: "آداپتوژن",
    timing: "evening",
    offsetMin: 0,
    defaultEnabled: false,
    note: "ممکن است به کاهش استرس و خواب کمک کند. شواهد متوسط."
  },
  {
    id: "vitamin_c",
    name: "ویتامین C",
    dose: "500–1000 میلی‌گرم",
    defaultDose: 500,
    unit: "میلی‌گرم",
    level: "C",
    category: "ویتامین",
    timing: "with_meal",
    offsetMin: 0,
    defaultEnabled: false,
    note: "در دوز بالا مزیت عضله‌سازی اثبات‌شده ندارد؛ در صورت نیاز غذایی."
  },
  {
    id: "collagen",
    name: "کلاژن",
    dose: "10–15 گرم",
    defaultDose: 10,
    unit: "گرم",
    level: "C",
    category: "مفصل / پوست",
    timing: "anytime",
    offsetMin: 0,
    defaultEnabled: false,
    note: "برای مفاصل/پوست؛ برای عضله‌سازی پروتئین کامل اولویت دارد."
  },
  // معمولاً غیرضروری — پیش‌فرض خاموش
  {
    id: "bcaa",
    name: "BCAA",
    dose: "۵–۱۰ گرم",
    defaultDose: 5,
    unit: "گرم",
    level: "optional",
    category: "غیرضروری",
    timing: "pre",
    offsetMin: -20,
    defaultEnabled: false,
    note: "با پروتئین کافی (۱۷۰+ گرم) معمولاً لازم نیست."
  },
  {
    id: "glutamine",
    name: "گلوتامین",
    dose: "۵–۱۰ گرم",
    defaultDose: 5,
    unit: "گرم",
    level: "optional",
    category: "غیرضروری",
    timing: "post",
    offsetMin: 15,
    defaultEnabled: false,
    note: "برای هدف عضله‌سازی شما مکمل ضروری محسوب نمی‌شود."
  },
  {
    id: "fatburner",
    name: "چربی‌سوز (ترموژنیک)",
    dose: "طبق برچسب",
    defaultDose: 1,
    unit: "وعده",
    level: "optional",
    category: "غیرضروری",
    timing: "morning",
    offsetMin: 0,
    defaultEnabled: false,
    note: "پیشنهاد نمی‌شود. کسری کالری + پروتئین + تمرین مهم‌تر است."
  },
  {
    id: "preworkout_blend",
    name: "پری‌ورک‌اوت ترکیبی",
    dose: "طبق برچسب",
    defaultDose: 1,
    unit: "اسکوپ",
    level: "optional",
    category: "ترکیبی",
    timing: "pre",
    offsetMin: -30,
    defaultEnabled: false,
    note: "اگر کافئین/سیترولین جدا مصرف می‌کنید، ممکن است تکراری باشد. برچسب را چک کنید."
  }
];

// برچسب فارسی زمان‌بندی
const TIMING_LABELS = {
  pre: "قبل تمرین",
  post: "بعد تمرین",
  daily: "هر روز (زمان آزاد)",
  morning: "صبح",
  evening: "عصر / قبل خواب",
  with_meal: "با وعده غذایی",
  anytime: "هر زمان"
};

/** محاسبه ساعت پیشنهادی مصرف بر اساس ساعت تمرین کاربر */
function computeSuppTime(timing, offsetMin, workoutTimeHHMM) {
  if (!workoutTimeHHMM || timing === "daily" || timing === "anytime") {
    if (timing === "morning") return "09:00";
    if (timing === "evening") return "21:00";
    if (timing === "with_meal") return "13:00";
    return "10:00";
  }
  if (timing === "morning") return "09:00";
  if (timing === "evening") return "21:00";
  if (timing === "with_meal") return "13:00";

  const [h, m] = workoutTimeHHMM.split(":").map(Number);
  let total = h * 60 + m + (offsetMin || 0);
  if (total < 0) total += 24 * 60;
  total = total % (24 * 60);
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Rest seconds helper
function parseRestSeconds(restStr) {
  if (!restStr) return 90;
  if (restStr.includes("2–3") || restStr.includes("2-3")) return 150;
  if (restStr.includes("2 دقیقه") || restStr === "2 دقیقه") return 120;
  if (restStr.includes("90")) return 90;
  if (restStr.includes("75")) return 75;
  if (restStr.includes("60–90") || restStr.includes("60-90")) return 75;
  if (restStr.includes("60")) return 60;
  if (restStr.includes("45")) return 45;
  return 90;
}

// Parse rep range for double progression
function parseRepRange(repsStr) {
  if (!repsStr) return { min: 8, max: 12 };
  const match = repsStr.match(/(\d+)\s*[–\-]\s*(\d+)/);
  if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) };
  const single = parseInt(repsStr);
  if (!isNaN(single)) return { min: single, max: single };
  return { min: 8, max: 12 };
}
