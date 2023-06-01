const mathjs = require("mathjs");


let candle = {};

candle = {
  openTime: 1502943420000,
  open: '4261.48000000',
  high: '4264.88000000',
  low: '4261.48000000',
  close: '4264.88000000',
  volume: '0.07545500',
  closeTime: 1502943479999,
  quoteAssetVolume: '321.60333640',
  numberOfTrades: 2,
  takerBuyBaseAssetVolume: '0.07545500',
  takerBuyQuoteAssetVolume: '321.60333640',
  ignored: '0',
  priceChange: 0.07978448801825999,
  __v: 0
};


console.log("1 ТИП candle.high до >> ", typeof candle.high );
candle.high = parseFloat(candle.high);
candle.low = parseFloat(candle.low);
console.log("1 ТИП candle.high після >> ", typeof candle.high );

// console.log("queryParams.lowSell >>", createScaleArray(params));
