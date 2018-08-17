import { WebSocket } from 'ws'
import { WalletClient } from 'bclient'
import { Network } from 'bcoin'
import { redis } from 'redis'

export default class Client {
    constructor(conn, token, rate) {
        this.connection = conn;
        this.token = token;

        this.connection.on('message', this.message.bind(this));
        this.assignAccount();
        this.rate = rate;
        this.pollBalance();
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
                        this.connection.send(JSON.stringify({ 'status': 'paid'}));
                        return;
                    }
                }
                await this.sleep(1000);
            }
        })()
    }

}
