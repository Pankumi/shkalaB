const mathjs = require("mathjs");


// 0 *********** Створює шкалу
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

// 2 *********** СПРАЦЮВАННЯ ОРДЕРІВ НА ПРОДАЖ - ПЕРЕНОС З BUY В DONE
// оновлює масив done (додає завершені угоди), оновлює buy (видаляє завершені угоди)
// приймає свічку (об'єкт), масив buy, масив done
function updatesBuyAndDone(candle, buy, done) {
  const { high, openTime } = candle;

  for (let i = buy.length - 1; i >= 0; i--) {
    // перевіряє чи поле priceSell кожного елемента buy меньше за максимум свічки
    if (buy[i].priceSell < high) {
      // додаю час закриття угоди і додаю угоду в масив done
      buy[i].openTimeSell = openTime;
      // console.log("2 ЗАКРИТО ордер >> ", buy[i]);
      done.push(buy[i]);

      // видаляю з buy елемент уже виконаної угоди
      buy.splice(i, 1);
    }
  }
}

// 3 *********** СПРАЦЮВАННЯ ОРДЕРІВ НА КУПІВЛЮ
// Оновлює масив buy (додає відкриті угоди)
// приймає свчічку (candle), об'єкт (orders), масив(buy), об'єкт з профітом(params)
function updatesBuy(candle, orders, buy, params){
  const { low, high, openTime } = candle;
  const { profit } = params;

  Object.entries(orders).forEach(([key, value])=>{
    // перевіряє перетин ордерів зі свічкою
    if (low < value) {
      // модифікую об'єкт buy (додаю/ нові ел)
      buy.push({
        scale: key,
        priceBuy: value,
        openTimeBuy: openTime,
        priceSell: mathjs.round(value * (1 + profit / 100), 8),
      });

      // модифікую orders (видаляю перенесені до buy ордери)
      delete orders[key];
    }
  })
}

// 4 *********** СПРАЦЮВАННЯ ПРЕ-ОРДЕРІВ - ПЕРЕНОС ДО ОРДЕРІВ У ВИПАДКУ ПЕРЕТИНУ ПРЕОРДЕРА СВІЧКОЮ
// модифікує об'єкт ордерів і об'єкт преОрдерів
// Приймає свічку, об'єкт преОрдерів, об'єкт ордерів
function findNewOrders(candle, preOrders, orders) {
  const { low, high } = candle;
  // в цьому випадку <= доречно так як для виставлення ордеру достатньо щоб ціна торкнулась позначки
  Object.entries(preOrders).forEach(([key, value]) => {
    if (value <= high) {

      // модифікую об'єкт ордерів (додаю нові)
      orders[key] = value;
      // модифікую сет преОрдерів (видаляю з preOrders перенесені до orders)
      delete preOrders[key];
    }
  });
}

      // збільшити ціну преордеру при переносі до ордерів
      // TODO: поки неможливо бо призведе до дублювання з ордерами які трохи відрізняються і виставляються в ф5 при падінні ціни
      // const newOrderValue = el / 100 * (100 + params.orderAddedValue)
      // const orderValue = mathjs.round(newOrderValue, 8);
      // orders.add(orderValue);

// 5 *********** РОЗРАХУВАТИ НАСТУПНІ ОРДЕРИ І ПРЕ-ОРДЕРИ (ТОЧКИ ПОШУКУ В БД)
// приймає шкалу (масив), свічку (об'єкт) і ордери (масив обов'єзково має бути впорядкований від меньшого до більшого)
// модифікую об'єкт orders і об'єкт preOrders
function findNextOrders(scale, candle, preOrders, orders, params, maxScale, minScale){
  const { low, high, openTime } = candle;
  const { preOrdersLimit, ordersLimit } = params;
  let preOrdersCalc = 0;
  let ordersCalc = 0;

  // Якщо свічка над шкалою додається лише крайній orders
  if (low > Math.max(...scale)) {
    // orders.add(Math.max(...scale)); //del old

    // Додаємо новий елемент до об'єкта "orders"
    orders[ String(maxScale) ] = maxScale;

    console.log(
      `low свічки ${candle.low} більше шкали. Відкриття ${formatDate(openTime)}`
    );
    return;
  }

  // Якщо свічка під шкалою додається лише крайній preOrders
  if (high < Math.min(...scale)) {
    // preOrders.add(Math.min(...scale)); //del old
    
    // Додаємо новий елемент до об'єкта "preOrders"
    preOrders[ String(minScale) ] = minScale;

    console.log(
      `low свічки ${candle.low} маньше шкали. Відкриття ${formatDate(openTime)}`
    );
    return;
  }

  // Якщо свічка всередині шкали:
  // знаходим точки шкали вищє свічки
  for (let i = 0; i < scale.length; i++) {
    if (scale[i] > high) {
      // preOrders.add(scale[i]); //del old
      // Додаємо новий елемент до об'єкта "preOrders"
      const scaleI = scale[i];
      preOrders[ String( scaleI ) ] = scaleI;

      preOrdersCalc ++;
      if (preOrdersCalc >= preOrdersLimit){
        break;
      }
    }
  }

  // знаходим точки шкали нищє свічки
  // orders обов'язково має записуватись пізніше preOrders, щоб перезаписати зн. orders якщо orders створений за допомогою preOrders з зміщенням ціни buy (якщо свічка скакнула вгору і це не актуально)
  for (let i = scale.length - 1; i >= 0; i--) {
    if (scale[i] < low) {
      // orders.add(scale[i]); //del old
      // Додаємо новий елемент до об'єкта "orders"
      const scaleI = scale[i];
      orders[ String( scaleI ) ] = scaleI;

      ordersCalc ++;
      if (ordersCalc >= ordersLimit){
        break;
      }
    }
  }
}

// 6 ВИДАЛЯЮ ДУБЛІКАТИ ОРДЕРІВ І ПРЕ-ОРДЕРІВ ЯКІ ВЖЕ В BUY (КУПЛЕНІ)
// видаляю ордери і преордери які вже є в buy (повторне відпрацювання по ним не потрібне)
function deleteDuplicates(buy, preOrders, orders){
  buy.forEach((el)=>{
    const elScale = el.scale;
    delete orders[elScale];
    delete preOrders[elScale];
  })
}

// 7 *********** ФОРМУЄМ ПАРАМЕТРИ НАСТУПНОГО ЗАПИТУ
// модифікує queryParams
// приймає об'єкт (queryParams), об'єкт (candle), масив (buy), об'єкт (preOrders), об'єкт (orders)
function updateQueryParams(queryParams, candle, buy, preOrders, orders) {
  queryParams.dataStartMs = candle.closeTime + 1;

  // найменший ордер на продаж
  if (buy.length === 0) {
    queryParams.minOrderSell = null;
  } else {
    const allPriceSell = buy.map( (obj) => obj.priceSell );
    queryParams.minOrderSell = Math.min(...allPriceSell);
  }

  // найменший ордер на купівлю
  if (preOrders.size === 0) {
    queryParams.minPreOrder = null;
  } else {
    // const arrPreOrders = Array.from(preOrders); // del old
    const arrPreOrders = Object.values(preOrders);
    queryParams.minPreOrder = Math.min(...arrPreOrders);
  }
  
  // найбільший ордер на купівлю
  if (orders.length === 0) {
    queryParams.maxOrder = null;
  } else {
    // const arrOrders = Array.from(orders); // del old
    const arrOrders = Object.values(orders);
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
  findNextOrders,
  deleteDuplicates,
  updateQueryParams,
  formatDate,
};


