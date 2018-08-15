import {WalletClient} from 'bclient';
import {Network} from 'bcoin';

class Index {
    constructor() {
        let network = Network.get('regtest');

        let walletOptions = {
          port: 18332,
          host: "bcoin.moneygames.io", 
          network: network.type,
          apiKey: 'hunterkey'
        }

        let walletClient = new WalletClient(walletOptions);
        let wallet = walletClient.wallet("primary");

        (async () => {
          const result = await wallet.getInfo();
          console.log(result);
        })();
    }
}

new Index()
