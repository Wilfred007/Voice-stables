"use client";

import * as React from "react";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { sepolia } from "viem/chains";

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */

const REMOTE_DOMAIN_STACKS = 10003;

const ETH_RPC = process.env.NEXT_PUBLIC_ETH_RPC_URL!;
const X_RESERVE = process.env.NEXT_PUBLIC_X_RESERVE_CONTRACT! as `0x${string}`;
const ETH_USDC = process.env.NEXT_PUBLIC_ETH_USDC_CONTRACT! as `0x${string}`;
const DEFAULT_REMOTE_RECIPIENT_ETH =
  process.env.NEXT_PUBLIC_REMOTE_RECIPIENT_ETH;

/* -------------------------------------------------------------------------- */
/*                                     ABI                                    */
/* -------------------------------------------------------------------------- */

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

const X_RESERVE_ABI = [
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

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export default function BridgeUSDC() {
  const [acct, setAcct] = React.useState<`0x${string}` | null>(null);
  const [ethBal, setEthBal] = React.useState("0");
  const [usdcBal, setUsdcBal] = React.useState("0");
  const [amount, setAmount] = React.useState("");
  const [remoteRecipient32, setRemoteRecipient32] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  /* ------------------------------------------------------------------------ */
  /*                                CLIENTS                                   */
  /* ------------------------------------------------------------------------ */

  const publicClient = React.useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http(ETH_RPC),
      }),
    []
  );

  const getWalletClient = async () => {
    if (!(window as any).ethereum) throw new Error("MetaMask not found");

    await (window as any).ethereum.request({
      method: "eth_requestAccounts",
    });

    return createWalletClient({
      chain: sepolia,
      transport: custom((window as any).ethereum),
    });
  };

  /* ------------------------------------------------------------------------ */
  /*                                HELPERS                                   */
  /* ------------------------------------------------------------------------ */

  const ethAddressToBytes32 = React.useCallback((addr: string) => {
    const m = addr.match(/^0x([0-9a-fA-F]{40})$/);
    if (!m) throw new Error("Invalid ETH address");
    return ("0x" + "0".repeat(24) + m[1]).toLowerCase();
  }, []);

  const parseUSDC = () => {
    if (!amount) throw new Error("Enter amount");

    const [whole, frac = ""] = amount.split(".");
    if (frac.length > 6) throw new Error("USDC supports max 6 decimals");

    return BigInt(whole + frac.padEnd(6, "0"));
  };

  /* ------------------------------------------------------------------------ */
  /*                              AUTO-FILL                                   */
  /* ------------------------------------------------------------------------ */

  React.useEffect(() => {
    if (!DEFAULT_REMOTE_RECIPIENT_ETH) return;
    try {
      setRemoteRecipient32(
        ethAddressToBytes32(DEFAULT_REMOTE_RECIPIENT_ETH)
      );
    } catch {
      /* ignore */
    }
  }, [ethAddressToBytes32]);

  /* ------------------------------------------------------------------------ */
  /*                                ACTIONS                                   */
  /* ------------------------------------------------------------------------ */

  const connect = async () => {
    try {
      const wallet = await getWalletClient();
      const [address] = await wallet.getAddresses();
      setAcct(address);
      setMsg("Connected");
      refresh(address);
    } catch (e: any) {
      setMsg(e.message ?? "Connect failed");
    }
  };

  const refresh = async (address = acct) => {
    if (!address) return;

    try {
      const [wei, usdc] = await Promise.all([
        publicClient.getBalance({ address }),
        publicClient.readContract({
          address: ETH_USDC,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address],
        }),
      ]);

      setEthBal((Number(wei) / 1e18).toFixed(6));
      setUsdcBal((Number(usdc) / 1e6).toFixed(6));
    } catch (e: any) {
      setMsg(e.message ?? "Refresh failed");
    }
  };

  const approve = async () => {
    try {
      setBusy(true);
      setMsg("Approving USDC…");

      if (!acct) throw new Error("Connect wallet first");

      const wallet = await getWalletClient();
      const value = parseUSDC();

      const hash = await wallet.writeContract({
        account: acct,
        address: ETH_USDC,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [X_RESERVE, value],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setMsg("Approval confirmed");
      refresh();
    } catch (e: any) {
      setMsg(e.message ?? "Approval failed");
    } finally {
      setBusy(false);
    }
  };

  const deposit = async () => {
    try {
      setBusy(true);
      setMsg("Depositing…");

      if (!/^0x[0-9a-f]{64}$/.test(remoteRecipient32))
        throw new Error("Invalid bytes32 recipient");

      if (!acct) throw new Error("Connect wallet first");

      const wallet = await getWalletClient();
      const value = parseUSDC();

      const hash = await wallet.writeContract({
        account: acct,
        address: X_RESERVE,
        abi: X_RESERVE_ABI,
        functionName: "depositToRemote",
        args: [
          value,
          REMOTE_DOMAIN_STACKS,
          remoteRecipient32 as `0x${string}`,
          ETH_USDC,
          0n,
          "0x",
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setMsg("Deposit confirmed");
      refresh();
    } catch (e: any) {
      setMsg(e.message ?? "Deposit failed");
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                   UI                                     */
  /* ------------------------------------------------------------------------ */

  return (
    <section className="mt-10 p-4 border rounded-2xl">
      <h3 className="text-lg font-semibold mb-2">
        Bridge USDC (Ethereum → Stacks)
      </h3>

      {!acct ? (
        <button
          onClick={connect}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl"
        >
          Connect MetaMask
        </button>
      ) : (
        <>
          <div className="text-xs mb-2">
            {acct.slice(0, 6)}…{acct.slice(-4)}
          </div>

          <div className="text-xs mb-3">
            <div>ETH: {ethBal}</div>
            <div>USDC: {usdcBal}</div>
          </div>

          <input
            className="w-full px-3 py-2 border rounded-xl mb-2"
            placeholder="Amount (USDC)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <input
            className="w-full px-3 py-2 border rounded-xl mb-3"
            placeholder="remoteRecipient (bytes32)"
            value={remoteRecipient32}
            onChange={(e) => setRemoteRecipient32(e.target.value)}
          />

          <div className="flex gap-3">
            <button
              disabled={busy}
              onClick={approve}
              className="flex-1 bg-gray-900 text-white py-2 rounded-xl disabled:opacity-50"
            >
              Approve
            </button>
            <button
              disabled={busy}
              onClick={deposit}
              className="flex-1 bg-blue-600 text-white py-2 rounded-xl disabled:opacity-50"
            >
              Deposit
            </button>
          </div>
        </>
      )}

      {msg && <div className="mt-3 text-xs break-all">{msg}</div>}
    </section>
  );
}
