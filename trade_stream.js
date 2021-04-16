'use strict';

const { DataStream } = require('./data_stream');

class TradeStream extends DataStream {
    constructor(baseAddress, symbol) {
        super(baseAddress, symbol);
        this.symbol = symbol;
    }

    address() {
        return super.address() + `/${this.symbol.toLowerCase()}@trade`;
    }
}

module.exports.TradeStream = TradeStream;
