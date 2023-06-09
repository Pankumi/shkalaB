const mongoose = require("mongoose");

const {
  createScaleArray,
  updatesBuyAndDone,
  updatesBuy,
  findNewOrders,
  findTopAndDown,
  findNextOrders,

  formatDate,
} = require("./fuctions");
// const getBinanceData = require("../request"); // binance api
const {
  getFirstCandleFromBD,
  getCandleFromBD,
} = require("./request_db/binance_btcusdt_1m"); // локальна бд
// const { async } = require("regenerator-runtime");

// ЗМІННІ **********
const params = {
  // початкові зн. шкали: початкова ціна, кінцева ціна, крок %, прибуток %:
  scaleStart: 1000,
  scaleEnd: 100000,
  scaleStep: 1,
  profit: 1,
  // дата початку і закінчення аналізу
  dataStart: "2017-05-01",
  dataEnd: "2023-05-02",
};

//масив scale обов'єзково має бути впорядкований від меньшого до більшого
let scale = [];
let candle = {};
let preOrders = new Set();
let orders = new Set();
let buy = [];
let done = [];

let queryParams = {
  dataStartMs: new Date(params.dataStart).getTime(),
  dataEndMs: new Date(params.dataEnd).getTime(),

  highStep: null,
  lowStep: null,
  lowSell: null,

  minOrderSell: null,
  minPreOrder: null,
  maxOrder: null,
};

let previousCandle = {};


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
  console.log(" довжина шкали >> ", scale.length);
  console.log(" стартові параметри >> ", queryParams);

  for (let cycle = 1; cycle <= 10; cycle++) { // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    console.log("ПРОХІД >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ", cycle);
    console.log(
      " почати з >> ",
      queryParams.dataStartMs,
      formatDate(queryParams.dataStartMs)
    );
    console.log(" мін. точка продажу >> ", queryParams.lowSell);
    console.log(" точку купівлі над попередньою свічкою>> ", queryParams.highStep);
    console.log(" точка купівлі під попередньою свічкою>> ", queryParams.lowStep);

    // оновлення поередньої свічки
    previousCandle = candle;

    // 1 ЗАПИТ В БД ЗА СВІЧКОЮ
    if (JSON.stringify(candle) === "{}") {
      // Повертає першу свічку з проміжку // приймає об'їкт параметрів з часом початку відліку в мілесекундах
      candle = await getFirstCandleFromBD(queryParams);
    } else {
      // Повертає наступну найближчу свічку яка або пересікає сходинку шкали або пересікає ордер на продаж
      // приймає об'їкт (час початку/кінця періоду, 2 найближчі сходинки шкали buy - меньше/більше попередньої ціни, найменший ордер на продаж sell)
      candle = await getCandleFromBD(queryParams);
    }
    candle.high = Number(candle.high);
    candle.low = Number(candle.low);

    console.log("1 СВІЧКА: ", candle._id);
    console.log(
      " _____.openTime >> ",
      candle.openTime,
      formatDate(candle.openTime),
      "_____.closeTime >> ",
      candle.closeTime,
      formatDate(candle.closeTime)
    );
    console.log(" _____.high >> ", candle.high);
    console.log(" _____.low >> ", candle.low);

    // 1.2 ПЕРЕВІРКА ЧИ СВІЧКА НЕ ВИСКОЧИЛА ЗА МЕЖІ ЗАПИТУ (queryParams.highStep) (таке можливо бо ціна open часто відрізняється від close попередньої свічки)
    // вищє запиту
    if (candle.low > queryParams.highStep) {
      console.log("1.2 СВІЧКА ВИЩЕ ЗАПИТУ ");
    }
    // ницє запиту
    if (candle.high < queryParams.lowStep) {
      console.log("1.2 СВІЧКА НИЩЕ ЗАПИТУ ");
    }

    // TODO: 2 ПЕРЕВІРКА СПРАЦЮВАННЯ ОРДЕРІВ НА ПРОДАЖ ( зробити коли буде точка продажу )
    // оновлює масив done (додає завершені угоди), оновлює buy (видаляє завершені угоди) // приймає свічку (об'єкт), масив buy, масив done
    console.log(
      "2 Ордери виконані >> ",
      done.length,
      "відкриті >> ",
      buy.length
    );
    updatesBuyAndDone(candle, buy, done);
    console.log(
      "2 Ордери виконані >> ",
      done.length,
      "відкриті >> ",
      buy.length
    );

    // 3 СПРАЦЮВАННЯ ОРДЕРІВ НА КУПІВЛЮ
    // Оновлює масив buy (додає відкриті угоди) // приймає шкалу, свчку, попередню свічку, параметри (profit), масив buy
    updatesBuy(scale, candle, previousCandle, params, buy);
    console.log("3 Ордери відкриті >> ", buy.length);
    // додаю до параметрів запиту найменший ордер на продаж
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

    // 4 СПРАЦЮВАННЯ ПРЕ-ОРДЕРІВ - ПЕРЕНОС ДО ОРДЕРІВ У ВИПАДКУ ПЕРЕТИНУ ПРЕОРДЕРА СВІЧКОЮ
    // Оновлює масив order (додає ордери на купівлю), оновлює масив preOrders (видаляє перенесені) // приймає свічку і преОрдери
    findNewOrders(candle, preOrders, orders);

    // 5 РОЗРАХУВАТИ НАСТУПНІ ОРДЕРИ І ПРЕ-ОРДЕРИ (ТОЧКИ ПОШУКУ В БД)
    // Повертає об'єкт { highStep, lowStep } сходинки шкали між якими знаходиться свічка. ( наступні buy )( наступні точки пошуку в бд )
    // приймає шкалу (масив) і свічку (об'єкт)
    const nextStepBuy = findTopAndDown(scale, candle);
    // console.log(" 4 nextStepBuy >> ", nextStepBuy);
    queryParams = { ...queryParams, ...nextStepBuy };

    
    // 5 РОЗРАХУВАТИ НАСТУПНІ ОРДЕРИ І ПРЕ-ОРДЕРИ (ТОЧКИ ПОШУКУ В БД)
    // модифікує обьєкти preOrders і orders
    findNextOrders(scale, candle, preOrders, orders);
  }

  db.close();
  console.log("Скрипт дійшов до кінця");
  console.log("timeEnd >>>", new Date() - timeStart);
};
app();
//************************************************************************************************************************************* */
