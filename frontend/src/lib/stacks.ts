import {
    AppConfig,
    UserSession,
    authenticate as showStacksAuth,
    openContractCall,
  } from "@stacks/connect";
  import { StacksTestnet } from "@stacks/network";
  import {
    callReadOnlyFunction,
    contractPrincipalCV,
    principalCV,
    uintCV,
    cvToJSON,
  } from "@stacks/transactions";
  
  /* ------------------------------------------------------------------ */
  /* Config                                                              */
  /* ------------------------------------------------------------------ */
  
  const appConfig = new AppConfig(["store_write", "publish_data"]);
  export const userSession = new UserSession({ appConfig });
  export const network = new StacksTestnet();
  
  export const appDetails = {
    name: "Voice Stables",
    icon:
      typeof window !== "undefined"
        ? window.location.origin + "/logo.png"
        : "",
  };
  
  /* ------------------------------------------------------------------ */
  /* Contracts                                                           */
  /* ------------------------------------------------------------------ */
  
  export const VOICE_TRANSFER_CONTRACT =
    "ST3HZSQ3EVYVFAX6KR3077S69FNZHB0XWMQ2WWTNJ.voice-transfer-v2";
  
  export const USDC_CONTRACT =
    process.env.NEXT_PUBLIC_USDC_CONTRACT ??
    "ST3HZSQ3EVYVFAX6KR3077S69FNZHB0XWMQ2WWTNJ.mock-usdc-v2";
  
  function splitContract(id: string) {
    const [address, name] = id.split(".");
    return { address, name };
  }
  
  /* ------------------------------------------------------------------ */
  /* Auth                                                                */
  /* ------------------------------------------------------------------ */
  
  export function authenticate() {
    showStacksAuth({
      appDetails,
      userSession,
      onFinish: () => window.location.reload(),
    });
  }
  
  export function disconnect() {
    userSession.signUserOut();
    window.location.reload();
  }
  
  export function getUserAddress(): string | null {
    if (!userSession.isUserSignedIn()) return null;
  
    const userData = userSession.loadUserData() as any;
    return (
      userData?.profile?.stxAddress?.testnet ??
      userData?.profile?.stxAddress?.mainnet ??
      null
    );
  }
  
  /* ------------------------------------------------------------------ */
  /* Read-only calls                                                     */
  /* ------------------------------------------------------------------ */
  
  export async function getTokenBalance(who: string): Promise<bigint> {
    const { address, name } = splitContract(USDC_CONTRACT);
  
    const result = await callReadOnlyFunction({
      contractAddress: address,
      contractName: name,
      functionName: "get-balance",
      functionArgs: [principalCV(who)],
      senderAddress: who,
      network,
    });
  
    const json = cvToJSON(result as any);
    return BigInt(json.value.value);
  }
  
  export async function getVaultBalance(who: string): Promise<bigint> {
    const { address, name } = splitContract(VOICE_TRANSFER_CONTRACT);
  
    const result = await callReadOnlyFunction({
      contractAddress: address,
      contractName: name,
      functionName: "get-vault-balance",
      functionArgs: [principalCV(who)],
      senderAddress: who,
      network,
    });
  
    const json = cvToJSON(result as any);
    return BigInt(json.value);
  }
  
  /* ------------------------------------------------------------------ */
  /* Write calls (return txId)                                           */
  /* ------------------------------------------------------------------ */
  
  export async function faucetMint(): Promise<string> {
    const { address, name } = splitContract(USDC_CONTRACT);
  
    return new Promise((resolve, reject) => {
      openContractCall({
        contractAddress: address,
        contractName: name,
        functionName: "faucet",
        functionArgs: [],
        network,
        onFinish: (data) => resolve(data.txId),
        onCancel: () => reject(new Error("Faucet cancelled")),
      });
    });
  }
  
  export async function depositToVault(amount: number): Promise<string> {
    const vt = splitContract(VOICE_TRANSFER_CONTRACT);
    const usdc = splitContract(USDC_CONTRACT);
  
    return new Promise((resolve, reject) => {
      openContractCall({
        contractAddress: vt.address,
        contractName: vt.name,
        functionName: "deposit",
        functionArgs: [
          uintCV(amount),
          contractPrincipalCV(usdc.address, usdc.name),
        ],
        network,
        onFinish: (data) => resolve(data.txId),
        onCancel: () => reject(new Error("Deposit cancelled")),
      });
    });
  }
  
  export async function withdrawFromVault(amount: number): Promise<string> {
    const vt = splitContract(VOICE_TRANSFER_CONTRACT);
    const usdc = splitContract(USDC_CONTRACT);
  
    return new Promise((resolve, reject) => {
      openContractCall({
        contractAddress: vt.address,
        contractName: vt.name,
        functionName: "withdraw",
        functionArgs: [
          uintCV(amount),
          contractPrincipalCV(usdc.address, usdc.name),
        ],
        network,
        onFinish: (data) => resolve(data.txId),
        onCancel: () => reject(new Error("Withdraw cancelled")),
      });
    });
  }
  