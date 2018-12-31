import { WebSocket } from 'ws'
import { WalletClient } from 'bclient'
import { Network } from 'bcoin'
import { promisify } from 'util'


export default class Client {
    constructor(conn, token, payserver) {
        this.connection = conn;
        this.token = token;
        this.redisClientPlayers = payserver.redisClientPlayers;
        this.redisClientGames = payserver.redisClientGames;
        this.clients = payserver.clients;
        this.connection.send(JSON.stringify({ 'token': this.token }));
        this.rate = 15000
        if (process.env.NET == 'free') {
            this.pollBalanceFree();
        } else {
            const network = Network.get(process.env.NET);
            const walletOptions = {
                port: network.walletPort,
                host: process.env.NET + ".moneygames.io",
                network: network.type,
                apiKey: process.env.APIKEY,
                ssl: (process.env.SSL === 'true')
            };
            this.walletClient = new WalletClient(walletOptions);
            this.assignAccount();
            this.pollBalance();
        }
    }

    async getHouseAddress() {
        const wallet = this.walletClient.wallet('house');
        const result = await wallet.getAccount('default');
        return result.receiveAddress;
    }

    async assignAccount() {
        const wallet = this.walletClient.wallet('primary');
        const options = { name: this.token };
        try {
            const result = await wallet.createAccount(this.token, options);
            this.address = result.receiveAddress;
            this.connection.send(JSON.stringify({ 'bitcoinAddress': this.address }));
            this.redisClientPlayers.hset(this.token, "status", "unpaid");
            this.redisClientPlayers.hset(this.token, "paymentAddress", this.address);
        } catch (err) {
            console.log("ERROR: " + err)
        }
    }

    async pollBalanceFree() {
        this.redisClientPlayers.hset(this.token, 'status', 'paid');
        this.redisClientPlayers.hset(this.token, 'unconfirmed', '0');
        this.connection.send(JSON.stringify({ 'status': 'paid' }));
    }

    async pollBalance() {
        const wallet = this.walletClient.wallet('primary');
        for (var i = 0; i < 60 * 60; i++) { //poll Balance 60 seconds * 60 minutes
            const result = await wallet.getAccount(this.token);
            if (result) {
                if (result.balance.unconfirmed >= 15000) {
                    this.redisClientPlayers.hset(this.token, 'status', 'paid');
                    this.redisClientPlayers.hset(this.token, 'unconfirmed', result.balance.unconfirmed.toString());
                    this.connection.send(JSON.stringify({ 'status': 'paid' }));
                    return;
                }
            }
            await this.sleep(1000); //sleep for 1 second
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}