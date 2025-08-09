/**
 * CommonJS wrapper for yahtml
 * @module yahtml
 */

const importPromise = import('./src/yahtml.js');

module.exports = {
  convertToHtml: (...args) => {
    throw new Error('yahtml requires async initialization in CommonJS. Use: const yahtml = await require("yahtml")');
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