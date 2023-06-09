
const mongoose = require("mongoose");

const { handleMongooseError } = require("../helpers/index");

// Створення схеми
const candleSchema = new mongoose.Schema(
    // перший аргумент у схемі описує об'єкт
    {
      openTime: {
        type: Number, // тип поля
        required: true, // обов'язкове поле
      },
      open: {
        type: String,
        required: true,
      },
      high: {
        type: String,
        required: true,
      },
      low: {
        type: String,
        required: true,
      },
      close: {
        type: String,
        required: true,
      },
      // Кількість активу, що була куплена або продана протягом інтервалу свічки.
      Volume: {
        type: String,
        required: true,
      },
      closeTime: {
        type: Number,
        required: true,
      },



      // 8
      // - quoteAssetVolume: Це обсяг торгів у котирувальній (базовій) валюті (у даному випадку, валюті USDT) протягом інтервалу часу.
      quoteAssetVolume: {
        type: String,
        required: true,
      },
      // 9 Number of Trades: Кількість угод, що відбулися протягом інтервалу свічки.
      trades: {
        type: Number,
        required: true,
      },
      // 10
      // - takerBuyBaseAssetVolume: Це обсяг базової валюти, купленої учасниками ринку, які брали активну сторону угод, протягом інтервалу часу.
      takerBuyBaseAssetVolume: {
        type: String,
        required: true,
      },
      // 11 takerBuyQuoteAssetVolume: Це обсяг котирувальної валюти, сплачений учасник
      takerBuyQuoteAssetVolume: {
        type: String,
        required: true,
      },
      // 12 Це значення не має певного призначення і часто ігнорується. Часто його використовують для інших технічних або метаданих, які не мають прямого впливу на основні аналізи даних.
      ignore : {
        type: String,
      },
    },
  );

   
// Мідлвара для схеми!
candleSchema.post("save", handleMongooseError); // Коли модель зберігає об'єкт в бд спрацьовує подія "save". Обробник події, буде виконуватися в цей момент.

// Створення моделі на основі схеми // метод mongoose.model створює клас "Contact" який прив'язується до цієї колекції і всередині якого валідація відбувається за цією схемою
const Candle = mongoose.model("btcusdt_year", candleSchema); // Candle - іменник у формі однини, з великої літери, оскільки це клас ( 1-й аргумент - ім'я моделі вказується в однині "candle-year" і має відповідати імені колекції в БД в множині "candle-years". 2-й аргумент - схема

module.exports = Candle;