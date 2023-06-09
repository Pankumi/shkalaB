const mathjs = require("mathjs");

// 0 ***********
// Створює шкалу buy
// Приймає початкове значення, максимальне значення, розмір кроку у відсотках
function createScaleArray(params) {
  const { scaleStart, scaleEnd, scaleStep } = params;
  const scale = [];
  let currentValue = scaleStart;

  while (currentValue <= scaleEnd) {
    scale.push(mathjs.round(currentValue, 8));
    currentValue = mathjs.evaluate(
      `${currentValue} + (${currentValue} * ${scaleStep / 100})`
    );
  }

  return scale;
}

// 2 ***********
// оновлює масив done (додає завершені угоди), оновлює buy (видаляє завершені угоди) // приймає масив buy, свічку (об'єкт), масив done
function updatesBuyAndDone(buy, candle, done) {
  const { high, low, openTime } = candle;

  for (let i = buy.length - 1; i >= 0; i--) {
    // перевіряє чи поле priceSell кожного елемента buy потрапляє в межі свічки
    if (buy[i].priceSell >= low && buy[i].priceSell <= high) {
      // додаю час закриття угоди і додаю угоду в масив done
      buy[i].openTimeSell = openTime;
      console.log("2 ЗАКРИТО ордер >> ", buy[i]);
      done.push(buy[i]);

      // видаляю з buy елемент уже виконаної угоди
      buy.splice(i, 1);
    }
  }
}

// 3 ***********
// оновлює масив buy // приймає шкалу (масив), свічку (об'єкт), параметри (об'єкт), buy (масив)
function updatesBuy(scale, candle, params, buy) {
  const { high, low, openTime } = candle;
  const { profit } = params;
  // const result = [];

  for (let el of scale) {
    // перевіряє перетин елемента шкали зі свічкою

    if ( high >= el && el >= low) {
      console.log("3 зі свічкою перетинається сходинка >", el);
      
      // перевіряє відсутність в масиві buy елементу з такою ж ціною перетину
      let isDuplicate = false;
      for (let i = 0; i < buy.length; i++) {
        if (buy[i].priceBuy === el) {
          isDuplicate = true;
          console.log("3 Вже є ордер >", el);
          break;
        }
      }
      // Якщо в buy елементу з такою ж ціною не знайдено додаю в buy новий елемент
      if (!isDuplicate) {
        buy.push({
          priceBuy: el,
          openTimeBuy: openTime,
          priceSell: mathjs.round(el * (1 + profit / 100), 8),
        });
        console.log("3 ДОДАНО ордер >> ", 
        {
          priceBuy: el,
          openTimeBuy: openTime,
          priceSell: mathjs.round(el * (1 + profit / 100), 8),
        });
      }
    }
  }
}

// 4 ***********
// Повертає сходинки шкали { top, down } між якими знаходиться свічка. ( наступні buy )( наступні точки пошуку в бд )
// приймає шкалу (масив) і свічку (об'єкт). (масив обов'єзково має бути впорядкований від меньшого до більшого)
// Якщо value більше за всі значення у scale, top буде null, а down буде максимальним значенням у scale.
function findTopAndDown(scale, candle) {
  const { low, high } = candle;
  let highStep = null;
  let lowStep = null;

  // Якщо свічка над шкалою значення присвоюється лише lowStep
  if (low > Math.max(...scale)) {
    lowStep = Math.max(...scale);
    console.log(
      `low свічки ${candle.low} більше шкали. Час відкриття ${new Date(
        candle.openTime
      )}`
    );
    return { highStep, lowStep };
  }

  // Якщо свічка під шкалою значення присвоюється лише highStep
  if (high < Math.min(...scale)) {
    highStep = Math.min(...scale);
    console.log(
      `low свічки ${candle.low} маньше шкали. Час відкриття ${new Date(
        candle.openTime
      )}`
    );
    return { highStep, lowStep };
  }

  // Якщо свічка всередині шкалуи:
  // знаходим 1 точку шкали вищє свічки
  for (let i = 0; i < scale.length; i++) {
    if (scale[i] > high) {
      highStep = scale[i];
      break;
    }
  }

  // знаходим 1 точку шкали нищє свічки
  for (let i = scale.length - 1; i >= 0; i--) {
    if (scale[i] < low) {
      lowStep = scale[i];
      break;
    }
  }

  return { highStep, lowStep };
}

// ***********

module.exports = {
  createScaleArray,
  updatesBuyAndDone,
  updatesBuy,
  findTopAndDown,
};
