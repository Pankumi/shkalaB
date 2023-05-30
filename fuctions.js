const math = require('mathjs');

// ***********
// Створює шкалу мочки buy
// Приймає початкове значення, максимальне значення, розмір кроку у відсотках
function createScaleArray(params) {
  const {scaleStart, scaleEnd, scaleStep} = params
  const scale = [];
  let currentValue = scaleStart;

  while (currentValue <= scaleEnd) {
    scale.push( math.round(currentValue, 8) );
    currentValue = math.evaluate(`${currentValue} + (${currentValue} * ${scaleStep / 100})`);
  }

  return scale;
}

// ***********
  // Повертає масив, перетини свічки зі шкалою
  // Приймає шкалу (масив) і свічку (об'єкт)
function filterArrayByRange(arr, obj) {
  const { high, low } = obj;

  const filteredArray = arr.filter((value) => {
    value >= low && value <= high;
  });
  return filteredArray;
}

function filterScaleByCandle(arr, obj){
  const { high, low, openTime } = obj;
  const result = {};
  for(let el of arr){
    if( el >= low && el <= high){
      result[el] = openTime
    }
  }
  return result
}

// ***********
// Повертає сходинки шкали { top, down } між якими знаходиться свічка. ( наступні buy )( наступні точки пошуку в бд )
// приймає шкалу (масив) і свічку (об'єкт)
// Якщо value більше за всі значення у scale, top буде null, а down буде максимальним значенням у scale.
function findTopAndDown(scale, candle) {
  const { low, high } = candle;
  let highStep = null;
  let lowStep = null;

  // Якщо свічка над шкалою значення присвоюється лише lowStep
  if (low > Math.max(...scale)) {
    lowStep = Math.max(...scale);
    console.log( `low свічки ${candle.low} більше шкали. Час відкриття ${new Date(candle.openTime)}`);
    return { highStep, lowStep };
  } 
  
  // Якщо свічка під шкалою значення присвоюється лише highStep
  if (high < Math.min(...scale)) {
    highStep = Math.min(...scale);
    console.log(`low свічки ${candle.low} маньше шкали. Час відкриття ${new Date(candle.openTime)}`);
    return { highStep, lowStep };
  }

  // Якщо свічка всередині шкалуи знаходим точки шкали вищє свічки і ницє свічки 
  // знаходим точки шкали вищє свічки
  for ( let i = 0; i < scale.length; i++ ){
    if(scale[i] > high) {
      highStep = scale[i];
      break
    }
  };

  // знаходим точки шкали нищє свічки
  for ( let i = scale.length; i > 0; i-- ){
    if(scale[i] < low) {
      lowStep = scale[i];
      break
    }
  }

  return { highStep, lowStep };
}

// ***********



module.exports = {
  createScaleArray,
  filterArrayByRange,
  filterScaleByCandle,
  findTopAndDown,


};