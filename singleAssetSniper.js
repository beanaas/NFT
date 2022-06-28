const Web3 = require('web3');
const opensea = require("opensea-js");
const OpenSeaPort = opensea.OpenSeaPort;
const Network = opensea.Network;
const https = require('https');
const { GasPriceOracle } = require('gas-price-oracle');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const BigNumber = require('bignumber.js');
var constants = require('./constants');
const TelegramBot = require('node-telegram-bot-api');
const api_key = '1736899006:AAGqJH3pVt1y1tdMMZEfw4oAKtBTDiH_Okw';
const user_id = '1940665053';
const bot = new TelegramBot(api_key);

bot.sendMessage(user_id, "Started");



const snipingPrice = 0.1;


const privateKEY = constants.PRIVATEKEY;

//const assetAddress = '0x05a46f1e545526fb803ff974c790acea34d1f2d6'
console.log(snipingPrice);

// This example provider won't let you make transactions, only read-only calls:
const provider = new Web3.providers.HttpProvider(constants.HTTPPROVIDER)
//provider.engine.pollingInterval = ;
//makes it possible to buy
const providerEngine = new HDWalletProvider({ privateKeys: [privateKEY], providerOrUrl: provider, pollingInterval: 180000 });



const seaport = new OpenSeaPort(providerEngine, {
    networkName: Network.Main,
})

seaport.gasPriceAddition = new BigNumber(80);



//options for getting gasprices
const optionsOracle = {
    chainId: 1,
    defaultRpc: 'https://api.mycryptoapi.com/eth',
    timeout: 10000,
};

//gas price oracle
const oracle = new GasPriceOracle(optionsOracle);

var idet = 0;
var body = "";

process.stdin.on('data', data => {
    console.log(data.toString());
    var test = data.toString();
    var ad = test.slice(0, -1)
    try { getNewListings(ad); } catch (e) { console.log('snopp'); }
});

function getNewListings(address) {

    //change path for other contracts
    const options = {
        hostname: 'api.opensea.io',
        port: 443,
        path: '/api/v1/events?asset_contract_address=' + address + '&event_type=created&only_opensea=false&offset=0&limit=1',
        method: 'GET',
        headers: { "Accept": "application/json" }
    }

    setInterval(function () {
        body = ''
        try {
            https.get(options, (response) => {
                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    body += chunk;
                });
                response.on('end', () => {
                    try {
                        var data = JSON.parse(body);
                        var id = data['asset_events'][0]['asset']['token_id'];
                        var symbol = data['asset_events'][0]['payment_token']['symbol'];
                        var tmpIdet = Number(id);
                        var time = data['asset_events'][0]['created_date'];
                        var name = data['asset_events'][0]['asset']['name'];
                        var price = Number(data['asset_events'][0]['starting_price']) / 1000000000000000000;
                        if (tmpIdet != idet && symbol == 'ETH') {
                            console.log(tmpIdet, price, name);
                            let date_ob = new Date();
                            console.log(date_ob);
                            idet = tmpIdet;

                            if (price < snipingPrice) {
                                order(tmpIdet, address);
                                let date_ob = new Date();
                                console.log(date_ob);
                                bot.sendMessage(user_id, name);
                                bot.sendMessage(user_id, price);
                            }/*
                            oracle.gasPrices().then(gasPrices => {
                                //console.log(gasPrices);
                                var instantGAS = gasPrices['fast'];
                                if (instantGAS < 160 && price < snipingPrice) {
                                    order(tmpIdet, address);
                                    bot.sendMessage(user_id, name);
                                    bot.sendMessage(user_id, price);
                                }
                            });*/
                        }

                    } catch (error) {
                    }

                });
            });
        } catch (e) {
            console.log('fel i https');
        }
    }, 3000);
}
// Gets the contract
async function order(id, contractAddress) {

    const accountAddress = constants.ACCOUNTADDRESS;
    const order = await seaport.api.getOrder({ asset_contract_address: contractAddress, token_id: id, side: 1, taker: null });
    console.log(order);
    const transactionHash = await seaport.fulfillOrder({ //Fulfilling order
        order,
        accountAddress,
    });

    console.log(transactionHash);
    console.log("bought");
    process.exit(1);
    return;
}