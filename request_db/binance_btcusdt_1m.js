// модель локальної бд

const mongoose = require("mongoose");

// Змінні:
const bdCollection = "btcusdt_changes";
// const bdCollection = "btcusdt_1m";

// // Підключення до MongoDB
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
}, { collection: bdCollection });

// Створення моделі на основі схеми
const BtcusdtModel = mongoose.model('', btcusdtSchema);

// ************
// повертає першу свічку з проміжку
// приймає час початку інтервалу в мілесекундах
async function getFirstCandleFromBD(queryParams) {
  const {dataStartMs} = queryParams;
  try {
    const document = await BtcusdtModel.findOne({
      openTime: { $gte: dataStartMs },
    })
      .sort({ openTime: 1 }) // Сортування за зростанням
      .exec();
    
    // console.log("document", document);
    return document.toObject();

  } catch (err) {
    console.error("Помилка запиту в бд:", err);
  }
}
// const date = new Date("2022-05-01").getTime();
// console.log("date", date);
// getFirstCandleFromBD(date);


// ************
// повертає найближчу наступну свічку яка або пересікає сходинку шкали або пересікає ордер на продаж
// приймає масив з: часом початку/кінця періоду, 2 найближчі сходинки шкали (buy): меньше/більше попередньої ціни, найменший ордер на продаж sell
async function getCandleFromBD(queryParams) {
  const { dataStartMs, dataEndMs, highStep, lowStep, lowSell } = queryParams;
  try {
    const document = await BtcusdtModel.findOne({
      openTime: { $gte: dataStartMs },
      closeTime: { $lte: dataEndMs },
      $or: [
        { high: { $gt: String(lowSell) } },
        { low: { $lt: String(lowStep) } },
        { high: { $gte: String(highStep) } },
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

// ************
// повертає 1000 свічок
// приймає час початку інтервалу в мілесекундах і кількість свічок в пачці
async function getThousandCandlesFromDB(queryParams) {
  const {dataStartMs, dataEndMs, limit } = queryParams;
  try {
    const documents = await BtcusdtModel.find({
      openTime: { $gte: dataStartMs },
      closeTime: { $lte: dataEndMs },
    })
      .sort({ openTime: 1 }) // Сортування за зростанням
      .limit(limit) // Обмеження кількості результатів до 1000
      .exec();
    
    // console.log("documents", documents);
    return documents;

  } catch (err) {
    console.error("Помилка запиту в бд:", err);
  }
}

// const date = new Date("2016-05-01").getTime();
// console.log("date", date);
// getThousandCandlesFromDB({ dataStartMs: date, limit: 1000 });


module.exports = {
  getFirstCandleFromBD,
  getCandleFromBD,
  getThousandCandlesFromDB,
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

  // db.btcusdt_1m.createIndex({ openTime: 1, low: 1, high: 1, low: 1 })

