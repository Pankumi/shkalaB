const createScaleArray = require("./scale"); // створ. шкали

// початкові зн. шкали: мін. ціна, макс. ціна, крок %:
const scaleStart = 1000;
const scaleStep = 1;
const scaleEnd = 100000;
// дата початку і закінчення аналізу
const dataStart = "2017-05-01";
const dataEnd = "2017-05-02";

// створюю шкалу
const scale = createScaleArray(scaleStart, scaleEnd, scaleStep);
// console.log(scale);

const candle = {
  openTime: 1502943420000,
  open: "4261.48000000",
  high: "4264.88000000",
  low: "4261.48000000",
  close: "4264.88000000",
  volume: "0.07545500",
  closeTime: 1502943479999,
  quoteAssetVolume: "321.60333640",
  numberOfTrades: 2,
  takerBuyBaseAssetVolume: "0.07545500",
  takerBuyQuoteAssetVolume: "321.60333640",
  ignored: "0",
  priceChange: 0.07978448801825999,
  openT: "2017-08-17T04:17:00.000Z",
  __v: 0,
};

// ***********
function filterArrayByRange(arr, obj) {
  // Повертає масив цін шкали що між high і low свічки
  // Приймає шкалу (масив) і свічку (об'єкт)
  const { high, low } = obj;
  const filteredArray = arr.filter((value) => {
    value >= low && value <= high;
  });
  return filteredArray;
}
const filteredScale = filterArrayByRange(scale, candle);

// ***********
if (filteredScale.length === 0) {
  console.log(filteredScale);
}

// ***********
function findTopAndDown(arr, value) {
  // Повертає сходинки шкали { top, down } між якими знаходиться low свічки
  // Якщо value більше за всі значення у arr, top буде null, а down буде максимальним значенням у arr.
  // Приймає шкалу і low свічки
  let top = null;
  let down = null;

  if (value > Math.max(...arr)) {
    down = Math.max(...arr);
    console.log(
      `low свічки ${candle.low} більше шкали. Час відкриття ${new Date(
        candle.openTime
      )}, закриття ${new Date(
        candle.closeTime
      )} Логіка додатку поки не враховує цей сценарій`
    );
    // TODO: логіка додатку поки не враховує цей сценарій
  } else if (value < Math.min(...arr)) {
    top = Math.min(...arr);
    console.log(
      `low свічки ${candle.low} маньше шкали. Час відкриття ${new Date(
        candle.openTime
      )}, закриття ${new Date(
        candle.closeTime
      )} Логіка додатку поки не враховує цей сценарій`
    );
    // TODO: логіка додатку поки не враховує цей сценарій
  } else {
    arr.sort((a, b) => a - b);

    for (let i = 0; i < arr.length; i++) {
      if (arr[i] <= value && arr[i + 1] >= value) {
        top = arr[i + 1];
        down = arr[i];
        break;
      }
    }
  }

  return { top, down };
}
const topDownStep = findTopAndDown(scale, candle.low);

// ***********
function tenLevelsBuy(arr, value, levels = 10) {
    // Повертає 10 рівнів для ордерів на покупку ( 10 значень шкали які <= low свічки )
    // приймає шкалу і low свічки
    const result = [];
    let count = 0;
    
    for (let i = arr.length-1; i >= 0; i--) {
      if (arr[i] <= value) {
        result.push(arr[i]);
        count++;
        
        if (count === levels) {
          break;
        }
      }
    }
    
    return result;
  }

const levelsBuy = tenLevelsBuy(scale, candle.low);

console.log("topDownStep >>", result);




