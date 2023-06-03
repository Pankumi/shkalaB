// 1 етап: скачує з з binance api хвилинні свічки за весь час

const mongoose = require("mongoose");

const { getKlinesData } = require("./getBinApi");

// Змінні для 1хв:
const bdCollection = "btcusdt_1second";
const interval = "1m";
const symbol = "BTCUSDT";
const startTime = 0;
const endTime = null;
const limit = 1000;

// Змінні для 1 сек:
// const bdCollection = "btcusdt_changes";
// const interval = "1s";
// const symbol = "BTCUSDT";
// const limit = 60;

let apiParams = { symbol, interval, startTime, endTime, limit };

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

// Функція для отримання даних з Binance API і збереження їх у MongoDB
async function fetchDataAndSave() {
  try {
    // Очищення колекції перед збереженням нових даних >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> !!!
    // await BtcusdtMinute.deleteMany();

    while (true) {
      const btcusdtData = await getKlinesData(apiParams);

      // перетворення отриманого від binance масиву масивів в масив об'єктів для збереження в локальному сховищі
      const transformedData = btcusdtData
        .map((item) => {
          const openTime = item[0];
          const low = item[3];
          const high = item[2];
          priceChange =
            ((parseFloat(high) - parseFloat(low)) / parseFloat(low)) * 100;

          if (priceChange >= 1) {
            console.log("!!! priceChange >>", low, high, priceChange);
          }

          return {
            openTime,
            open: item[1],
            high,
            low,
            close: item[4],
            volume: item[5],
            closeTime: item[6],
            quoteAssetVolume: item[7], // Объем котируемых активов
            numberOfTrades: item[8],
            takerBuyBaseAssetVolume: item[9],
            takerBuyQuoteAssetVolume: item[10],
            ignored: item[11],
            priceChange: priceChange,
            openT: new Date(openTime),
            type: apiParams.interval,
          };
        })
        .filter((item) => item.priceChange !== 0); // залишаєє лише ті свічки які змінювались

      if(transformedData.length !== 0 ){
        // Збереження нових даних у MongoDB
        await BtcusdtMinute.insertMany(transformedData);
        console.log("add data >>>", new Date(startTime));
      }

      if (btcusdtData.length < apiParams.limit) {
        // Вийти з циклу, якщо отримано менше записів, ніж обмеження
        break;
      }

      // Оновити початковий час для наступного запиту
      apiParams.startTime = btcusdtData[btcusdtData.length - 1][6] + 1;
    }

    console.log("Дані успішно збережено у базі даних.");
  } catch (error) {
    console.error("Помилка при збереженні даних:", error.message);
  } finally {
    // Закриття підключення до MongoDB
    db.close();
  }
}

// Виклик функції для отримання даних та збереження їх у MongoDB
fetchDataAndSave();

// https://www.binance.com/ru/landing/data
// ОПИС ПОЛІВ
// open_time
// Время открытия K-line в формате времени Unix
// open
// Цена открытия
// high
// Макс. цена
// low
// Мин. цена
// close
// Цена закрытия
// volume
// Объем
// close_time
// Время закрытия K-line в формате времени Unix
// quote_volume
// Объем котируемых активов
// count
// Количество сделок
// taker_buy_volume
// Объем котируемых активов тейкера в течение этого периода
// taker_buy_quote_volume
// Объем базовых активов тейкера в течение этого периода
// ignore
// Игнорировать
