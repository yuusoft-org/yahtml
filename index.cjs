/**
 * CommonJS wrapper for yhtml
 * @module yhtml
 */

const importPromise = import('./src/yhtml.js');

module.exports = {
  convertToHtml: (...args) => {
    throw new Error('yhtml requires async initialization in CommonJS. Use: const yhtml = await require("yhtml")');
  },
  SELF_CLOSING_TAGS: []
};

// Async initialization for CommonJS
module.exports = (async () => {
  const mod = await importPromise;
  return {
    convertToHtml: mod.convertToHtml,
    SELF_CLOSING_TAGS: mod.SELF_CLOSING_TAGS,
    default: mod.convertToHtml
  };
})();