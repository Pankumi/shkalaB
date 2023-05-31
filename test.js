

let queryParams = {
  highStep: null,
  lowStep: null,
  lowSell: 4,
};

const buy = [
  {
    priceBuy: 1,
    openTimeBuy: 1502954200000,
    priceSell: 2
  },
  {
    priceBuy: 2,
    openTimeBuy: 1502964200000,
    priceSell: 3
  },
  {
    priceBuy: 3,
    openTimeBuy: 1502974200000,
    priceSell: 4
  }
];


// console.log("A >>", a);
if(queryParams.lowSell === null && )
for( el of buy ){
  if(queryParams.lowSell > el.priceSell){
    queryParams.lowSell = el.priceSell;
  }
}

console.log("queryParams.lowSell >>", queryParams.lowSell);
