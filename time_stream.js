'use strict';

const { Duplex } = require('stream');
const config = require('./config');
const logger = require('./logger');

class TimeStream extends Duplex {
    constructor(verbose = false) {
        super({ objectMode: false });
        this._read = function () { };
        this.config = config.current();
        this.logger = logger.current();
        this.verbose = verbose;
        this.buckets = new Map();
        this.prev = +(new Date());
    }

    init() {
        this.calcInterval = setInterval(() => {
            this.cleanup();
            this.calculate();
        }, this.config.metricsInterval);
    }

    deinit() {
        if (!this.calcInterval) {
            return;
        }

        clearInterval(this.calcInterval);
    }

    calculate() {
        let min = Number.MAX_SAFE_INTEGER;
        let max = 0;
        let cnt = 0;
        let sum = 0;

        for (const secondValues of this.buckets.values()) {
            for (const value of secondValues) {
                cnt++;
                sum += value;
                min = value < min ? value : min;
                max = value > max ? value : max;
            }
        }

        if (cnt === 0) {
            return;
        }

        this.push(JSON.stringify({
            latency: {
                min,
                mean: sum / cnt,
                max
            }
        }));
    }

    cleanup() {
        const relevant = this.config.metricsInterval / 1000 | 0;
        const current = this.buckets.size;

        let keysToEvict = current - relevant;
        if (keysToEvict <= 0) {
            return;
        }

        this.logger.debug(`discarding ${keysToEvict} time spans out of ${current} total`)

        for (const key of this.buckets.keys()) {
            if (keysToEvict-- <= 0) {
                break;
            }
            this.buckets.delete(key);
        }
    }

    _write(data, encoding, callback) {
        const now = +(new Date());
        const second = now / 1000 | 0;

        if (!this.buckets.has(second)) {
            this.buckets.set(second, []);
        }

        const latency = now - this.prev;
        this.buckets.get(second).push(latency);
        this.prev = now;

        if (this.verbose) {
            this.push(data);
        }

        callback();
    }
}

module.exports.TimeStream = TimeStream;
