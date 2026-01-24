import * as React from "react";

const REMOTE_DOMAIN_STACKS = 10003;

export function BridgeUSDC() {
  const [acct, setAcct] = React.useState<`0x${string}` | null>(null);
  const [ethBal, setEthBal] = React.useState("0");
  const [usdcBal, setUsdcBal] = React.useState("0");
  const [amount, setAmount] = React.useState("");
  const [remoteRecipient32, setRemoteRecipient32] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  const ETH_RPC = process.env.NEXT_PUBLIC_ETH_RPC_URL;
  const X_RESERVE = process.env.NEXT_PUBLIC_X_RESERVE_CONTRACT;
  const ETH_USDC = process.env.NEXT_PUBLIC_ETH_USDC_CONTRACT;

  /* ------------------------------- helpers ------------------------------- */

  const assertEnv = () => {
    if (!ETH_RPC || !X_RESERVE || !ETH_USDC) {
      throw new Error(
        "Missing env vars: NEXT_PUBLIC_ETH_RPC_URL, NEXT_PUBLIC_X_RESERVE_CONTRACT, NEXT_PUBLIC_ETH_USDC_CONTRACT"
      );
    }
  };

  const parseUSDC = () => {
    const v = Math.floor(Number(amount) * 1e6);
    if (!Number.isFinite(v) || v <= 0) {
      throw new Error("Invalid USDC amount");
    }
    return BigInt(v);
  };

  /* --------------------------- viem clients --------------------------- */

  const getPublicClient = async () => {
    const { createPublicClient, http } = await import("viem");
    const { sepolia } = await import("viem/chains");
    return createPublicClient({
      chain: sepolia,
      transport: http(ETH_RPC!),
    });
  };

  const getWalletClient = async () => {
    const provider = (window as any).ethereum;
    if (!provider) throw new Error("MetaMask not found");

    await provider.request({ method: "eth_requestAccounts" });

    const { createWalletClient, custom } = await import("viem");
    const { sepolia } = await import("viem/chains");

    return createWalletClient({
      chain: sepolia,
      transport: custom(provider),
    });
  };

  /* ------------------------------- actions ------------------------------- */

  const connect = async () => {
    try {
      assertEnv();
      const provider = (window as any).ethereum;
      if (!provider) throw new Error("MetaMask not found");

      const [a] = await provider.request({
        method: "eth_requestAccounts",
      });

      setAcct(a);
      setMsg("Connected");
      await refresh(a);
    } catch (e: any) {
      setMsg(e.message || "Connect failed");
    }
  };

  const refresh = async (account?: `0x${string}`) => {
    try {
      assertEnv();
      const addr = account || acct;
      if (!addr) return;

      const client = await getPublicClient();

      const wei = await client.getBalance({ address: addr });
      setEthBal((Number(wei) / 1e18).toFixed(6));

      const ERC20_ABI = [
        {
          name: "balanceOf",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ name: "balance", type: "uint256" }],
        },
      ] as const;

      const bal = await client.readContract({
        address: ETH_USDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [addr],
      });

      setUsdcBal((Number(bal) / 1e6).toFixed(6));
    } catch (e: any) {
      setMsg(e.message || "Refresh failed");
    }
  };

  const approve = async () => {
    try {
      assertEnv();
      setBusy(true);
      setMsg("Approving USDC…");

      const wallet = await getWalletClient();
      const value = parseUSDC();

      const ERC20_ABI = [
        {
          name: "approve",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ name: "success", type: "bool" }],
        },
      ] as const;

      const hash = await wallet.writeContract({
        address: ETH_USDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [X_RESERVE as `0x${string}`, value],
      });

      setMsg(`Approval tx: ${hash}`);
      await refresh();
    } catch (e: any) {
      setMsg(e.message || "Approval failed");
    } finally {
      setBusy(false);
    }
  };

  const deposit = async () => {
    try {
      assertEnv();
      setBusy(true);
      setMsg("Depositing to Stacks…");

      if (!/^0x[0-9a-fA-F]{64}$/.test(remoteRecipient32)) {
        throw new Error("Invalid remoteRecipient (bytes32)");
      }

      const wallet = await getWalletClient();
      const value = parseUSDC();

      const ABI = [
        {
          name: "depositToRemote",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "value", type: "uint256" },
            { name: "remoteDomain", type: "uint32" },
            { name: "remoteRecipient", type: "bytes32" },
            { name: "localToken", type: "address" },
            { name: "maxFee", type: "uint256" },
            { name: "hookData", type: "bytes" },
          ],
          outputs: [],
        },
      ] as const;

      const hash = await wallet.writeContract({
        address: X_RESERVE as `0x${string}`,
        abi: ABI,
        functionName: "depositToRemote",
        args: [
          value,
          REMOTE_DOMAIN_STACKS,
          remoteRecipient32 as `0x${string}`,
          ETH_USDC as `0x${string}`,
          0n,
          "0x",
        ],
      });

      setMsg(`Deposit tx: ${hash}`);
      await refresh();
    } catch (e: any) {
      setMsg(e.message || "Deposit failed");
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------------- UI ---------------------------------- */

  return (
    <section className="mt-10 p-4 border rounded-2xl">
      <h3 className="text-lg font-semibold mb-2">
        Bridge USDC (Ethereum → Stacks)
      </h3>

      <div className="flex items-center gap-3 mb-3">
        {!acct ? (
          <button
            onClick={connect}
            className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm"
          >
            Connect MetaMask
          </button>
        ) : (
          <>
            <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
              {acct.slice(0, 6)}…{acct.slice(-4)}
            </span>
            <button
              onClick={() => refresh()}
              className="text-sm underline"
            >
              Refresh
            </button>
          </>
        )}
      </div>

      <div className="text-xs text-gray-600 mb-3">
        <div>ETH: {ethBal}</div>
        <div>USDC: {usdcBal}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <input
          className="px-3 py-2 border rounded-xl text-sm"
          placeholder="Amount (USDC)"
          type="number"
          step="0.000001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          className="px-3 py-2 border rounded-xl text-sm"
          placeholder="remoteRecipient (bytes32)"
          value={remoteRecipient32}
          onChange={(e) => setRemoteRecipient32(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <button
          disabled={busy || !acct}
          onClick={approve}
          className="px-3 py-2 bg-gray-900 text-white rounded-xl text-sm disabled:opacity-50"
        >
          Approve
        </button>
        <button
          disabled={busy || !acct}
          onClick={deposit}
          className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50"
        >
          Deposit
        </button>
      </div>

      {msg && (
        <div className="mt-3 text-xs text-gray-700 break-all">
          {msg}
        </div>
      )}
    </section>
  );
}
