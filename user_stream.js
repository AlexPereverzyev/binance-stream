'use strict';

const { DataStream } = require('./data_stream');
const userClient = require('./user_client');
const logger = require('./logger');

class UserStream extends DataStream {
    constructor(baseAddress) {
        super(baseAddress, 'USER_DATA');
        this.userClient = userClient.current();
        this.logger = logger.current();
    }

    address() {
        return super.address() + `/${this.listenKey}`;
    }

    connect() {
        if (!this.listenKey) {
            this.userClient.fetchListenKey((err, key) => {
                if (err) {
                    setTimeout(() => this.connect(), this.config.reconnInterval);
                    this.logger.error(err);
                    return;
                }

                this.listenKey = key;
                this.keepalive();
                super.connect();
            });
            return;
        }

        super.connect();
    }

    disconnect(code = null) {
        super.disconnect(code);

        clearInterval(this.renewInterval);
        this.renewInterval = null;
    }

    keepalive() {
        if (!this.listenKey || !!this.renewInterval) {
            return;
        }

        this.renewInterval = setInterval(() => {
            this.userClient.renewListenKey(this.listenKey, (err) => {
                if (err) {
                    this.logger.error(err);
                    return;
                }
                this.logger.debug(`${this.name} renewed listener`);
            });
        }, this.config.renewInterval);
    }
}

module.exports.UserStream = UserStream;
