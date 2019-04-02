import { WebSocket } from 'ws'
import { WalletClient } from 'bclient'
import { Network } from 'bcoin'
import { promisify } from 'util'


export default class Client {
    constructor(conn, token, payserver) {
        this.connection = conn;
        this.token = token;
        this.connection.send(JSON.stringify({ 'token': this.token }));
        this.payserver = payserver;
        this.rate = 15000;
        if (process.env.NET == 'free') {
            this.pollBalanceFree();
        } else {
            this.pollBalance();
        }
    }

    async pollBalanceFree() {
        this.payserver.redisClientPlayers.hset(this.token, 'status', 'paid');
        this.payserver.redisClientPlayers.hset(this.token, 'unconfirmed', '0');
        this.connection.send(JSON.stringify({ 'status': 'paid' }));
    }

    async pollBalance() {
        const name = this.token
        const options = { name: this.token };
        var account = await this.payserver.wallet.createAccount(name, options);
        this.address = account.receiveAddress;
        this.connection.send(JSON.stringify({ 'bitcoinAddress': this.address }));
        this.payserver.redisClientPlayers.hset(this.token, "status", "unpaid");
        this.payserver.redisClientPlayers.hset(this.token, "paymentAddress", this.address);
        for (var i = 0; i < 60 * 60; i++) { //poll Balance 60 seconds * 60 minutes
            account = await this.payserver.wallet.getAccount(this.token);
            if (account && account.balance.unconfirmed >= 1) {
                    this.payserver.redisClientPlayers.hset(this.token, 'status', 'paid');
                    this.payserver.redisClientPlayers.hset(this.token, 'unconfirmed', account.balance.unconfirmed.toString());
                    this.connection.send(JSON.stringify({ 'status': 'paid' }));
                    return;
            }
            await this.sleep(1000); //sleep for 1 second
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
