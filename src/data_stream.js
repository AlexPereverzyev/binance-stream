'use strict';

const WebSocket = require('ws');
const { Readable } = require('stream');
const config = require('./config');
const logger = require('./logger');

class DataStream extends Readable {
    constructor(baseAddress, name) {
        super();
        this._read = function () { };
        this.config = config.current();
        this.logger = logger.current();
        this.baseAddress = baseAddress;
        this.name = name;
        this.id = 0;
        this.connected = false;
        this.subscribed = false;
        this.callbacks = new Map();
    }

    address() {
        return this.baseAddress;
    }

    connect() {
        if (this.ws) {
            this.logger.warn(`${this.name} already connecting`);
            return;
        }

        this.ws = new WebSocket(this.address(), { perMessageDeflate: false })
            .on('open', (w) => {
                this.logger.info(`${this.name} connected`);
                this.connected = true;
                this.subscribed = true;
            })
            .on('ping', (d) => {
                this.logger.debug(`${this.name} ping`);
                this.ws.pong();
            })
            .on('message', (d) => {
                if (!this.handleMessage(d)) {
                    this.push(d);
                }
            })
            .on('error', (err) => {
                this.logger.error(`${this.name} failed: ${err.message}`);
                this.disconnect();
                setTimeout(() => this.connect(), this.config.reconnInterval);
            })
            .on('closed', (e) => {
                this.logger.warn(`${this.name} disconnected`);
                this.disconnect();
                setTimeout(() => this.connect(), this.config.reconnInterval);
            });
    }

    disconnect(code = null) {
        if (!this.ws) {
            return;
        }

        this.ws.removeAllListeners();
        this.ws.on('error', function () { });

        if (code) {
            this.ws.close(code);
        } else {
            this.ws.terminate();
        }

        this.ws = null;
        this.connected = false;
        this.subscribed = false;
    }

    handleMessage(data) {
        const message = JSON.parse(data);

        if (!(message && message.id && this.callbacks.has(message.id))) {
            return false;
        }

        this.callbacks.get(message.id)();
        this.callbacks.delete(message.id);
        return true
    }

    subscribe(topics) {
        if (!this.connected) {
            return;
        }

        this.logger.info('subscribing');
        this.command('SUBSCRIBE', topics, () => this.subscribed = true);
    }

    unsubscribe(topics) {
        if (!this.connected || !this.subscribed) {
            return;
        }

        this.logger.info('unsubscribing');
        this.command('UNSUBSCRIBE', topics, () => this.subscribed = false);
    }

    command(method, params, callback) {
        if (!this.connected) {
            return;
        }

        this.ws.send(
            JSON.stringify({
                method,
                params,
                id: ++this.id
            })
        );

        this.callbacks.set(this.id, callback);
    }
}

module.exports.DataStream = DataStream;
