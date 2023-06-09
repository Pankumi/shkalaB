const mongoose = require("mongoose"); // бібліотека для роботи з MongoDB, надає простий спосіб моделювання даних, валідації, створення запитів і зв'язку з MongoDB.
const app = require("./app");

// в app.js в змінні оточення додається DB_HOST
const { DB_HOST, PORT = 3000 } = process.env; // process.env - ЗМІННІ ОТОЧЕННЯ, глобальний об'єкт в якому записані налашування комп'ютера на якому виконується код

mongoose.set("strictQuery", true); // За замовчуванням false - будь-які запити до бази даних, які включають поля, не описані в моделі Mongoose, будуть проігноровані без повідомлення про помилку. true - будуть відхилятись з помилкою, що може допомогти забезпечити правильність виконання запитів до бази даних та уникнути помилок через неправильну структуру запиту.

mongoose
  .connect(DB_HOST)
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `Server running. Use our API on port: ${PORT}, on bd: ${DB_HOST}`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1); // process.exit() - закриває запущєні процеси 1 - закрити з невідомою помилкою.
  });
 

