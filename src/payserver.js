import { WalletClient } from 'bclient';
import { Network } from 'bcoin';
import WebSocket from 'ws';
import redis from 'redis';
import { promisify } from 'util'

import Client from './client';

class Payserver {
    constructor() {
        this.redisClientPlayers = this.connectToRedis(6379, 'redis-players')
        this.redisClientGames = this.connectToRedis(6379, 'redis-gameservers')
        this.clients = {};
        this.server = new WebSocket.Server({ port: 7000 });
        this.server.on('connection', this.newCustomer.bind(this));
        if (process.env.NET == 'main' || process.env.NET == 'testnet') {
            const network = Network.get(process.env.NET);
            const walletOptions = {
                port: network.walletPort,
                host: process.env.BCOIN,
                network: network.type,
                apiKey: process.env.APIKEY,
                ssl: (process.env.SSL === 'true')
            };
            this.walletClient = new WalletClient(walletOptions);
            this.wallet = this.walletClient.wallet('primary');
        }
    }

    connectToRedis(port, name) {
        let client = redis.createClient(port, name)
        client.on('connect', function() {
            console.log("connected " + name)
        });
        client.on('error', function(err) {
            //console.log('Something went wrong ', err)
        });
        return client
    }

    newCustomer(connection) {
        let token = this.generateNewToken(8);
        this.clients[token] = new Client(connection, token, this);
    }

    generateNewToken(n) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < n; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }
}

(async () => {
    try {
        new Payserver();
    } catch (err) {
        console.log(err)
    }
})()
