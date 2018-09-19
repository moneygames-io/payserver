import { WebSocket } from 'ws'
import { WalletClient } from 'bclient'
import { Network } from 'bcoin'

export default class Client {
    constructor(conn, token, rate, redisClient) {
        this.connection = conn;
        this.token = token;

        this.connection.on('message', this.newWinner.bind(this));
        console.log('reached');
        this.assignAccount();
        this.rate = rate;
        this.pollBalance();
        this.redisClient = redisClient;
    }

    newWinner(response) {
        // verify data['token'] data['address'] and update redis once paid
        var data = JSON.parse(response)
        var transactionId = 'd750aa7cfdfa5c7952d242a6f120efebc675e586cca85450274c2cb4708ad43f'
        var response = {
          'token': this.token,
          'pot': 100,// TODO get this value from redis 
          'destinationAddress': data['destinationAddress'],
          'transactionId': 'd750aa7cfdfa5c7952d242a6f120efebc675e586cca85450274c2cb4708ad43f'
        }
        console.log(data)
        console.log(response)
        this.connection.send(JSON.stringify(response));
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

    async pollBalance2() {
        await this.sleep(2000);
        this.redisClient.hset(this.token, 'status', 'paid');
        this.connection.send(JSON.stringify({ 'status': 'paid'}));
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
