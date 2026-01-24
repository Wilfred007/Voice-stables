"use client"

import React, { useEffect, useState, useCallback } from "react";
import { Loader2, Wallet, ArrowDownToLine, ArrowUpFromLine, RefreshCw } from "lucide-react";
import { authenticate, getUserAddress, getVaultBalance, depositToVault, withdrawFromVault, faucetMint } from "@/lib/stacks";
const DECIMALS = 1_000_000; // mock USDC u6

export default function Vault() {
  const [address, setAddress] = useState<string | null>(null);
  const [balanceU6, setBalanceU6] = useState<bigint>(0n);
  const [loading, setLoading] = useState<boolean>(false);
  const [depAmount, setDepAmount] = useState<string>("");
  const [wdAmount, setWdAmount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) return;
    try {
      setLoading(true);
      const bal = await getVaultBalance(address);
      setBalanceU6(bal);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load balance");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    setAddress(getUserAddress());
  }, []);

  useEffect(() => {
    if (address) {
      refresh();
    }
  }, [address, refresh]);

  const toBase = (val: string): number | null => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) return null;
    // convert to base units; ensure safe integer for Number
    const raw = Math.floor(num * DECIMALS);
    return raw;
  };

  const onDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!address) {
      authenticate();
      return;
    }
    const raw = toBase(depAmount);
    if (raw == null) {
      setError("Enter a valid deposit amount");
      return;
    }
    try {
      setLoading(true);
      await depositToVault(raw);
      setSuccess("Deposit initiated. Confirm in wallet.");
      setDepAmount("");
      // Give some time for mempool; optimistic refresh
      setTimeout(() => refresh(), 2000);
    } catch (e: any) {
      setError(e?.message ?? "Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  const onFaucet = async () => {
    setError(null);
    setSuccess(null);
    if (!address) {
      authenticate();
      return;
    }
    try {
      setLoading(true);
      await faucetMint();
      setSuccess("Faucet called. Confirm in wallet, then refresh balance.");
      setTimeout(() => refresh(), 2000);
    } catch (e: any) {
      setError(e?.message ?? "Faucet failed");
    } finally {
      setLoading(false);
    }
  };

  const onWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!address) {
      authenticate();
      return;
    }
    const raw = toBase(wdAmount);
    if (raw == null) {
      setError("Enter a valid withdraw amount");
      return;
    }
    try {
      setLoading(true);
      await withdrawFromVault(raw);
      setSuccess("Withdrawal initiated. Confirm in wallet.");
      setWdAmount("");
      setTimeout(() => refresh(), 2000);
    } catch (e: any) {
      setError(e?.message ?? "Withdraw failed");
    } finally {
      setLoading(false);
    }
  };

  const formatted = Number(balanceU6) / DECIMALS;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-gray-100 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Vault</h2>
        {!address ? (
          <button onClick={authenticate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-all shadow">
            <Wallet size={18} /> Connect
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
            <button onClick={refresh} title="Refresh" className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="text-gray-500 text-sm">Balance</div>
        <div className="text-3xl font-extrabold">{formatted.toLocaleString(undefined, { maximumFractionDigits: 6 })} USDC</div>
        <div className="text-xs text-gray-400">{balanceU6.toString()} base units</div>
      </div>
      <div className="mt-2 flex items-center gap-3">
  <button
    onClick={onFaucet}
    disabled={loading}
    className="text-xs bg-gray-800 text-white px-3 py-1 rounded-full hover:bg-gray-900"
  >
    Get test USDC
  </button>
</div>

      <form onSubmit={onDeposit} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mb-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Deposit amount (USDC)</label>
          <input
            type="number"
            step="0.000001"
            min="0"
            value={depAmount}
            onChange={(e) => setDepAmount(e.target.value)}
            placeholder="e.g. 10"
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
        <button disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
          Deposit
        </button>
      </form>

      <form onSubmit={onWithdraw} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Withdraw amount (USDC)</label>
          <input
            type="number"
            step="0.000001"
            min="0"
            value={wdAmount}
            onChange={(e) => setWdAmount(e.target.value)}
            placeholder="e.g. 5"
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
        <button disabled={loading} className="bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpFromLine size={16} />}
          Withdraw
        </button>
      </form>

      {(error || success) && (
        <div className="mt-4 text-sm">
          {error && <div className="text-red-600">{error}</div>}
          {success && <div className="text-green-600">{success}</div>}
        </div>
      )}
    </div>
  );
}
