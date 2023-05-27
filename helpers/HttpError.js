const HttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
}; // створює помилку з переданим статусом і повідомленням

module.exports = HttpError;
