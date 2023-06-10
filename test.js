const mathjs = require("mathjs");

const params = {
  // націнка яку я планую заробити
  profit: 1,
  // при спрацюванні преордеру збільшити ціну преордеру при переносі до ордерів // дозволить ордеру виконатись якщо ціна іде вгору
  orderAddedValue: 0.1,
  // початкові зн. шкали: початкова ціна, кінцева ціна, крок %, прибуток %:
  scaleStart: 1000,
  scaleEnd: 100000,
  scaleStep: 1,
  // ліміт ордерів які виставляти
  preOrdersLimit: 7,
  ordersLimit: 7,
  // дата початку і закінчення аналізу
  dataStart: "2017-05-01",
  dataEnd: "2023-05-02",
};
const stape = 10000.857621;

currentValue = mathjs.evaluate(
  `${stape} + (${stape} * ${params.orderAddedValue / 100})`
);
const result = mathjs.round(currentValue, 8);

console.log(result);

