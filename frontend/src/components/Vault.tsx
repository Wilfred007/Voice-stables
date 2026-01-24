"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
} from "lucide-react";

import {
  authenticate,
  getUserAddress,
  getVaultBalance,
  getTokenBalance,
  depositToVault,
  withdrawFromVault,
  faucetMint,
} from "@/lib/stacks";

const DECIMALS = 1_000_000; // USDC u6

export default function Vault() {
  const [address, setAddress] = useState<string | null>(null);
  const [vaultBal, setVaultBal] = useState<bigint>(0n);
  const [walletBal, setWalletBal] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* ----------------------------- utils ----------------------------- */

  const toBaseUnits = (val: string): number | null => {
    const n = Number(val);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.floor(n * DECIMALS);
  };

  async function waitForStacksSuccess(txId: string) {
    const url = `https://api.testnet.hiro.so/extended/v1/tx/${txId}`;

    for (let i = 0; i < 20; i++) {
      const r = await fetch(url);
      const j = await r.json();

      if (j.tx_status === "success") return;

      if (
        ["abort_by_response", "abort_by_post_condition", "rejected"].includes(
          j.tx_status
        )
      ) {
        throw new Error(
          "Transaction failed: " + (j.tx_result?.repr ?? j.tx_status)
        );
      }

      await new Promise((res) => setTimeout(res, 4000));
    }

    throw new Error("Timed out waiting for confirmation");
  }

  /* ---------------------------- balances ---------------------------- */

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const [vault, wallet] = await Promise.all([
        getVaultBalance(address),
        getTokenBalance(address),
      ]);
      setVaultBal(vault);
      setWalletBal(wallet);
    } catch (e: any) {
      setError(e?.message ?? "Failed to refresh balances");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    setAddress(getUserAddress());
  }, []);

  useEffect(() => {
    if (address) refresh();
  }, [address, refresh]);

  /* ---------------------------- actions ----------------------------- */

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!address) return authenticate();

    const raw = toBaseUnits(depositAmount);
    if (!raw) return setError("Invalid deposit amount");

    try {
      setLoading(true);
      const txId = await depositToVault(raw);

      setSuccess("Deposit submitted. Waiting for confirmation…");
      await waitForStacksSuccess(txId);

      await refresh();
      setDepositAmount("");
      setSuccess("Deposit confirmed 🎉");
    } catch (e: any) {
      setError(e?.message ?? "Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!address) return authenticate();

    const raw = toBaseUnits(withdrawAmount);
    if (!raw) return setError("Invalid withdrawal amount");

    try {
      setLoading(true);
      const txId = await withdrawFromVault(raw);

      setSuccess("Withdrawal submitted. Waiting for confirmation…");
      await waitForStacksSuccess(txId);

      await refresh();
      setWithdrawAmount("");
      setSuccess("Withdrawal confirmed ✅");
    } catch (e: any) {
      setError(e?.message ?? "Withdraw failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFaucet = async () => {
    setError(null);
    setSuccess(null);

    if (!address) return authenticate();

    try {
      setLoading(true);
      await faucetMint();
      setSuccess("Faucet called. Refreshing…");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Faucet failed");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------ UI ------------------------------- */

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-3xl shadow-xl border">
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Vault</h2>

        {!address ? (
          <button
            onClick={authenticate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full"
          >
            <Wallet size={18} /> Connect
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
            <button
              onClick={refresh}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        )}
      </header>

      <section className="mb-6">
        <div className="text-sm text-gray-500">Vault balance</div>
        <div className="text-3xl font-extrabold">
          {(Number(vaultBal) / DECIMALS).toLocaleString()} USDC
        </div>
        <div className="text-xs text-gray-400">
          Wallet: {(Number(walletBal) / DECIMALS).toLocaleString()} USDC
        </div>
      </section>

      <button
        onClick={handleFaucet}
        disabled={loading}
        className="mb-4 text-xs bg-gray-900 text-white px-3 py-1 rounded-full"
      >
        Get test USDC
      </button>

      <form onSubmit={handleDeposit} className="grid grid-cols-3 gap-3 mb-3">
        <input
          className="col-span-2 px-4 py-2 border rounded-xl"
          placeholder="Deposit USDC"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          type="number"
          step="0.000001"
        />
        <button
          disabled={loading}
          className="bg-green-600 text-white rounded-xl flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
          Deposit
        </button>
      </form>

      <form onSubmit={handleWithdraw} className="grid grid-cols-3 gap-3">
        <input
          className="col-span-2 px-4 py-2 border rounded-xl"
          placeholder="Withdraw USDC"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          type="number"
          step="0.000001"
        />
        <button
          disabled={loading}
          className="bg-amber-600 text-white rounded-xl flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpFromLine size={16} />}
          Withdraw
        </button>
      </form>

      {(error || success) && (
        <div className="mt-4 text-sm">
          {error && <p className="text-red-600">{error}</p>}
          {success && <p className="text-green-600">{success}</p>}
        </div>
      )}
    </div>
  );
}
