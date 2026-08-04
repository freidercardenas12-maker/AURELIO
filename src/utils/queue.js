/**
 * Ultra-lightweight native CommonJS Queue (Concurrency = 1)
 * Guarantees zero race conditions without any ESM/CJS package import compatibility issues on Cloud platforms.
 */
class SimpleQueue {
  constructor(concurrency = 1) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this._next();
    });
  }

  _next() {
    if (this.running >= this.concurrency || this.queue.length === 0) return;

    this.running++;
    const { fn, resolve, reject } = this.queue.shift();

    Promise.resolve()
      .then(() => fn())
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.running--;
        this._next();
      });
  }
}

module.exports = SimpleQueue;
