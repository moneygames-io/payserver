let id;
id="primary"
const {WalletClient} = require('bclient');
const {Network} = require('bcoin');
const network = Network.get('regtest');

const walletOptions = {
  port: 18332,
  host: "bcoin.moneygames.io", 
  network: network.type,
  apiKey: 'hunterkey'
}

const walletClient = new WalletClient(walletOptions);
const wallet = walletClient.wallet(id);

(async () => {
  const result = await wallet.getInfo();
  console.log(result);
})();
