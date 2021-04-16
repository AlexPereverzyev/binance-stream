
# Binance Stream

Stream market and user data from Binance Web sockets API to console.

The console application opens single user data Web socket to watch for balance changes on test net and a number of market trade Web sockets on main net. Debug and latency information is streamed to console as well.

## How to Run it

Setup environment variables `API_KEY` and `SECRET_KEY` first. The keys can be obtained after registration on Binance test net - https://testnet.binance.vision/. Note, you can add the variables to `.env` file and export them with the command `export $(cat .env | xargs)`.

Then simply run `npm install` and `npm start`.

There are number of flags avalable on the streams that allow for example to disable colors or increase verbosity. The rest of settings are located in `config.js`.

## `bash` Examples

### Fetch Account and Balances Info

```
SUB_PAYLOAD=""

TIMESTAMP=$(($(date +%s%N) / 1000000))
PAYLOAD="recvWindow=60000&timestamp=$TIMESTAMP$SUB_PAYLOAD"
IFS=' ' read -ra SIGNATURE <<< $(echo -n $PAYLOAD | openssl dgst -sha256 -hmac $SECRET_KEY)
SIGNATURE=${SIGNATURE[1]}
echo $TIMESTAMP $SIGNATURE $PAYLOAD

curl -H "X-MBX-APIKEY: $API_KEY" \
"https://testnet.binance.vision/api/v3/account?$PAYLOAD&signature=$SIGNATURE"
```

### Place Market Order

```
SUB_PAYLOAD="&type=MARKET&symbol=XRPBUSD&side=SELL&quantity=100"

...

curl -X POST -H "X-MBX-APIKEY: $API_KEY" \
https://testnet.binance.vision/api/v3/order \
-d "$PAYLOAD&signature=$SIGNATURE"
```

### Fetch User Data Listen Key

```
LISTEN_KEY=$(grep -oP '(?<={"listenKey":")[a-zA-Z0-9]+(?="})' <<< \
$(curl --silent -H "X-MBX-APIKEY: $API_KEY" \
-X POST https://testnet.binance.vision/api/v3/userDataStream))

echo $LISTEN_KEY
```

```
curl -H "X-MBX-APIKEY: $API_KEY" \
-X PUT https://testnet.binance.vision/api/v3/userDataStream \
-d "listenKey=$LISTEN_KEY"
```

```
curl -H "X-MBX-APIKEY: $API_KEY" \
-X DELETE https://testnet.binance.vision/api/v3/userDataStream \
-d "listenKey=$LISTEN_KEY"
```

### References

- https://binance-docs.github.io/apidocs/spot/en/#user-data-streams
- https://binance-docs.github.io/apidocs/spot/en/#trade-streams
- https://binance-docs.github.io/apidocs/spot/en/#24hr-ticker-price-change-statistics
