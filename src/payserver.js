import { WalletClient } from 'bclient';
import { Network } from 'bcoin';
import WebSocket from 'ws';
import redis from 'redis';

import Client from './client';

class Payserver {
    constructor() {
        this.redisClient = redis.createClient(6379, 'redis-players');
        console.log(this.redisClient);
        this.server = new WebSocket.Server({ port: 7000 });
        this.clients = {};
        this.server.on('connection', this.newCustomer.bind(this));
    }

    newCustomer(connection) {
        let token = this.generateNewToken(8);
        this.clients[token] = new Client(connection, token, this.getRate(), this.redisClient);
    }

    generateNewToken(n) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < n; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    getRate() {
        return 15000;
    }
}

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

(async () => {
    console.log("waiting 2 seconds")
    await sleep(2000);
    new Payserver();
    console.log("starting server")
})()
