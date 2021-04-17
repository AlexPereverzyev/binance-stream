'use strict';

const { UserStream } = require('./user_stream');
const { BalanceStream } = require('./balance_stream');
const { TradeStream } = require('./trade_stream');
const { TimeStream } = require('./time_stream');
const { FormatterStream } = require('./formatter_stream');
const { current: getClient } = require('./user_client');
const { current: getConfig } = require('./config');
const { current: getLogger } = require('./logger');

const config = getConfig();
const logger = getLogger(process.stdout, true);
const userClient = getClient(config.restBaseAddressTest, config.restBaseAddress);

const formatter = new FormatterStream(true, true);
formatter.pipe(process.stdout);

userClient.fetchTopSymbols((err, res) => {
    if (err) {
        logger.error(err);
        return;
    }

    // open 1 user data stream and watch for balance changes
    const userData = new UserStream(config.wsBaseAddressTest);
    const userBalance = new BalanceStream(false);

    userData.pipe(userBalance).pipe(formatter);
    userData.connect();
    userBalance.init();

    // open T trade streams and measure latencies
    const timing = new TimeStream(false);
    timing.pipe(formatter);
    timing.init();

    for (const symbol of res) {
        const trade = new TradeStream(config.wsBaseAddress, symbol);
        trade.pipe(timing);
        trade.connect();
    }

    // place an order every S seconds
    // setInterval(
    //     () => userClient.palceOrder('MARKET', 'XRPBUSD', 'SELL', 100, (err, res) => {
    //         if (err) {
    //             logger.error(err);
    //             return;
    //         }
    //         logger.info(res);
    //     }),
    //     config.palceOrderInterval
    // );
});
