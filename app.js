const mongoose = require("mongoose");

const {
  createScaleArray,
  updatesBuyAndDone,
  updatesBuy,
  findNewOrders,
  findNextOrders,
  updateQueryParams,
  deleteDuplicates,
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
  // доларів в 1 ордері
  orderVolume : 10 ,
  // націнка яку я планую заробити
  profit: 1 ,
  // при спрацюванні преордеру збільшити ціну преордеру при переносі до ордерів // дозволить ордеру виконатись якщо ціна іде вгору
  // TODO: поки неможливо бо призведе до дублювання з ордерами які трохи відрізняються і виставляються в ф5 при падінні ціни
  orderAddedValue: 0.1 ,
  // початкові зн. шкали: початкова ціна, кінцева ціна, крок %, прибуток %:
  scaleStart: 1000 ,
  scaleEnd: 100000 ,
  scaleStep: 1 ,
  // ліміт ордерів які виставляти
  preOrdersLimit : 3 ,
  ordersLimit : 3 ,
  // дата початку і закінчення аналізу
  dataStart: "2017-05-01" ,
  dataEnd: "2023-05-02" ,
};

//масив scale обов'єзково має бути впорядкований від меньшого до більшого
let scale = [];
let candle = {};
let preOrders = {};
let orders = {};
let buy = [];
let buyLength = 0;
let done = [];
let openTimeFirstCandle;

let queryParams = {
  dataStartMs: new Date(params.dataStart).getTime(),
  dataEndMs: new Date(params.dataEnd).getTime(),
  minOrderSell: null,
  minPreOrder: null,
  maxOrder: null,
};

let previousCandle = {};


