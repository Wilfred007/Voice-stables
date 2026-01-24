import 'dotenv/config';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import fs from 'node:fs';
import path from 'node:path';
import {
  makeContractCall,
  broadcastTransaction,
  principalCV,
  uintCV,
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';

// ---------------------------- Config ----------------------------
const ETH_RPC_URL = process.env.ETH_RPC_URL;
const X_RESERVE_ADDRESS = (process.env.X_RESERVE_ADDRESS || '').toLowerCase();
const VOICE_TRANSFER_CONTRACT = process.env.VOICE_TRANSFER_CONTRACT; // "ST...contract-name"
const STX_PRIVKEY = process.env.STX_RELAYER_PRIVKEY; // hex
const STACKS_NETWORK = process.env.STACKS_NETWORK || 'testnet';
const STACKS_API_URL = process.env.STACKS_API_URL; // optional override
const EXPECTED_REMOTE_DOMAIN = Number(process.env.EXPECTED_REMOTE_DOMAIN || 10003);

if (!ETH_RPC_URL || !X_RESERVE_ADDRESS || !VOICE_TRANSFER_CONTRACT || !STX_PRIVKEY) {
  console.error('Missing env: ETH_RPC_URL, X_RESERVE_ADDRESS, VOICE_TRANSFER_CONTRACT, STX_RELAYER_PRIVKEY');
  process.exit(1);
}

const recipientsPath = path.join(process.cwd(), 'recipients.json');
let recipients = {};
try {
  recipients = JSON.parse(fs.readFileSync(recipientsPath, 'utf8'));
} catch (e) {
  console.warn('recipients.json not found or invalid, will skip unmatched recipients');
}

function splitContract(id) {
  const [address, name] = id.split('.');
  return { address, name };
}

const stacksNetwork = (() => {
  if (STACKS_NETWORK === 'mainnet') {
    const n = new StacksMainnet();
    if (STACKS_API_URL) n.coreApiUrl = STACKS_API_URL;
    return n;
  }
  const n = new StacksTestnet();
  if (STACKS_API_URL) n.coreApiUrl = STACKS_API_URL;
  return n;
})();

// ---------------------------- Ethereum client ----------------------------
const client = createPublicClient({
  chain: sepolia, // adjust if needed
  transport: http(ETH_RPC_URL),
});

// Minimal ABI for the event
const XRESERVE_ABI = [
  {
    type: 'event',
    name: 'DepositToRemote',
    inputs: [
      { name: 'sender', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'remoteDomain', type: 'uint32', indexed: false },
      { name: 'remoteRecipient', type: 'bytes32', indexed: false },
    ],
  },
];

// ---------------------------- Helpers ----------------------------
function to0xHex(b) {
  return typeof b === 'string' ? b.toLowerCase() : `0x${Buffer.from(b).toString('hex')}`;
}

function lookupRecipient(remoteRecipientHex) {
  const key = remoteRecipientHex.toLowerCase();
  return recipients[key] || null;
}

async function creditOnStacks({ recipientPrincipal, amount }) {
  const vt = splitContract(VOICE_TRANSFER_CONTRACT);
  const tx = await makeContractCall({
    contractAddress: vt.address,
    contractName: vt.name,
    functionName: 'bridge-credit',
    functionArgs: [principalCV(recipientPrincipal), uintCV(BigInt(amount))],
    senderKey: STX_PRIVKEY,
    network: stacksNetwork,
    anchorMode: 3, // Any
  });
  const res = await broadcastTransaction(tx, stacksNetwork);
  if ((res?.error) || (res?.error)) {
    throw new Error(`Stacks broadcast error: ${res.error} ${res.reason || ''}`);
  }
  console.log('Stacks credit tx:', typeof res === 'string' ? res : res.txid || res);
}

// ---------------------------- Watcher ----------------------------
async function start() {
  console.log('Relayer starting...');
  console.log('XReserve:', X_RESERVE_ADDRESS);
  console.log('VoiceTransfer:', VOICE_TRANSFER_CONTRACT);
  console.log('Expected remoteDomain:', EXPECTED_REMOTE_DOMAIN);

  await client.watchContractEvent({
    address: X_RESERVE_ADDRESS,
    abi: XRESERVE_ABI,
    eventName: 'DepositToRemote',
    onLogs: async (logs) => {
      for (const log of logs) {
        try {
          const { args } = log;
          const amount = args.amount; // BigInt
          const remoteDomain = Number(args.remoteDomain);
          const remoteRecipient = to0xHex(args.remoteRecipient);

          if (remoteDomain !== EXPECTED_REMOTE_DOMAIN) {
            console.log('Ignoring event with unexpected domain:', remoteDomain);
            continue;
          }

          const recipientPrincipal = lookupRecipient(remoteRecipient);
          if (!recipientPrincipal) {
            console.warn('No recipient mapping for', remoteRecipient, '— add to recipients.json');
            continue;
          }

          console.log('Relaying credit:', {
            amount: amount.toString(),
            remoteRecipient,
            recipientPrincipal,
          });

          await creditOnStacks({ recipientPrincipal, amount });
        } catch (err) {
          console.error('Failed to relay log:', err);
        }
      }
    },
    onError: (err) => {
      console.error('watchContractEvent error:', err);
    },
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
