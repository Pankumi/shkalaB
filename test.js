const buy = [
  { scale: 1 },
  { scale: 2 },
  { scale: 3 },
];

const orders = {
  1: { name: 'Order 1', value: 100 },
  2: { name: 'Order 2', value: 200 },
  3: { name: 'Order 3', value: 300 },
  4: { name: 'Order 4', value: 400 },
};

const preOrders = {
  1: { name: 'Pre-order 1', value: 50 },
  2: { name: 'Pre-order 2', value: 100 },
  3: { name: 'Pre-order 3', value: 150 },
  4: { name: 'Pre-order 4', value: 200 },
};

buy.forEach((el) => {
  const elScale = el.scale;
  delete orders[elScale];
  delete preOrders[elScale];
});

console.log(orders);
console.log(preOrders);
