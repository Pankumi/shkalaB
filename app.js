
// + створюю шкалу
// запит на першу транзакцію
// визначаю можливі точоки купівлі (найблищої верхньої, найблищої нижньої,)
  // пошук в БД найблищої точоки купівлі (найблищої верхньої або найблищої нижньої,)
  // сбереження
  // пошук в БД точки виходу ( bell )
  // створ. об'єкту ( timeBay,bay,timeSell,sell )


const mongoose = require("mongoose");

const createScaleArray = require("./scale"); // створ. шкали
const getBinanceData = require("./request"); // binance api
const { getFirstCandle, getCandle } = require("./mongo_db"); // схема локальної бд


// початкові зн. шкали: мін. ціна, макс. ціна, крок %:
const scaleStart = 1000;
const scaleStep = 1;
const scaleEnd = 100000;
// дата початку і закінчення аналізу
const dataStart = "2017-05-01";
const dataEnd = "2023-05-02";

// створюю шкалу
const scale = createScaleArray(scaleStart,scaleEnd,scaleStep);
// console.log(scale);

// Підключення до MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/binance", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

// ***********
function filterArrayByRange(arr, obj) {
  // Знаходить перетини свічки зі шкалою
  // Приймає шкалу (масив) і свічку (об'єкт)
  const { high, low } = obj;
  const filteredArray = arr.filter((value) => {
    value >= low && value <= high;
  });
  return filteredArray;
}

// ***********
function findTopAndDown(arr, value) {
  // Повертає сходинки шкали { top, down } між якими знаходиться low свічки ( наступні buy )( наступні точки пошуку в бд )
  // Якщо value більше за всі значення у arr, top буде null, а down буде максимальним значенням у arr.
  // Приймає шкалу і low свічки
  let top = null;
  let down = null;

  if (value > Math.max(...arr)) {
    down = Math.max(...arr);
    console.log(
      `low свічки ${candle.low} більше шкали. Час відкриття ${new Date(
        candle.openTime
      )}, закриття ${new Date(
        candle.closeTime
      )} Логіка додатку поки не враховує цей сценарій`
    );
    // TODO: логіка додатку поки не враховує цей сценарій
  } else if (value < Math.min(...arr)) {
    top = Math.min(...arr);
    console.log(
      `low свічки ${candle.low} маньше шкали. Час відкриття ${new Date(
        candle.openTime
      )}, закриття ${new Date(
        candle.closeTime
      )} Логіка додатку поки не враховує цей сценарій`
    );
    // TODO: логіка додатку поки не враховує цей сценарій
  } else {
    arr.sort((a, b) => a - b);

    for (let i = 0; i < arr.length; i++) {
      if (arr[i] <= value && arr[i + 1] >= value) {
        top = arr[i + 1];
        down = arr[i];
        break;
      }
    }
  }

  return { top, down };
}

// **********
const dataStartMs = new Date(dataStart).getTime();
const dataEndMs = new Date(dataEnd).getTime();

const buy = {}; // масив для сбереження ордерів на купівлю

// все необхідне для запиту за наступною свічкою
const queryParams = {
  dataStartMs: dataStartMs,
  dataEndMs: dataEndMs,
  high: null,
  low: null,
  buy: null,
}

getFirstCandle(dataStartMs)
// отримуе першу свічку з проміжку
// приймає час початку інтервалу в мілесекундах
  .then( firstCandle => {
    console.log("firstCandle >>", firstCandle);
    const filteredScale = filterArrayByRange(scale, firstCandle); // Знаходить перетини свічки зі шкалою
    
    if(filteredScale.length === 0){
      // TODO: якщо свічка між кроків шкали
      console.log("TODO: якщо свічка між кроків шкали filteredScale >>", filteredScale);

      const topDownStep = findTopAndDown(scale, firstCandle.low); // Повертає сходинки шкали { top, down } між якими знаходиться low свічки ( наступні buy )( наступні точки пошуку в бд )
      queryParams.high = topDownStep.top;
      queryParams.low = topDownStep.down
      console.log("queryParams >>", queryParams);

      getCandle(queryParams)
      // повертає найближчу наступну свічку яка або пересікає сходинку шкали або пересікає ордер на продаж
      // приймає масив з: часом початку/кінця періоду, 2 найближчі сходинки шкали (buy): меньше/більше попередньої ціни, найменший ордер на продаж sell
      .then( candle => {
        console.log("candle >>", candle);
      })
    }

    if(filteredScale.length > 0){
      // TODO: якщо свічка перетинає 1 або декілька кроків шкали
      console.log("TODO: якщо свічка перетинає 1 або декілька кроків шкали filteredScale >>", filteredScale);
    }
  })
  .catch(error => {
    console.error("Помилка:", error);
  });




