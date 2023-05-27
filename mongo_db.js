// модель локальної бд

const mongoose = require("mongoose");

// Змінні:
const bdCollection = "btcusdt_changes";

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
});

// Створення моделі на основі схеми
const BtcusdtModel = mongoose.model(bdCollection, btcusdtSchema);

// Пошук документу з вказаною датою або найближчою наступною
async function getFirstCandle (startTime){
  await BtcusdtModel.findOne({ openTime: { $gte: startTime } })
    .sort({ openTime: 1 }) // Сортування за зростанням
    .exec()
    .then((document) => {
      if (document) {
        console.log("Знайдений документ:", document);
        return document
      } else {
        console.log("Документ не знайдено");
        return null
      }
    })
    .catch((error) => {
      console.error("Помилка запиту в бд:", error);
    });
};

module.exports = {getFirstCandle};
