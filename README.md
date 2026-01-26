# Voice Tx — Cross‑Chain Stablecoin Transfers (Stacks ↔ Ethereum)

Voice Tx is a full‑stack, cross‑chain prototype enabling users to:
- Securely deposit and transfer SIP‑010 tokens on Stacks via a vault and intent-based transfer contract.
- Bridge USDC from Ethereum Sepolia to Stacks, with an off‑chain relayer crediting the Stacks vault.
- Interact through a modern Next.js UI with wallet authentication and optional voice‑parsed transfers.

Status: public beta, testnets only. Do not use with mainnet funds.


## Repository Structure
./ ├─ frontend/ # Next.js 14 app (React 18, TailwindCSS) │ ├─ src/app/ # App router (layout, page) │ ├─ src/components/ # UI: Landing, ManualTransfer, Vault │ ├─ src/lib/ # Utilities (e.g., 
cn
) │ ├─ .env # Frontend env (public NEXT_PUBLIC_*) │ └─ package.json # Next scripts and deps │ ├─ blockchain/ # Clarity contracts, tests, relayer │ ├─ contracts/ # voice-transfer-v2.clar, mock-usdc-v2.clar, trait │ ├─ tests/ # Vitest + Clarinet environment tests │ ├─ relayer/ # Off‑chain listener (viem) → Stacks credit │ ├─ Clarinet.toml # Clarinet project config │ └─ package.json # Test scripts (vitest) │ ├─ package.json # Root devDependencies (hardhat/ethers) └─ README.md # This file


Key files:
- Contracts: [blockchain/contracts/voice-transfer-v2.clar](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/blockchain/contracts/voice-transfer-v2.clar:0:0-0:0), [blockchain/contracts/mock-usdc-v2.clar](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/blockchain/contracts/mock-usdc-v2.clar:0:0-0:0), [blockchain/contracts/sip-010-trait.clar](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/blockchain/contracts/sip-010-trait.clar:0:0-0:0)
- Relayer: [blockchain/relayer/eth-to-stacks.js](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/blockchain/relayer/eth-to-stacks.js:0:0-0:0), [blockchain/relayer/.env.example](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/blockchain/relayer/.env.example:0:0-0:0)
- Frontend: [frontend/src/components/Landing.tsx](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/src/components/Landing.tsx:0:0-0:0), [frontend/src/components/ManualTransfer.tsx](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/src/components/ManualTransfer.tsx:0:0-0:0), [frontend/src/components/Vault.tsx](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/src/components/Vault.tsx:0:0-0:0), [frontend/src/app/page.tsx](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/src/app/page.tsx:0:0-0:0)


## Capabilities

