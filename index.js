//import the bcoin module and set it to testnet
const bcoin = require('bcoin').set('testnet');
const WalletDB = bcoin.WalletDB;
const WalletKey = bcoin.wallet.WalletKey;
const KeyRing = bcoin.keyring;
const Mnemonic = bcoin.hd.Mnemonic;
const HD = bcoin.hd;

walletExample().catch(console.error.bind(console));

async function walletExample() {
    //for demonstration purposes, we'll be creating a temporary wallet in memory
    const wdb = new WalletDB({ db: 'memory' });
    await wdb.open();
	const wallet = await wdb.create();
	console.log(wallet);
}
