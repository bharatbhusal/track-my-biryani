// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: magic;
const config = importModule("config");

module.exports = {
  log(...args) {
    if (config.DEBUG) console.log(...args);
  },
};
