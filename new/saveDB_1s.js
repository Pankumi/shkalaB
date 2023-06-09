// 2 етап: шукає в бд (хвилинні свічки) свічки у яких різниця "high" і "low" >= 1%, видаляє їх і замінює на секундні в тому ж інтервалі (скачані з binance api)

const mongoose = require("mongoose");
const axios = require("axios");

// Змінні:
const bdCollection = "btcusdt_changes";
const interval = "1s";
const symbol = "BTCUSDT";
const limit = 60;

let startTime = null;
let newStartTime = null;

// Підключення до MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/binance", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

// Створення схеми для моделі даних
const btcusdtSchema = new mongoose.Schema({
  openTime: Number,
  open: String,
  high: String,
  low: String,
  close: String,
  volume: String,
  closeTime: Number,
  quoteAssetVolume: String,
  numberOfTrades: Number,
  takerBuyBaseAssetVolume: String,
  takerBuyQuoteAssetVolume: String,
  ignored: String,
  priceChange: Number,
  openT: Date,
  type: String,
});

// Створення моделі на основі схеми
const BtcusdtMinute = mongoose.model(bdCollection, btcusdtSchema);

// ЗАПИТ
async function getSwings() {
  try {
    // Отримання з локальної БД свічок >= 1%
    const result = await BtcusdtMinute.find({ priceChange: { $gte: 1 } });
    console.log("result.length >>", result.length);

    // перебор свчок з локальної бд
    for (const element of result) {
      // console.log("element >>", element);
      startTime = element.openTime;

      const durationMs = element.closeTime - startTime;

      // Перетворення тривалості в години, хвилини і секунди
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

      // Виведення результату
      console.log(`${hours}:${minutes}:${seconds}`);

      const startDate = new Date(startTime);
      const id = element._id;

      //запит до binance
      const response = await axios.get(
        "https://api.binance.com/api/v3/klines",
        {
          params: {
            symbol,
            interval,
            startTime,
            // endTime: endTime,
            limit,
          },
        }
      );

      const btcusdtData = response.data;
      // console.log("btcusdtData >>", btcusdtData);

      // перетворення отриманого від binance масиву масивів в масив об'єктів для збереження в локальному сховищі
      const transformedData = btcusdtData
        .map((item) => {
          const openTime = item[0];
          const low = item[3];
          const high = item[2];
          const priceChange =
            ((parseFloat(high) - parseFloat(low)) / parseFloat(low)) * 100;

          newStartTime = openTime; // виносим openTime в загальне оточення для контролю в консолі

          // if (priceChange >= 1) {
          //   console.log("!!! priceChange >>", low, high, priceChange);
          // }

          return {
            openTime,
            open: item[1],
            high,
            low,
            close: item[4],
            volume: item[5],
            closeTime: item[6],
            quoteAssetVolume: item[7],
            numberOfTrades: item[8],
            takerBuyBaseAssetVolume: item[9],
            takerBuyQuoteAssetVolume: item[10],
            ignored: item[11],
            priceChange: priceChange,
            openT: new Date(openTime),
            type: interval,
          };
        })
        .filter((item) => item.priceChange !== 0);

      // Збереження нових даних у MongoDB
      if (transformedData.length !== 0) {
        await BtcusdtMinute.insertMany(transformedData)
          .then(() => {
            console.log("add >>>", startDate);
          })
          // Видалення старого елемента з локальної БД
          .then(async () => {
            await BtcusdtMinute.deleteOne({ _id: id });
            console.log(
              "delete >>>",
              id,
              startDate,
              `${hours}:${minutes}:${seconds}`
            );
          });
      }
    }
  } catch (error) {
    console.error("Помилка при отриманні або збереженні даних:", error.message);
  } finally {
    // Закриття підключення до MongoDB
    db.close();
  }
}
// Виклик асинхронної функції
getSwings();


// ДОДАТИ ПОЛЕ до всіх об'єктів колекції
// db.btcusdt_1seconds.updateMany({}, { $set: { type: "1s" } })
// db.btcusdt_1m_cropped.updateMany({}, { $set: { type: "1m" } })

