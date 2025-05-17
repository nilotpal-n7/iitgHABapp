const getCurrentDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const getCurrentTime = () => {
  const date = new Date();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};
const getCurrentDay = () => {
  const date = new Date();
  const options = { weekday: "long" };
  return date.toLocaleDateString("en-US", options);
};

module.exports = {
  getCurrentDate,
  getCurrentTime,
  getCurrentDay,
};
