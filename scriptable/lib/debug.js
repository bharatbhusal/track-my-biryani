const config = importModule("config");

module.exports = {
  log(...args) {
    if (config.DEBUG) console.log(...args);
  },
};
