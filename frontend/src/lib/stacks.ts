import { AppConfig, UserSession, authenticate as showStacksAuth, openContractCall } from '@stacks/connect';
import { StacksTestnet } from '@stacks/network';
import { callReadOnlyFunction, contractPrincipalCV, principalCV, uintCV, cvToJSON } from '@stacks/transactions';

const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

export const network = new StacksTestnet();

export const appDetails = {
  name: 'Voice Stables',
  icon: typeof window !== 'undefined' ? window.location.origin + '/logo.png' : '',
};

// Mint test USDC to the caller using the mock token faucet
export async function faucetMint() {
    const [address, name] = USDC_CONTRACT.split('.');
    return openContractCall({
      contractAddress: address,
      contractName: name,
      functionName: 'faucet',
      functionArgs: [],
      network,
      onFinish: () => {},
    });
  }

export function authenticate() {
  try {
    showStacksAuth({
      appDetails,
      userSession,
      onFinish: () => window.location.reload(),
    });
  } catch (e) {
    console.error('Authentication error:', e);
    alert('Failed to start authentication. Please check your wallet.');
  }
}

// Sign out and reload UI
export function disconnect() {
  try {
    userSession.signUserOut();
  } finally {
    if (typeof window !== 'undefined') window.location.reload();
  }
}

// Get connected address (prefers testnet)
export function getUserAddress(): string | null {
  try {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      return (
        (userData as any).profile?.stxAddress?.testnet ||
        (userData as any).profile?.stxAddress?.mainnet ||
        (userData as any).profile?.stxAddress ||
        null
      );
    }
  } catch (e) {
    console.warn('Could not read user session:', e);
  }
  return null;
}

// Contracts (Testnet)
export const VOICE_TRANSFER_CONTRACT = 'ST3HZSQ3EVYVFAX6KR3077S69FNZHB0XWMQ2WWTNJ.voice-transfer-v2';
export const USDC_CONTRACT = 'ST3HZSQ3EVYVFAX6KR3077S69FNZHB0XWMQ2WWTNJ.mock-usdc-v2';

function splitContract(id: string): { address: string; name: string } {
  const [address, name] = id.split('.');
  return { address, name };
}

// Read wallet token balance (mock USDC) for a principal
export async function getTokenBalance(who: string): Promise<bigint> {
    const [address, name] = USDC_CONTRACT.split('.');
    const result = await callReadOnlyFunction({
      contractAddress: address,
      contractName: name,
      functionName: 'get-balance',
      functionArgs: [principalCV(who)],
      network,
      senderAddress: who,
    });
    const json = cvToJSON(result as any);
    // get-balance returns (ok uint), so the uint is nested in .value.value
    const val = (json as any)?.value?.value ?? (json as any)?.value;
    return BigInt(val as string);
  }

// Read vault balance (uint) for a principal
export async function getVaultBalance(who: string): Promise<bigint> {
  const { address, name } = splitContract(VOICE_TRANSFER_CONTRACT);
  const result = await callReadOnlyFunction({
    contractAddress: address,
    contractName: name,
    functionName: 'get-vault-balance',
    functionArgs: [principalCV(who)],
    network,
    senderAddress: who,
  });
  const json = cvToJSON(result as any);
  return BigInt(json.value as string);
}

// Deposit amount (base units) into the vault
export async function depositToVault(amount: number | bigint) {
  const { address: vtAddr, name: vtName } = splitContract(VOICE_TRANSFER_CONTRACT);
  const { address: usdcAddr, name: usdcName } = splitContract(USDC_CONTRACT);
  return openContractCall({
    contractAddress: vtAddr,
    contractName: vtName,
    functionName: 'deposit',
    functionArgs: [
      uintCV(typeof amount === 'bigint' ? Number(amount) : amount),
      contractPrincipalCV(usdcAddr, usdcName),
    ],
    network,
    onFinish: () => {},
  });
}

// Withdraw amount (base units) from the vault
export async function withdrawFromVault(amount: number | bigint) {
  const { address: vtAddr, name: vtName } = splitContract(VOICE_TRANSFER_CONTRACT);
  const { address: usdcAddr, name: usdcName } = splitContract(USDC_CONTRACT);
  return openContractCall({
    contractAddress: vtAddr,
    contractName: vtName,
    functionName: 'withdraw',
    functionArgs: [
      uintCV(typeof amount === 'bigint' ? Number(amount) : amount),
      contractPrincipalCV(usdcAddr, usdcName),
    ],
    network,
    onFinish: () => {},
  });
}