// **********
// повертає шкалу // приймає об'єкт з нижнім/верхнім зн. і кроком шкали
scale = createScaleArray(params);
const maxScale = Math.max( ...scale );
const minScale = Math.min( ...scale );

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

  for (let cycle = 1; cycle <= 10000; cycle++) { // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

    // console.log("<<<<<<<<<<<<<<<<< ПРОХІД >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ", cycle);
    // console.log(
    //   " почати з >> ",
    //   queryParams.dataStartMs,
    //   formatDate(queryParams.dataStartMs)
    // );
    // console.log(" вище мін. ціни продажу >> ", queryParams.minOrderSell);
    // console.log(" вище ціни >> ", queryParams.minPreOrder);
    // console.log(" нище ціни >> ", queryParams.maxOrder);
    
    // оновлення поередньої свічки
    previousCandle = candle;

    // 1 ЗАПИТ В БД ЗА СВІЧКОЮ
    if (JSON.stringify(candle) === "{}") {
      // Повертає першу свічку з проміжку // приймає об'їкт параметрів з часом початку відліку в мілесекундах
      candle = await getFirstCandleFromBD(queryParams);
      openTimeFirstCandle = candle.openTime;
    } else {
      // Повертає наступну найближчу свічку яка або пересікає сходинку шкали або пересікає ордер на продаж
      // приймає об'їкт (час початку/кінця періоду, 2 найближчі сходинки шкали buy - меньше/більше попередньої ціни, найменший ордер на продаж sell)
      candle = await getCandleFromBD(queryParams);
    }
    // 1.1 модифікую об'єкт candle
    candle.high = Number(candle.high);
    candle.low = Number(candle.low);

    // console.log("1 СВІЧКА: ", candle._id);
    // console.log(
    //   " _____.openTime >> ",
    //   candle.openTime,
    //   formatDate(candle.openTime),
    //   "_____.closeTime >> ",
    //   candle.closeTime,
    //   formatDate(candle.closeTime)
    // );
    // console.log(" _____.high >> ", candle.high);
    // console.log(" _____.low >> ", candle.low);

    // console.log("2 ПЕРЕНОС З BUY В DONE ");
    // console.log(
    //   "до - виконані (done) >> ",done.length,
    //   "  відкриті (buy) >> ",buy.length
    //   );

    // 2 СПРАЦЮВАННЯ ОРДЕРІВ НА ПРОДАЖ - ПЕРЕНОС З BUY В DONE
    // оновлює масив done (додає завершені угоди), оновлює buy (видаляє завершені угоди) // приймає свічку (об'єкт), масив buy, масив done
    updatesBuyAndDone(candle, buy, done);

    // console.log(
    //   "  виконані (done) >> ",done.length,
    //   "  відкриті (buy) >> ",buy.length
    // );

    // console.log("3 ПЕРЕНОС ORDERS В BUY ");
    // console.log(
    //   "до - виставлені (orders) >> ", Object.keys(orders).length,
    //   "  відкриті (buy) >> ", buy.length, buy
    // );

    // 3 СПРАЦЮВАННЯ ОРДЕРІВ НА КУПІВЛЮ - ПЕРЕНОС ORDERS В BUY
    // Оновлює масив buy (додає відкриті угоди) // приймає свчічку (candle), об'єкт (orders), масив(buy), об'єкт з профітом(params)
    updatesBuy(candle, orders, buy, params);

    // console.log(
    //   "  виставлені (orders) >> ", Object.keys(orders).length,
    //   "  відкриті (buy) >> ", buy.length, buy
    // );

    // console.log("4 ПЕРЕНОС PREORDERS В ORDERS ");
    // console.log(
    //   "до - (preOrders) >> ", Object.keys(preOrders).length,
    //   "  виставлені (orders) >> ", Object.keys(orders).length, orders
    //   );

    // 4 СПРАЦЮВАННЯ ПРЕ-ОРДЕРІВ - ПЕРЕНОС PREORDERS В ORDERS
    // Оновлює масив order (додає ордери на купівлю), оновлює масив preOrders (видаляє перенесені) // приймає свічку і преОрдери
    findNewOrders(candle, preOrders, orders);

    // console.log(
    //   "  (preOrders) >> ", Object.keys(preOrders).length,
    //   "  виставлені (orders) >> ", Object.keys(orders).length, orders
    //   );
    // console.log("5 НАСТУПНІ PREORDERS І ORDERS ");

    // 5 РОЗРАХУВАТИ НАСТУПНІ ОРДЕРИ І ПРЕ-ОРДЕРИ (ТОЧКИ ПОШУКУ В БД)
    // модифікує сети preOrders і orders сходинки шкали між якими знаходиться свічка. ( наступні точки пошуку в бд )
    // приймає шкалу (масив), свічку (об'єкт) і ордери (масив обов'єзково має бути впорядкований від меньшого до більшого)
    findNextOrders(scale, candle, preOrders, orders, params, maxScale, minScale);

    // console.log("  виставлені (preOrders) >> ", Object.keys(preOrders).length, preOrders);
    // console.log("  виставлені (orders) >> ", Object.keys(orders).length, orders);
    // console.log("5 ВИДАЛЯЮ ДУБЛІКАТИ PREORDERS І ORDERS ");

    // 6 ВИДАЛЯЮ ДУБЛІКАТИ ОРДЕРІВ І ПРЕ-ОРДЕРІВ ЯКІ ВЖЕ В BUY (КУПЛЕНІ)
    deleteDuplicates(buy, preOrders, orders);

    // console.log("  виставлені (preOrders) >> ", Object.keys(preOrders).length, preOrders);
    // console.log("  виставлені (orders) >> ", Object.keys(orders).length, orders);

    // 7 ФОРМУЄМ ПАРАМЕТРИ НАСТУПНОГО ЗАПИТУ
    // модифікує queryParams
    updateQueryParams(queryParams, candle, buy, preOrders, orders);

    // 8 ФОРМУЮ ЗВІТ
    buyLength = Math.max( buy.length, buyLength );
  }

  db.close();

  const bank = buyLength * params.orderVolume;
  const totalProfit = params.orderVolume / 100 * params.profit * done.length;
  const executionTime = new Date() - timeStart;

  console.log("Скрипт дійшов до кінця, час виконання мс. ", executionTime);
  console.log("перша свічка ", formatDate(openTimeFirstCandle));
  console.log("остання свічка ", formatDate(candle.openTime));
  console.log("максимально використано $ в моменті ", bank);
  console.log("зароблено $ ", totalProfit);
};
app();
//************************************************************************************************************************************* */
