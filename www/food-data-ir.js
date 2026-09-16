// ========== Iranian food database (extensible) ==========
// Macros per 100g cooked/edible unless noted. Values are estimates for tracking.
const IR_FOOD_DB = {
  "برنج": { unit: "g", per100: { kcal: 130, p: 2.7, c: 28, f: 0.3, fiber: 0.4 }, aliases: ["برنج پخته","چلو","پلو","برنج ایرانی"] },
  "نان سنگک": { unit: "g", per100: { kcal: 270, p: 9, c: 56, f: 1.2, fiber: 6 }, aliases: ["سنگک"], pieceG: 80 },
  "نان بربری": { unit: "g", per100: { kcal: 265, p: 8.5, c: 54, f: 1.5, fiber: 4 }, aliases: ["بربری"], pieceG: 100 },
  "نان لواش": { unit: "g", per100: { kcal: 275, p: 8, c: 58, f: 1, fiber: 2.5 }, aliases: ["لواش"], pieceG: 30 },
  "نان تافتون": { unit: "g", per100: { kcal: 270, p: 8, c: 55, f: 1.2, fiber: 3 }, aliases: ["تافتون"], pieceG: 50 },
  "گوشت گوساله": { unit: "g", per100: { kcal: 200, p: 26, c: 0, f: 11, fiber: 0 }, aliases: ["گوشت","گوشت قرمز","گوشت خورشتی"] },
  "گوشت گوسفند": { unit: "g", per100: { kcal: 240, p: 25, c: 0, f: 16, fiber: 0 }, aliases: ["گوسفند"] },
  "مرغ": { unit: "g", per100: { kcal: 165, p: 31, c: 0, f: 3.6, fiber: 0 }, aliases: ["سینه مرغ","ران مرغ","جوجه","گوشت مرغ"] },
  "ماهی": { unit: "g", per100: { kcal: 120, p: 22, c: 0, f: 3, fiber: 0 }, aliases: ["ماهی سفید","قزل آلا"] },
  "تخم مرغ": { unit: "g", per100: { kcal: 155, p: 13, c: 1.1, f: 11, fiber: 0 }, aliases: ["تخم‌مرغ","تخم مرغ آبپز"], pieceG: 50 },
  "پنیر": { unit: "g", per100: { kcal: 280, p: 18, c: 2, f: 22, fiber: 0 }, aliases: ["پنیر سفید","پنیر لیقوان"] },
  "ماست": { unit: "g", per100: { kcal: 60, p: 3.5, c: 4.7, f: 3.3, fiber: 0 }, aliases: ["ماست چکیده","ماست کم چرب"] },
  "دوغ": { unit: "ml", per100: { kcal: 35, p: 1.5, c: 3, f: 1.5, fiber: 0 }, aliases: [] },
  "لوبیا": { unit: "g", per100: { kcal: 140, p: 9, c: 25, f: 0.5, fiber: 7 }, aliases: ["لوبیا چیتی","لوبیا قرمز"] },
  "عدس": { unit: "g", per100: { kcal: 116, p: 9, c: 20, f: 0.4, fiber: 8 }, aliases: [] },
  "نخود": { unit: "g", per100: { kcal: 160, p: 9, c: 27, f: 2.5, fiber: 8 }, aliases: [] },
  "سبزی خورشتی": { unit: "g", per100: { kcal: 35, p: 2.5, c: 5, f: 0.5, fiber: 3 }, aliases: ["سبزی","سبزی قورمه"] },
  "سیب زمینی": { unit: "g", per100: { kcal: 87, p: 1.9, c: 20, f: 0.1, fiber: 1.8 }, aliases: ["سیب‌زمینی"] },
  "بادمجان": { unit: "g", per100: { kcal: 35, p: 1, c: 6, f: 0.5, fiber: 3 }, aliases: [] },
  "گوجه": { unit: "g", per100: { kcal: 18, p: 0.9, c: 3.9, f: 0.2, fiber: 1.2 }, aliases: ["گوجه فرنگی"] },
  "خیار": { unit: "g", per100: { kcal: 15, p: 0.7, c: 3.6, f: 0.1, fiber: 0.5 }, aliases: [] },
  "سالاد شیرازی": { unit: "g", per100: { kcal: 25, p: 0.8, c: 4, f: 0.5, fiber: 1.2 }, aliases: ["سالاد"] },
  "روغن": { unit: "g", per100: { kcal: 884, p: 0, c: 0, f: 100, fiber: 0 }, aliases: ["روغن مایع","روغن سرخ کردنی"] },
  "کره": { unit: "g", per100: { kcal: 717, p: 0.9, c: 0.1, f: 81, fiber: 0 }, aliases: [] },
  "گردو": { unit: "g", per100: { kcal: 654, p: 15, c: 14, f: 65, fiber: 7 }, aliases: [], pieceG: 5 },
  "بادام": { unit: "g", per100: { kcal: 579, p: 21, c: 22, f: 50, fiber: 12 }, aliases: [], pieceG: 1.2 },
  "شیر": { unit: "ml", per100: { kcal: 60, p: 3.2, c: 4.8, f: 3.2, fiber: 0 }, aliases: ["شیر کم چرب"] },
  "خرما": { unit: "g", per100: { kcal: 280, p: 2.5, c: 75, f: 0.4, fiber: 7 }, aliases: [], pieceG: 8 },
  "عسل": { unit: "g", per100: { kcal: 304, p: 0.3, c: 82, f: 0, fiber: 0.2 }, aliases: [] },
  "چای": { unit: "ml", per100: { kcal: 1, p: 0, c: 0.2, f: 0, fiber: 0 }, aliases: ["چای سیاه"] },
  "جوجه کباب": { unit: "g", per100: { kcal: 180, p: 28, c: 1, f: 7, fiber: 0 }, aliases: ["جوجه‌کباب","جوجه کبابی"] },
  "کباب کوبیده": { unit: "g", per100: { kcal: 250, p: 20, c: 2, f: 18, fiber: 0 }, aliases: ["کوبیده"] },
  "کتلت": { unit: "g", per100: { kcal: 220, p: 14, c: 12, f: 13, fiber: 1 }, aliases: [], pieceG: 70 },
  "کوکو سبزی": { unit: "g", per100: { kcal: 180, p: 8, c: 6, f: 14, fiber: 2 }, aliases: ["کوکو"], pieceG: 80 }
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
  { label: "قورمه‌سبزی با برنج", text: "یک بشقاب قورمه سبزی با برنج" },
  { label: "پلو جوجه‌کباب", text: "یک بشقاب پلو جوجه کباب" },
  { label: "چلو کباب کوبیده", text: "یک پرس چلو کباب کوبیده" },
  { label: "قیمه با برنج", text: "یک پرس قیمه با برنج" },
  { label: "عدس‌پلو", text: "یک بشقاب عدس پلو" },
  { label: "۲ کف دست سنگک + تخم‌مرغ", text: "دو کف دست نان سنگک و سه عدد تخم مرغ" },
  { label: "ماست و گردو", text: "یک کاسه ماست با یک مشت گردو" },
  { label: "چلو مرغ", text: "یک بشقاب مرغ با برنج" }
];
