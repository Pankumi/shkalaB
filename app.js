const mongoose = require("mongoose");

const {
  createScaleArray,
  updatesBuyAndDone,
  updatesBuy,
  findTopAndDown,
} = require("./fuctions");
const getBinanceData = require("./request"); // binance api
const { getFirstCandle, getCandle } = require("./mongo_db"); // схема локальної бд
const { async } = require("regenerator-runtime");

params = {
  // початкові зн. шкали: початкова ціна, кінцева ціна, крок %, прибуток %:
  scaleStart: 1000,
  scaleEnd: 100000,
  scaleStep: 1,
  profit: 1,
  // дата початку і закінчення аналізу
  dataStart: "2017-05-01",
  dataEnd: "2023-05-02",
};

// **********
//масив scale обов'єзково має бути впорядкований від меньшого до більшого
let scale = [];
let buy = [];
let done = [];
let candle = {};
let queryParams = {
  dataStartMs: new Date(params.dataStart).getTime(),
  dataEndMs: new Date(params.dataEnd).getTime(),
  highStep: null,
  lowStep: null,
  lowSell: null,
};

// **********
// повертає шкалу // приймає об'єкт з нижнім/верхнім зн. і кроком шкали
scale = createScaleArray(params);

// **********
// Підключення до MongoDB
// TODO: дописати нормальну логіку взаємодії з бд .then(result => {}).catch(error => {}).finally(() => {})
mongoose.connect("mongodb://127.0.0.1:27017/binance", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

const app = async () => {
  const timeStart = new Date();
  console.log("start candle >> ", candle);
  console.log(" start buy >> ", buy);
  console.log(" start done >> ", done);
  console.log(" start queryParams >> ", queryParams);

  for (let cycle = 1; cycle <= 100; cycle++) {
    console.log("ПРОХІД >> ", cycle);
    console.log(" точка виходу >> ", queryParams.lowSell);
    console.log(" верхня точку входу >> ", queryParams.highStep);
    console.log(" нижня точка входу >> ", queryParams.lowStep);

    // 1 ЗАПИТ В БД ЗА СВІЧКОЮ
    if (JSON.stringify(candle) === "{}") {
      // Повертає першу свічку з проміжку // приймає об'їкт параметрів з часом початку відліку в мілесекундах
      candle = await getFirstCandle(queryParams);
    } else {
      // Повертає наступну найближчу свічку яка або пересікає сходинку шкали або пересікає ордер на продаж
      // приймає об'їкт (час початку/кінця періоду, 2 найближчі сходинки шкали buy - меньше/більше попередньої ціни, найменший ордер на продаж sell)
      candle = await getCandle(queryParams);
    }
    candle.high = parseFloat(candle.high);
    candle.low = parseFloat(candle.low);
    console.log("1 candle._id >> ", candle._id);
    console.log("1 candle.high >> ", candle.high);
    console.log("1 candle.low >> ", candle.low);

    // TODO: 2 ПЕРЕВІРКА СВІЧКИ НА ПЕРЕТИН З ТОЧКАМИ ПРОДАЖУ ( зробити коли буде точка продажу )
    // оновлює масив done (додає завершені угоди), оновлює buy (видаляє завершені угоди) // приймає масив buy, свічку (об'єкт), масив done
    console.log(
      "2 відкритих угод >> ",
      buy.length,
      "закритих угод >> ",
      done.length
    );
    updatesBuyAndDone(buy, candle, done);
    console.log(
      "2 відкритих угод >> ",
      buy.length,
      "закритих угод >> ",
      done.length
    );
    console.log("2 остання закритих угода >> ", done[done.length - 1]);

    // 3 ПЕРЕВІРКА СВІЧКИ НА ПЕРЕТИН З ТОЧКАМИ КУПІВЛІ
    // Оновлює масив buy (додає відкриті угоди) // приймає шкалу, свчку, параметри, масив buy
    updatesBuy(scale, candle, params, buy);
    console.log("3 відкритих угод >> ", buy.length);
    console.log("3 остання відкрита угода >> ", buy[buy.length - 1]);
    // додаю до параметрів найменшу точку виходу
    if (buy.length === 0) {
      queryParams.lowSell = null;
    } else {
      queryParams.lowSell = buy[0].priceSell;
      for (el of buy) {
        if (queryParams.lowSell > el.priceSell) {
          queryParams.lowSell = el.priceSell;
        }
      }
    }

    // 4 РОЗРАХУВАТИ НАСТУПНІ ТОЧКИ ПОШУКУ В БД
    // Повертає об'єкт { highStep, lowStep } сходинки шкали між якими знаходиться свічка. ( наступні buy )( наступні точки пошуку в бд )
    // приймає шкалу (масив) і свічку (об'єкт)
    const nextStepBuy = findTopAndDown(scale, candle);
    // console.log(" 4 nextStepBuy >> ", nextStepBuy);
    queryParams = { ...queryParams, ...nextStepBuy };
  }

  db.close();
  console.log("Скрипт дійшов до кінця");
  console.log("timeEnd >>>", new Date() - timeStart);
};
app();
//************************************************************************************************************************************* */
