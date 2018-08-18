import { WebSocket } from 'ws'
import { WalletClient } from 'bclient'
import { Network } from 'bcoin'

export default class Client {
    constructor(conn, token, rate, redisClient) {
        this.connection = conn;
        this.token = token;

        this.connection.on('message', this.message.bind(this));
        console.log('reached');
        this.assignAccount();
        this.rate = rate;
        this.pollBalance();
        this.redisClient = redisClient;
    }

    message(message) {
        console.log(message);
    }

    assignAccount() {
        const network = Network.get('testnet');

        const walletOptions = {
            port: 18334,
            host: "bcoin.moneygames.io",
            network: network.type,
            apiKey: 'hunterkey'
        };

        const walletClient = new WalletClient(walletOptions);
        const wallet = walletClient.wallet('primary');
        const options = { name: this.token };;

        (async () => {
            const result = await wallet.createAccount(this.token, options);
            this.address = result.receiveAddress;
            this.connection.send(JSON.stringify({ 'bitcoinAddress': this.address }));
            this.connection.send(JSON.stringify({ 'token': this.token }));
            this.redisClient.hset(this.token, "status", "unpaid");
            this.redisClient.hset(this.token, "paymentAddress", this.address);
        })()
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    pollBalance() {
        const network = Network.get('testnet');

        const walletOptions = {
            port: 18334,
            host: "bcoin.moneygames.io",
            network: network.type,
            apiKey: 'hunterkey'
        };

        const walletClient = new WalletClient(walletOptions);
        const wallet = walletClient.wallet('primary');

        (async () => {
            while (true) {
                const result = await wallet.getAccount(this.token);
                if (result) {
                    if (result.balance.unconfirmed >= 15000) {
                        this.redisClient.hset(this.token, 'status', 'paid');
                        this.connection.send(JSON.stringify({ 'status': 'paid'}));
                        return;
                    }
                }
                await this.sleep(1000);
            }
        })()
    }

}
