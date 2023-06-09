const mongoose = require("mongoose");

const { getThousandCandlesFromDB } = require("./request_db/binance_btcusdt_1m"); // локальна бд
const { formatDate } = require("./fuctions");

// **********
const params = {
  // дата початку і закінчення аналізу
  dataStart: "2022-01-01",
  dataEnd: "2023-01-01",
  limit: 1000,
};

const queryParams = {
  dataStartMs: new Date(params.dataStart).getTime(),
  dataEndMs: new Date(params.dataEnd).getTime(),
  limit: params.limit,
};

let previousСandle = {};
const bedCandle = {
  calc: 0,
  elements: [],
};

// **********
// Підключення до MongoDB
// TODO: дописати нормальну логіку взаємодії з бд .then(result => {}).catch(error => {}).finally(() => {})
mongoose.connect("mongodb://127.0.0.1:27017/binance", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

(async () => {
  const timeStart = new Date();
  console.log("Старт >>", timeStart);

  for (let i = 1; i<2 ; i++) {   // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> 
  // while (true) {
    candleArr = await getThousandCandlesFromDB(queryParams);
    console.log("Запит >>", i);
    console.log("Відповідь, довжина масиву",candleArr.length);

    for (const candle of candleArr) {

      if (previousСandle.close != candle.open) {
        const difference = previousСandle.close - candle.open;
        bedCandle.calc += 1;

        const el = {
          number: bedCandle.calc,

          id_close: previousСandle._id,
          time_close: formatDate(previousСandle.openTime),
          price_close: previousСandle.close,

          id_open: candle._id,
          time_open: formatDate(candle.openTime),
          price_open: candle.open,

          difference,
        };
        bedCandle.elements.push(el);

        console.log(
          ">> КОСЯЧНА #>> ",
          bedCandle.calc,
          " різниця закриття/відкриття ",
          difference
        );
      }
      // оновлення bedCandle
      previousСandle = candle;
    }

    if (candleArr.length < params.limit) {
      break;
    }
  }
  db.close();
  console.log("Скрипт дійшов до кінця");
  console.log("timeEnd >>>", new Date() - timeStart);
  console.log(bedCandle);
})();
