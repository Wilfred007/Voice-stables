import { makeRandomPrivKey, getAddressFromPrivateKey, TransactionVersion } from '@stacks/transactions';

const k = makeRandomPrivKey();
// Convert Uint8Array -> hex string (no 0x)
const priv = Buffer.from(k.data).toString('hex');
const addr = getAddressFromPrivateKey(priv, TransactionVersion.Testnet);

console.log('STX_RELAYER_PRIVKEY=', priv);
console.log('Relayer testnet address=', addr);