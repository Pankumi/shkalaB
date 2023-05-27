
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
const { getFirstCandle } =require("./mongo_db"); // схема локальної бд


// початкові зн. шкали: мін. ціна, макс. ціна, крок %:
const scaleStart = 1000;
const scaleStep = 1;
const scaleEnd = 100000;
// дата початку і закінчення аналізу
const dataStart = "2017-05-01";
const dataEnd = "2017-05-02";

// створюю шкалу
const scale = createScaleArray(scaleStart,scaleEnd,scaleStep);
// console.log(scale);

// Підключення до MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/binance", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

// отримати першу свічку з проміжку
const startTime = new Date(dataStart).getTime();
// const endTime = new Date(dataEnd).getTime();
console.log( "app >>", getFirstCandle(startTime) );



