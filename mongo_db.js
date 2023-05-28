// модель локальної бд

const mongoose = require("mongoose");

// Змінні:
const bdCollection = "btcusdt_changes";

// Підключення до MongoDB
// mongoose.connect("mongodb://127.0.0.1:27017/binance", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// const db = mongoose.connection;

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
const BtcusdtModel = mongoose.model(bdCollection, btcusdtSchema);

// //Пошук документу з вказаною датою або найближчою наступною

// async function getFirstCandle (startTime){
//   await BtcusdtModel.findOne({ openTime: { $gte: startTime } })
//     .sort({ openTime: 1 }) // Сортування за зростанням
//     .exec()
//     .then((document) => {
//       if (document) {
//         return document
//       } else {
//         console.log("Документ не знайдено");
//       }
//     })
//     .catch((error) => {
//       console.error("Помилка запиту в бд:", error);
//     });
// };

async function getFirstCandle(startTime) {
  // отримуе першу свічку з проміжку
  // приймає час початку інтервалу в мілесекундах
  try {
    const document = await BtcusdtModel.findOne({
      openTime: { $gte: startTime },
    })
      .sort({ openTime: 1 }) // Сортування за зростанням
      .exec();

    return document; // Повертаємо результат запиту
  } catch (error) {
    console.error("Помилка запиту в бд:", error);
  }
}
// const date = new Date("2022-05-01").getTime();
// console.log("date", date);
// getFirstCandle(date);

// ************
async function getCandle(queryParams) {
  // повертає найближчу наступну свічку яка або пересікає сходинку шкали або пересікає ордер на продаж
  // приймає масив з: часом початку/кінця періоду, 2 найближчі сходинки шкали (buy): меньше/більше попередньої ціни, найменший ордер на продаж sell
  const { dataStartMs, dataEndMs, high, low, buy } = queryParams;
  try {
    const document = await BtcusdtModel.findOne({
      openTime: { $gte: dataStartMs },
      closeTime: { $lte: dataEndMs },
      $or: [
        { high: { $gte: high } },
        { high: { $gte: buy } },
        { low: { $lte: low } },
      ],
    })
      .sort({ openTime: 1 })
      .exec()
      
      // console.log("Код для роботи з документом >>", document);
      return document

  } catch (err) {
        console.error("Помилка запиту в бд:", err);
  }
}




module.exports = {
  getFirstCandle,
  getCandle,
};
