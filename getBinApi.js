const axios = require("axios");

// Змінні:
const bdCollection = "btcusdt_1second";
const interval = "1s";
const symbol = "BTCUSDT";
const startTime = 1502956980000;
const endTime = 1502957099999;
const limit = 1000;

let apiParams = { symbol, interval, startTime, endTime, limit };

// запит до Binance API
async function getKlinesData(apiParams) {
  const { symbol, interval, startTime, endTime, limit } = apiParams;
  try {
    const response = await axios.get("https://api.binance.com/api/v3/klines", {
      params: {
        symbol,
        interval,
        startTime,
        endTime,
        limit,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Помилка при отриманні даних від Binance API:", error);
    // Handle the error or retry the request
    // You can add a delay between retries using setTimeout()
  }
}

// функція отримує результат запиту і виводить його в консоль
async function logKlinesData() {
  data = await getKlinesData(apiParams);

  // перетворення отриманого від binance масиву масивів в масив об'єктів
  const transformedData = data.map((item) => {
    const openTime = item[0];
    const low = item[3];
    const high = item[2];
    priceChange =
      ((parseFloat(high) - parseFloat(low)) / parseFloat(low)) * 100;

    return {
      openTime,
      open: item[1],
      high,
      low,
      close: item[4],
      volume: item[5],
      closeTime: item[6],
      quoteAssetVolume: item[7], // Объем котируемых активов
      numberOfTrades: item[8],
      takerBuyBaseAssetVolume: item[9],
      takerBuyQuoteAssetVolume: item[10],
      ignored: item[11],
      priceChange: priceChange,
      openT: new Date(openTime),
      type: apiParams.interval,
    };
  });
  console.log(transformedData);
}

// функція отримує результат запиту і виводить його в консоль
logKlinesData();

module.exports = { getKlinesData };
