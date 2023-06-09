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
  type: String,
});

// Створення моделі на основі схеми
const BtcusdtModel = mongoose.model(bdCollection, btcusdtSchema);

// ************
// повертає першу свічку з проміжку
// приймає час початку інтервалу в мілесекундах
async function getFirstCandle(queryParams) {
  const {dataStartMs} = queryParams;
  try {
    const document = await BtcusdtModel.findOne({
      openTime: { $gte: dataStartMs },
    })
      .sort({ openTime: 1 }) // Сортування за зростанням
      .exec();

    return document.toObject();
  } catch (error) {
    console.error("Помилка запиту в бд:", error);
  }
}
// const date = new Date("2022-05-01").getTime();
// console.log("date", date);
// getFirstCandle(date);


// ************
// повертає найближчу наступну свічку яка або пересікає сходинку шкали або пересікає ордер на продаж
// приймає масив з: часом початку/кінця періоду, 2 найближчі сходинки шкали (buy): меньше/більше попередньої ціни, найменший ордер на продаж sell
async function getCandle(queryParams) {
  const { dataStartMs, dataEndMs, highStep, lowStep, lowSell } = queryParams;
  try {
    const document = await BtcusdtModel.findOne({
      openTime: { $gte: dataStartMs },
      closeTime: { $lte: dataEndMs },
      $or: [
        { high: { $gte: String(highStep) } },
        { high: { $gte: String(lowSell) } },
        { low: { $lte: String(lowStep) } },
      ],
    })
      .sort({ openTime: 1 })
      .exec()
      // console.log("0 !!!!!!!!!!", typeof document);
      return document.toObject();

  } catch (err) {
        console.error("Помилка запиту в бд:", err);
  }
}

module.exports = {
  getFirstCandle,
  getCandle,
};


// ШАБЛОНИ ПОШУКУ:
// {
//   openTime: { $gte: 1493596800000 },
//   closeTime: { $lte: 1682985600000 },
//   $or: [
//     { high: { $gte: '4360.77139107' } },
//     { high: { $gte: 4360.77139107 } },
//     { low: { $lte: '4274.84696703' } },
//   ],
// }

// {
//   openTime: { $gte: 1502946300000 },
//   closeTime: { $lte: 1502947500 },
// }

// ІНДЕКСУВАННЯ БД
  // db.btcusdt_changes.createIndex({ openTime: 1, closeTime: 1 })
  // db.btcusdt_changes.createIndex({ high: 1, low: 1 })
  // db.btcusdt_changes.createIndex({ openTime: 1, high: 1 })
  // db.btcusdt_changes.createIndex({ openTime: 1, low: 1 })

  // db.btcusdt_changes.createIndex({ openTime: 1, low: 1, high: 1, low: 1 })

