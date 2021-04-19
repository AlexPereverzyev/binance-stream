'use strict';

const { Duplex } = require('stream');
const config = require('./config');
const logger = require('./logger');
const Inf = Number.MAX_SAFE_INTEGER;

class TimeStream extends Duplex {
    constructor(verbose = false) {
        super({ objectMode: false });
        this._read = function () { };
        this.config = config.current();
        this.logger = logger.current();
        this.verbose = verbose;
        this.buckets = new Map();
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
        let min = Inf;
        let max = 0;
        let cnt = 0;
        let sum = 0;

        for (const metrics of this.buckets.values()) {
            cnt += metrics.cnt;
            sum += metrics.sum;
            min = metrics.min < min ? metrics.min : min;
            max = metrics.max > max ? metrics.max : max;
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
        const range = this.config.metricsInterval / 1000 | 0;
        const second = new Date() / 1000 | 0;
        const keyLimit = second - range;
        const total = this.buckets.size;

        let discarded = 0

        for (const key of this.buckets.keys()) {
            if (key > keyLimit) {
                break;
            }
            this.buckets.delete(key);
            discarded++;
        }

        this.logger.debug(`discarded ${discarded} time spans out of ${total}`)
    }

    _write(data, encoding, callback) {
        const now = +(new Date());
        const second = now / 1000 | 0;
        const payload = JSON.parse(data);
        const delta = now - payload.E;

        let metrics = this.buckets.get(second);
        if (!metrics) {
            metrics = { min: Inf, max: 0, sum: 0, cnt: 0 };
            this.buckets.set(second, metrics);
        }

        metrics.cnt++;
        metrics.sum += delta;
        metrics.min = delta < metrics.min ? delta : metrics.min;
        metrics.max = delta > metrics.max ? delta : metrics.max;

        if (this.verbose) {
            this.push(data);
        }

        callback();
    }
}

module.exports.TimeStream = TimeStream;
