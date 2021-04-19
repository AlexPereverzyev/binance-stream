
class Config {
    constructor() {
        this.restBaseAddress = 'https://api.binance.com/api/v3';
        this.restBaseAddressTest = 'https://testnet.binance.vision/api/v3';
        this.wsBaseAddress = 'wss://stream.binance.com:9443/ws';
        this.wsBaseAddressTest = 'wss://testnet.binance.vision/ws';
        this.apiKey = process.env.API_KEY;
        this.secretKey = process.env.SECRET_KEY;
        this.recvWindow = 10 * 1000;
        this.renewInterval = 120 * 1000;
        this.reconnInterval = 1 * 1000;
        this.metricsInterval = 60 * 1000;
        this.topSymbolsCount = 10;
    }
}

module.exports.Config = Config;

let _instance;

module.exports.current = function () {
    if (!_instance) {
        _instance = new Config();
    }
    return _instance;
};
