const http = require('node:http');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');

// expo-sqlite on web runs SQLite as WebAssembly in a worker.
config.resolver.assetExts.push('wasm');

// That worker talks to the page through SharedArrayBuffer, which browsers only expose to
// cross-origin isolated pages. The isolation headers must be on the HTML document itself, but
// the Expo CLI serves index.html before Metro's middleware (so `server.enhanceMiddleware` never
// sees it). Adding them to every dev-server response covers the page, bundles and the .wasm.
// This only affects the local dev server; a hosted web build must send the same headers.
const CROSS_ORIGIN_ISOLATION_HEADERS = {
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
};
const writeHead = http.ServerResponse.prototype.writeHead;
http.ServerResponse.prototype.writeHead = function writeHeadWithIsolation(...args) {
  if (!this.headersSent) {
    for (const [name, value] of Object.entries(CROSS_ORIGIN_ISOLATION_HEADERS)) {
      if (!this.hasHeader(name)) this.setHeader(name, value);
    }
  }
  return writeHead.apply(this, args);
};

module.exports = config;