- Vaulted SIP‑010 transfers on Stacks
  - [deposit(amount, token)](cci:1://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/src/components/Vault.tsx:265:2-303:4) and `withdraw(amount, token)` manage per‑user vault balances.
  - `execute-transfer(intent, signature, token)` processes an off‑chain‑signed intent using the vault balance.
  - `bridge-credit(recipient, amount)` allows the relayer to credit user balances post‑bridge.
- Ethereum → Stacks USDC bridge (prototype)
  - UI flow to approve and call `depositToRemote` on an X‑Reserve contract on Sepolia.
  - Off‑chain relayer listens for deposits and posts credits on Stacks via `bridge-credit`.
- Voice‑assisted transfers
  - The UI can parse commands like “Send 10 to Alice memo thanks”, resolving names via an address book.


## Architecture Overview

- Frontend ([frontend/](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend:0:0-0:0))
  - Next.js 14 (App Router), TailwindCSS, Radix UI, `viem`, `@stacks/connect`.
  - Components:
    - [Landing.tsx](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/src/components/Landing.tsx:0:0-0:0): marketing/entry section with wallet auth controls.
    - [ManualTransfer.tsx](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/src/components/ManualTransfer.tsx:0:0-0:0): Stacks USDC transfer with address book and optional voice parsing; calls SIP‑010 `transfer` via `openContractCall`.
    - [Vault.tsx](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/src/components/Vault.tsx:0:0-0:0): Ethereum Sepolia USDC approve + `depositToRemote` to an X‑Reserve contract; uses `viem` to read balances and send transactions.
- Contracts ([blockchain/contracts/](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/blockchain/contracts:0:0-0:0))
  - [voice-transfer-v2.clar](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/blockchain/contracts/voice-transfer-v2.clar:0:0-0:0): manages vault balances, intent‑based transfers, and `bridge-credit` for relayer events.
  - [mock-usdc-v2.clar](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/blockchain/contracts/mock-usdc-v2.clar:0:0-0:0): SIP‑010 compatible token for testing.
  - [sip-010-trait.clar](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/blockchain/contracts/sip-010-trait.clar:0:0-0:0): SIP‑010 token trait.
- Relayer ([blockchain/relayer/](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/blockchain/relayer:0:0-0:0))
  - Node script using `viem` to monitor Sepolia for `depositToRemote` events and credit Stacks vault via `@stacks/transactions`.


## Prerequisites

- Node.js ≥ 18 and npm (or pnpm/yarn)
- Frontend:
  - MetaMask (Sepolia)
  - Hiro Wallet / Stacks Connect for Stacks testnet
- Contracts/Tests:
  - Clarinet toolchain (tests run via `vitest-environment-clarinet`)
- Optional:
  - Sepolia ETH and test USDC for bridge workflow


## Environment Configuration

### Frontend ([frontend/.env](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/.env:0:0-0:0))
- `NEXT_PUBLIC_USDC_CONTRACT` — Stacks SIP‑010 token contract (e.g., `ST... .usdcx` or mock).
- `NEXT_PUBLIC_ETH_RPC_URL` — Ethereum Sepolia RPC.
- `NEXT_PUBLIC_ETH_USDC_CONTRACT` — ERC‑20 USDC on Sepolia.
- `NEXT_PUBLIC_REMOTE_RECIPIENT_ETH` — Default ETH address for bytes32 conversion in Vault.
- `NEXT_PUBLIC_X_RESERVE_CONTRACT` — X‑Reserve contract on Sepolia used by `depositToRemote`.

Example:
NEXT_PUBLIC_USDC_CONTRACT=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx NEXT_PUBLIC_ETH_RPC_URL=https://ethereum-sepolia.publicnode.com NEXT_PUBLIC_ETH_USDC_CONTRACT=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 NEXT_PUBLIC_REMOTE_RECIPIENT_ETH=0x8C799Ad986a4e826720955d39BF772ea035A4666 NEXT_PUBLIC_X_RESERVE_CONTRACT=0x5aEdAaECA91934ae02225589FE810606e6ecb80b


### Relayer ([blockchain/relayer/.env](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/blockchain/relayer/.env:0:0-0:0))
See [blockchain/relayer/.env.example](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/blockchain/relayer/.env.example:0:0-0:0):
Ethereum
ETH_RPC_URL=https://sepolia.infura.io/v3/your-key X_RESERVE_ADDRESS=0xYourXReserveAddress EXPECTED_REMOTE_DOMAIN=10003

Stacks
STACKS_NETWORK=testnet STACKS_API_URL=https://api.testnet.hiro.so VOICE_TRANSFER_CONTRACT=ST... .voice-transfer-v2 STX_RELAYER_PRIVKEY=your-stx-private-key


Security: Never commit private keys.


## Setup & Usage

### 1) Frontend
cd frontend npm install npm run dev

- Runs at http://localhost:3000
- Page includes:
  - `Landing` (wallet connect/disconnect; see [frontend/src/app/page.tsx](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/src/app/page.tsx:0:0-0:0))
  - [ManualTransfer](cci:1://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/src/components/ManualTransfer.tsx:71:0-402:1) (Stacks SIP‑010 transfer; requires Stacks wallet auth; see [frontend/src/components/ManualTransfer.tsx](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/src/components/ManualTransfer.tsx:0:0-0:0))
  - `Vault` (Sepolia approve + deposit; see [frontend/src/components/Vault.tsx](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/src/components/Vault.tsx:0:0-0:0))

Notes:
- [Vault.tsx](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/src/components/Vault.tsx:0:0-0:0) ensures Sepolia chain selection and reads balances via a `viem` public client.
- [ManualTransfer.tsx](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/src/components/ManualTransfer.tsx:0:0-0:0) uses `openContractCall` to invoke SIP‑010 `transfer` on the contract configured by `NEXT_PUBLIC_USDC_CONTRACT`.
- Voice parsing depends on browser Web Speech API; it will gracefully error if unsupported.

### 2) Contracts & Tests
cd blockchain npm install npm test # Vitest with Clarinet environment npm run test:watch

- [Clarinet.toml](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/blockchain/Clarinet.toml:0:0-0:0) defines `voice-transfer-v2`, `mock-usdc-v2`, and the SIP‑010 trait.
- Tests in [blockchain/tests/](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/blockchain/tests:0:0-0:0) use `vitest-environment-clarinet`.

### 3) Relayer (Ethereum → Stacks)
cd blockchain/relayer npm install cp .env.example .env

Fill ETH RPC, X_RESERVE_ADDRESS, VOICE_TRANSFER_CONTRACT, STX_RELAYER_PRIVKEY, etc.
npm start

- Listens for Sepolia `depositToRemote` events on X‑Reserve.
- On event, submits a Stacks transaction calling `bridge-credit(recipient, amount)` on `voice-transfer-v2`.


## How It Works

- Vaulted transfers (Stacks)
  - Users deposit SIP‑010 tokens into the `voice-transfer-v2` contract vault via [deposit(amount, token)](cci:1://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/src/components/Vault.tsx:265:2-303:4).
  - Off‑chain signed `intent` is executed via `execute-transfer(intent, signature, token)` which debits signer’s vault and transfers tokens to `recipient`.
  - Nonces prevent replay, `expiry` enforced, signature validated.
- Bridging (Sepolia → Stacks)
  - User approves USDC and calls `depositToRemote` on X‑Reserve (via UI [Vault.tsx](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/src/components/Vault.tsx:0:0-0:0)).
  - Relayer sees the event, validates `EXPECTED_REMOTE_DOMAIN`, and calls `bridge-credit(recipient, amount)` to credit the user’s Stacks vault.
  - Users can withdraw to their principal via `withdraw(amount, token)` or use `execute-transfer` for routing.

Important contract read‑onlys:
- `get-vault-balance(principal)`
- `is-nonce-used(nonce)`


## Scripts Reference

- Root [package.json](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/package.json:0:0-0:0)
  - Dev deps for Hardhat/Ethers; not required for current flow.
- [frontend/package.json](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/package.json:0:0-0:0)
  - `dev`, `build`, `start`, `lint`
- [blockchain/package.json](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/blockchain/package.json:0:0-0:0)
  - [test](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/home/wilfred/Projects/stacks/stacks_stables/node_modules/death/test:0:0-0:0), `test:report`, `test:watch`
- [blockchain/relayer/package.json](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/blockchain/relayer/package.json:0:0-0:0)
  - `start` (Node script [eth-to-stacks.js](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/blockchain/relayer/eth-to-stacks.js:0:0-0:0))


## Operational & Security Notes

- Prototype; contracts are unaudited. Testnet use only.
- Protect relayer credentials. Never commit [.env](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/.env:0:0-0:0) with secrets.
- Ensure contract holds sufficient token balance to satisfy withdrawals if using `bridge-credit` (fund by SIP‑010 `transfer` to contract address or via helpers in tests).
- Validate `EXPECTED_REMOTE_DOMAIN` to mitigate spoofed event risk.


## Troubleshooting

- MetaMask not found / network mismatch
  - Install MetaMask and connect to Sepolia. The UI will prompt to add/switch if needed.
- Stacks wallet not connected
  - Click Connect in UI; ensure Hiro Wallet is available and on testnet.
- Voice parsing not working
  - Your browser may not support Web Speech API; use manual inputs.
- USDC decimals
  - UI enforces max 6 decimals. Inputs with more are rejected.
- Relayer not crediting
  - Verify [.env](cci:7://file:///home/wilfred/Projects/stacks/stacks_stables/frontend/.env:0:0-0:0) values, RPC connectivity, X‑Reserve address, `EXPECTED_REMOTE_DOMAIN`, and Stacks API URL.


## License

MIT (for code in this repository unless noted otherwise). See dependencies for their licenses.
