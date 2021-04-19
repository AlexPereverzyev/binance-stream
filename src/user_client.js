
const { createHmac } = require('crypto');
const { default: web } = require('axios');
const config = require('./config');

const ApiKeyName = 'X-MBX-APIKEY';

class UserDataClient {
    constructor(userDataBaseAddress, marketDataBaseAddress) {
        this.userDataBaseAddress = userDataBaseAddress;
        this.marketDataBaseAddress = marketDataBaseAddress;
        this.config = config.current();
    }

    // Market Data

    fetchTopSymbols(callback) {
        const url = `${this.marketDataBaseAddress}/ticker/24hr`;

        web.get(url)
            .then((res) => {
                if (res.data && Array.isArray(res.data)) {
                    const symbols = res.data.sort((a, b) => b.quoteVolume - a.quoteVolume)
                        .slice(0, this.config.topSymbolsCount)
                        .map(s => s.symbol);
                    callback(null, symbols);
                } else {
                    callback(null, null);
                }
            })
            .catch((err) => {
                callback(err, null);
            });
    }

    // User Data Stream

    fetchListenKey(callback) {
        const url = `${this.userDataBaseAddress}/userDataStream`;

        web.post(url, null, {
            headers: {
                [ApiKeyName]: this.config.apiKey
            }
        })
            .then((res) => {
                if (res.data && res.data.listenKey) {
                    callback(null, res.data.listenKey);
                } else {
                    callback(null, null);
                }
            })
            .catch((err) => {
                callback(err, null);
            });
    }

    renewListenKey(theKey, callback) {
        const url = `${this.userDataBaseAddress}/userDataStream`;
        const payload = `listenKey=${theKey}`;

        web.put(url, payload, {
            headers: {
                [ApiKeyName]: this.config.apiKey
            }
        })
            .then((res) => {
                callback(null);
            })
            .catch((err) => {
                callback(err);
            });
    }

    deleteListenKey(theKey, callback) {
        const url = `${this.userDataBaseAddress}/userDataStream?listenKey=${theKey}`;

        web.delete(url, {
            headers: {
                [ApiKeyName]: this.config.apiKey
            }
        })
            .then((res) => {
                callback(null);
            })
            .catch((err) => {
                callback(err);
            });
    }

    // Spot Account/Trade

    fetchBalances(callback) {
        const { payload, signature } = this.sign();
        const url = `${this.userDataBaseAddress}/account?${payload}&signature=${signature}`;

        web.get(url, {
            headers: {
                [ApiKeyName]: this.config.apiKey
            }
        })
            .then((res) => {
                if (res.data && res.data.balances) {
                    callback(null, new Map(res.data.balances.map(b => [b.asset, b.free - b.locked])));
                } else {
                    callback(null, null);
                }
            })
            .catch((err) => {
                callback(err, null);
            });
    }

    placeOrder(type, symbol, side, quantity, callback) {
        const { payload, signature } = this.sign(`type=${type}&symbol=${symbol}&side=${side}&quantity=${quantity}`);
        const url = `${this.userDataBaseAddress}/order?signature=${signature}`;

        web.post(url, payload, {
            headers: {
                [ApiKeyName]: this.config.apiKey
            }
        })
            .then((res) => {
                if (res.data) {
                    callback(null, res.data);
                } else {
                    callback(null, null);
                }
            })
            .catch((err) => {
                callback(err, null);
            });
    }

    sign(thePayload = null) {
        const timestamp = +(new Date());
        const subPayload = thePayload ? `&${thePayload}` : '';
        const payload = `recvWindow=${this.config.recvWindow}&timestamp=${timestamp}&${subPayload}`;
        const signature = createHmac('sha256', this.config.secretKey).update(payload).digest('hex');
        return { payload, signature };
    }
}

module.exports.UserDataClient = UserDataClient;

let _instance;

module.exports.current = function (...addresses) {
    if (!_instance || addresses && addresses.length) {
        _instance = new UserDataClient(...addresses);
    }
    return _instance;
};
