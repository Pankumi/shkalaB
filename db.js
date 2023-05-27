

const mongoose = require("mongoose");
const Candle = require("./dbCandle");

// URL для підключення до локальної бази даних MongoDB
const databaseUrl = "mongodb://127.0.0.1:27017/binance";
// Опції підключення (необов'язково)
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Підключення до бази даних
mongoose
  .connect(databaseUrl, options)
  .then(async () => {
    try {
      console.log("Підключення до бази даних встановлено!");
      // Тут можна робити операції з базою даних
      await getAll(); // Виклик функції асинхронно
      mongoose.connection.close(); // Закриття підключення
    } catch (error) {
      console.error("Помилка під час операцій з базою даних:", error);
    }
  })
  .catch((error) => {
    console.error("Помилка підключення до бази даних:", error);
  });

// Отримую всю колекцію асинхронно
async function getAll() {
  try {
    const result = await Candle.find();
    console.log("result >>", result);
  } catch (error) {
    console.error("Помилка отримання даних:", error);
  }
}
