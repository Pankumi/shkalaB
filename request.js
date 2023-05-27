const axios = require('axios');

async function getBinanceData(startTime, endTime) {
  try {
    // Виконання запиту до API Binance
    const response = await axios.get('https://api.binance.com/api/v3/klines', {
      params: {
        symbol: 'BTCUSDT', // Пара BTC/USDT
        interval: '1d', // Інтервал даних: 1 день
        startTime: startTime,
        endTime: endTime,
        limit: 100, // Отримання 100 даних 
      },
    });

    // Обробка отриманих даних
    const binanceData = response.data;
    for (const data of binanceData) {
      const openTime = new Date(data[0]);
      const openPrice = data[1];
      const highPrice = data[2];
      const lowPrice = data[3];
      const closePrice = data[4];
      console.log(`Open Time: ${openTime}, Open Price: ${openPrice}, High Price: ${highPrice}, Low Price: ${lowPrice}, Close Price: ${closePrice}`);
    }

  } catch (error) {
    console.error('Помилка при отриманні даних з Binance:', error.message);
  }
}

module.exports = getBinanceData;