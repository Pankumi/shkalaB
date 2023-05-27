// 1 етап: скачує з з binance api хвилинні свічки за весь час

const axios = require("axios");
const mongoose = require("mongoose");

// Змінні:
const bdCollection = "btcusdt_1second";
const interval = "1m";
const symbol = "BTCUSDT";
let startTime = 0;
const limit = 1000;

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
});

// Створення моделі на основі схеми
const BtcusdtMinute = mongoose.model(bdCollection, btcusdtSchema);

// Функція для отримання даних з Binance API і збереження їх у MongoDB
async function fetchDataAndSave() {
  try {
    // Очищення колекції перед збереженням нових даних
    await BtcusdtMinute.deleteMany();

    while (true) {
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

      // перетворення отриманого від binance масиву масивів в масив об'єктів для збереження в локальному сховищі
      const transformedData = btcusdtData.map((item) => {
        const openTime = item[0];
        const low = item[3];
        const high = item[2];
        priceChange = (parseFloat(high) - parseFloat (low)) / parseFloat(low) * 100 ;

        if(priceChange >= 1){
          console.log("!!! priceChange >>", low, high, priceChange);
        };

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
        };
      }).filter((item) => item.priceChange !== 0);

      if(transformedData.length !== 0 ){
        // Збереження нових даних у MongoDB
        await BtcusdtMinute.insertMany(transformedData);
        console.log("add data >>>", new Date(startTime));
      }
      

      if (btcusdtData.length < limit) {
        // Вийти з циклу, якщо отримано менше записів, ніж обмеження
        break;
      }

      // Оновити початковий час для наступного запиту
      startTime = btcusdtData[btcusdtData.length - 1][6] + 1;
    }

    console.log("Дані успішно збережено у базі даних.");
  } catch (error) {
    console.error("Помилка при отриманні або збереженні даних:", error.message);
  } finally {
    // Закриття підключення до MongoDB
    db.close();
  }
}

// Виклик функції для отримання даних та збереження їх у MongoDB
fetchDataAndSave();
