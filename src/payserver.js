import { WalletClient } from 'bclient';
import { Network } from 'bcoin';
import { redis } from 'redis';
import WebSocket from 'ws';

import Client from './client';

class Payserver {
    constructor() {
        this.server = new WebSocket.Server({ port: 7000 });
        this.clients = {};
        this.server.on('connection', this.newCustomer.bind(this));
    }

    newCustomer(connection) {
        let token = this.generateNewToken(8);
        this.clients[token] = new Client(connection, token, this.getRate());
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

new Payserver();