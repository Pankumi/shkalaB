const mongoose = require("mongoose");

const {
  createScaleArray,
  filterArrayByRange,
  filterScaleByCandle,
  findTopAndDown,
} = require("./fuctions"); // створ. шкали
const getBinanceData = require("./request"); // binance api
const { getFirstCandle, getCandle } = require("./mongo_db"); // схема локальної бд
const { async } = require("regenerator-runtime");

params = {
  // початкові зн. шкали: мін. ціна, макс. ціна, крок %:
  scaleStart: 1000,
  scaleStep: 1,
  scaleEnd: 100000,
  // дата початку і закінчення аналізу
  dataStart: "2017-05-01",
  dataEnd: "2023-05-02",
};

// **********
const buy = {};
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
const scale = createScaleArray(params);

// **********
// Підключення до MongoDB
// TODO: дописати нормальну логіку взаємодії з бд .then(result => {}).catch(error => {}).finally(() => {})
mongoose.connect("mongodb://127.0.0.1:27017/binance", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

const app = async () => {
  console.log("start candle >> ", candle);
  console.log(" start buy >> ", buy);
  console.log(" start queryParams >> ", queryParams);

  // 1 ЗАПИТ В БД ЗА СВІЧКОЮ
  if( JSON.stringify(candle) === '{}' ) {
    // Повертає першу свічку з проміжку // приймає об'їкт параметрів з часом початку відліку в мілесекундах
    candle = await getFirstCandle(queryParams);
    console.log("1 candle >> ", candle);
  } else {
    // Повертає наступну найближчу свічку яка або пересікає сходинку шкали або пересікає ордер на продаж
    // приймає об'їкт (час початку/кінця періоду, 2 найближчі сходинки шкали buy - меньше/більше попередньої ціни, найменший ордер на продаж sell)
    candle = await getCandle(queryParams);
    console.log("1 candle >> ", candle);
  }

  // TODO: 2 ПЕРЕВІРКА СВІЧКИ НА ПЕРЕТИН З ТОЧКАМИ ПРОДАЖУ ( зробити коли буде точка продажу )

  // 3 ПЕРЕВІРКА СВІЧКИ НА ПЕРЕТИН З ТОЧКАМИ КУПІВЛІ
  // Повертає масив перетинів свічки зі шкалою // приймає шкалу (масив) i свчку (об'єкт)
  const newBuy = filterScaleByCandle(scale, candle);
  console.log(" 3 newBuy >> ", newBuy);

  // Якщо свічка має перетини з точками купівлі оновлюєм об'єкт buy
  if ( !JSON.stringify(newBuy) === "{}" ){
    buy = { ...newBuy, ...buy };
    console.log(" 3 buy >> ", buy);

    //TODO: розрахувати наступні точки пошуку
  }

  // 4 РОЗРАХУВАТИ НАСТУПНІ ТОЧКИ ПОШУКУ В БД
    // Повертає об'єкт { highStep, lowStep } сходинки шкали між якими знаходиться свічка. ( наступні buy )( наступні точки пошуку в бд )
    // приймає шкалу (масив) і свічку (об'єкт)
    const nextStepBuy = findTopAndDown(scale, candle);
    console.log(" 4 nextStepBuy >> ", nextStepBuy);
    queryParams = { ...queryParams, ...nextStepBuy };
    console.log(" 4 queryParams >> ", queryParams);


  db.close();
  console.log("Скрипт дійшов до кінця");
};
app();


//************************************************************************************************************************************* */
