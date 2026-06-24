try {
  // Load the stockfish.js library from jsDelivr CDN
  // nmrugg/stockfish.js automatically initializes and hooks up communication
  // with the parent thread using self.onmessage and self.postMessage when loaded in a worker.
  importScripts("https://cdn.jsdelivr.net/npm/stockfish@10.0.2/src/stockfish.js");
} catch (error) {
  console.error("Stockfish worker initialization error:", error);
}
