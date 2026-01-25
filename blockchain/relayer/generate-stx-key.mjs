import { makeRandomPrivKey, getAddressFromPrivateKey, TransactionVersion } from '@stacks/transactions';

const k = makeRandomPrivKey();
const priv = k.data.toString('hex'); // hex, no 0x
const addr = getAddressFromPrivateKey(priv, TransactionVersion.Testnet);

console.log('STX_RELAYER_PRIVKEY=', priv);
console.log('Relayer testnet address=', addr);