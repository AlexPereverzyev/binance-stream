'use strict';

const { Transform } = require('stream');
const userClient = require('./user_client');
const logger = require('./logger');

const BalanceUpdateEvent = 'outboundAccountPosition';

class BalanceStream extends Transform {
    constructor(verbose = false) {
        super();
        this.verbose = verbose;
        this.balances = new Map();
        this.userClient = userClient.current();
        this.logger = logger.current();
    }

    init() {
        this.userClient.fetchBalances((err, res) => {
            if (err) {
                this.logger.error(err);
                return;
            }
            if (res !== null) {
                this.balances = res;
            }
            this.push(JSON.stringify(
                Array.from(this.balances)
            ));
        });
    }

    _transform(data, encoding, callback) {
        const update = JSON.parse(data);

        if (update.e === BalanceUpdateEvent && update.B) {
            for (const balance of update.B) {
                this.balances.set(balance.a, parseFloat(balance.f) - parseFloat(balance.l));
            }
            this.push(JSON.stringify(
                Array.from(this.balances)
            ));
        } else if (this.verbose) {
            this.push(data);
        }

        callback();
    };
}

module.exports.BalanceStream = BalanceStream;
