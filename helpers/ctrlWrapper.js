const ctrlWrapper = (ctrl) => {                 // Декоратор це ф. "ctrlWrapper" яка отримує ф. "ctrl" (getAll), і повертає "return func"
    const func = async (req, res, next) => {    // обгортку "func" яка приймає (req, res, next),
    try {
      await ctrl(req, res, next);               // і викликає ф. "ctrl", (getAll)  передаючи їй (req, res, next)
    } catch (error) {
      next(error);
    }
  };
  return func;
};

module.exports = ctrlWrapper;
