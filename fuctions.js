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
// оновлює масив done (додає завершені угоди), оновлює buy (видаляє завершені угоди) // приймає свічку (об'єкт), масив buy, масив done
function updatesBuyAndDone(candle, buy, done) {
  const { high, openTime } = candle;

  for (let i = buy.length - 1; i >= 0; i--) {
    // перевіряє чи поле priceSell кожного елемента buy меньше за максимум свічки
    if (buy[i].priceSell < high) {
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
// оновлює масив buy // приймає: шкалу (масив), свічку (об'єкт), попередню свічку (об'єкт), об'єкт з параметром profit, buy (масив)
function updatesBuy2(scale, candle, previousCandle, params, buy) {
  console.log("3 <<<<<<<<<<<<<< Candle >>>>>>>>>>>>>>>");
  console.log("3 previousCandle >", previousCandle);
  console.log("3 Candle >", candle);
  console.log("3 <<<<<<<<<<<<<< Candle >>>>>>>>>>>>>>>");
  const { low, openTime } = candle;
  const { profit } = params;
  // const result = [];

  for (let el of scale) {
    // перевіряє перетин елемента шкали зі свічкою

    if (previousCandle.high >= el && el >= low) {
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
        const newBuyEl = {
          priceBuy: el,
          openTimeBuy: openTime,
          priceSell: mathjs.round(el * (1 + profit / 100), 8),
        };
        buy.push(newBuyEl);
        console.log("3 ДОДАНО ордер >> ", newBuyEl);
      }
    }
  }
}

// 3 ***********
// Оновлює масив buy (додає відкриті угоди) // свчічку (candle), сет (orders), масив(buy), об'єкт з профітом(params)
function updatesBuy(candle, orders, buy, params){
  const { low, high, openTime } = candle;
  const { profit } = params;

  for (const el of orders) {
    // перевіряє перетин ордерів зі свічкою
    if (low <= el && el <= high) {

      // модифікую buy (додаю нові ел):
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
        const newBuyEl = {
          priceBuy: el,
          openTimeBuy: openTime,
          priceSell: mathjs.round(el * (1 + profit / 100), 8),
        };
        buy.push(newBuyEl);
        console.log("3 ДОДАНО ордер >> ", newBuyEl);
      }

      // модифікую сет преОрдерів (видаляю з orders перенесені до buy ордери)
      orders.delete(el);
    }
  }
}

// 4 ***********
// модифікує сет ордерів і сет преОрдерів
// Приймає свічку, сет преОрдерів, сет ордерів
function findNewOrders(candle, preOrders, orders) {
  const { low, high } = candle;
  // в цьому випадку <= доречно так як для виставлення ордеру достатньо щоб ціна торкнулась позначки
  for (const el of preOrders) {
    if (low <= el && el <= high) {
      // модифікую сет ордерів (додаю нові)
      orders.add(el);
      // модифікую сет преОрдерів (видаляю з preOrders перенесені до orders)
      preOrders.delete(el);
    }
  }
}

// 5 ***********
// Повертає сходинки шкали { top, down } між якими знаходиться свічка. ( наступні buy )( наступні точки пошуку в бд )
// приймає шкалу (масив) і свічку (об'єкт). (масив обов'єзково має бути впорядкований від меньшого до більшого)
// Якщо value більше за всі значення у scale, top буде null, а down буде максимальним значенням у scale.
function findTopAndDown(scale, candle) {
  const { low, high, openTime, closeTime } = candle;
  let preOrder = null;
  let down = null;
  const dataStartMs = closeTime + 1;
  // console.log(" 4 candle !!!", candle);

  // Якщо свічка над шкалою значення присвоюється лише down
  if (low > Math.max(...scale)) {
    down = Math.max(...scale);
    console.log(
      `low свічки ${candle.low} більше шкали. Відкриття ${formatDate(openTime)}`
    );
    return { preOrder, down };
  }

  // Якщо свічка під шкалою значення присвоюється лише preOrder
  if (high < Math.min(...scale)) {
    preOrder = Math.min(...scale);
    console.log(
      `low свічки ${candle.low} маньше шкали. Відкриття ${formatDate(openTime)}`
    );
    return { preOrder, down };
  }

  // Якщо свічка всередині шкалуи:
  // знаходим 1 точку шкали вищє свічки
  for (let i = 0; i < scale.length; i++) {
    if (scale[i] > high) {
      preOrder = scale[i];
      break;
    }
  }

  // знаходим 1 точку шкали нищє свічки
  for (let i = scale.length - 1; i >= 0; i--) {
    if (scale[i] < low) {
      down = scale[i];
      break;
    }
  }

  return { preOrder, down, dataStartMs };
}

// ***********
// 5 РОЗРАХУВАТИ НАСТУПНІ ОРДЕРИ І ПРЕ-ОРДЕРИ (ТОЧКИ ПОШУКУ В БД)
// приймає шкалу (масив), свічку (об'єкт) і ордери (масив обов'єзково має бути впорядкований від меньшого до більшого)
// модифікую сети orders і сет preOrders
function findNextOrders(scale, candle, preOrders, orders) {
  const { low, high, openTime, closeTime } = candle;
  let up = null;
  let down = null;
  const dataStartMs = closeTime + 1;
  // console.log(" 4 candle !!!", candle);

  // Якщо свічка над шкалою значення додається лише orders
  if (low > Math.max(...scale)) {
    orders.add(Math.max(...scale));
    console.log(
      `low свічки ${candle.low} більше шкали. Відкриття ${formatDate(openTime)}`
    );
    return;
  }

  // Якщо свічка під шкалою значення додається лише preOrders
  if (high < Math.min(...scale)) {
    preOrders.add(Math.min(...scale));
    console.log(
      `low свічки ${candle.low} маньше шкали. Відкриття ${formatDate(openTime)}`
    );
    return;
  }

  // Якщо свічка всередині шкали:
  // знаходим 1 точку шкали вищє свічки
  // TODO - додавати 5 точок шкали
  for (let i = 0; i < scale.length; i++) {
    if (scale[i] > high) {
      preOrders.add(scale[i]);
      break;
    }
  }

  // знаходим 1 точку шкали нищє свічки
  // TODO - додавати 5 точок шкали
  for (let i = scale.length - 1; i >= 0; i--) {
    if (scale[i] < low) {
      orders.add(scale[i]);
      break;
    }
  }
}

// ***********
// 6 ФОРМУЄМ ПАРАМЕТРИ НАСТУПНОГО ЗАПИТУ
// модифікує queryParams
// приймає об'єкт (queryParams), об'єкт (candle), масив (buy), сет (preOrders), сет (orders)
function updateQueryParams(queryParams, candle, buy, preOrders, orders) {
  queryParams.dataStartMs = candle.closeTime + 1;

  // найменший ордер на продаж
  if (buy.length === 0) {
    queryParams.minOrderSell = null;
  } else {
    const allPriceSell = buy.map((obj) => obj.priceSell);
    queryParams.minOrderSell = Math.min(...allPriceSell);
  }

  // найменший ордер на купівлю
  const arrPreOrders = Array.from(preOrders);
  if (arrPreOrders.length === 0) {
    queryParams.minPreOrder = null;
  } else {
    queryParams.minPreOrder = Math.min(...arrPreOrders);
  }
  
  // найбільший ордер на купівлю
  const arrOrders = Array.from(orders);
  if (arrOrders.length === 0) {
    queryParams.maxOrder = null;
  } else {
    queryParams.maxOrder = Math.max(...arrOrders);
  }
}

// ***********
// форматувати дату
function formatDate(openTime) {
  const date = new Date(openTime);
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const seconds = date.getUTCSeconds().toString().padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

module.exports = {
  createScaleArray,
  updatesBuyAndDone,
  updatesBuy,
  findNewOrders,
  findTopAndDown,
  findNextOrders,
  updateQueryParams,
  formatDate,
};
