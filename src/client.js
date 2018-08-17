import { WebSocket } from 'ws';
import { WalletClient } from 'bclient';
import { Network } from 'bcoin';
import { redis } from 'redis';

export default class Client {
    constructor(conn, token) {
        this.connection = conn
        this.token = token

        this.connection.on('message', this.message.bind(this));
        this.assignAccount()
    }

    message(message) {
        console.log(message)
    }

    assignAccount() {
        const network = Network.get('testnet');

        const walletOptions = {
            port: 18334,
            host: "bcoin.moneygames.io",
            network: network.type,
            apiKey: 'hunterkey'
        }

        const walletClient = new WalletClient(walletOptions);
        const wallet = walletClient.wallet('primary');
        const options = { name: this.token };

        (async () => {
            const result = await wallet.createAccount(this.token, options);
            this.connection.send(JSON.stringify({'bitcoinAddress': result.receiveAddress}))
        })();
    }

}
