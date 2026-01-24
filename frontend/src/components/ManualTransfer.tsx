"use client";

import React, { useEffect, useState } from "react";
import { Send, Wallet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { authenticate, getUserAddress, network } from "@/lib/stacks";
import { openContractCall } from "@stacks/connect";
import { uintCV, principalCV, noneCV, someCV, bufferCV } from "@stacks/transactions";

// NOTE: Keep this in sync with VoiceTransfer or move to a shared config file.
const USDC_CONTRACT = "ST3HZSQ3EVYVFAX6KR3077S69FNZHB0XWMQ2WWTNJ.mock-usdc-v2";

export default function ManualTransfer() {
  const [address, setAddress] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "signing" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  useEffect(() => {
    setAddress(getUserAddress());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTxId(null);

    if (!address) {
      authenticate();
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setStatus("error");
      setError("Enter a valid amount");
      return;
    }

    if (!recipient || !recipient.includes("ST")) {
      setStatus("error");
      setError("Enter a valid Stacks principal for recipient");
      return;
    }

    try {
      setStatus("signing");

      const decimals = 1_000_000; // u6 for mock USDC
      const raw = Math.floor(amt * decimals);

      const memoArg = memo
        ? someCV(bufferCV(new TextEncoder().encode(memo).slice(0, 34)))
        : noneCV();

      await openContractCall({
        contractAddress: USDC_CONTRACT.split(".")[0],
        contractName: USDC_CONTRACT.split(".")[1],
        functionName: "transfer",
        functionArgs: [
          uintCV(raw),
          principalCV(address),
          principalCV(recipient.trim()),
          memoArg,
        ],
        network,
        onFinish: (data) => {
          setStatus("success");
          setTxId(data.txId);
          setAmount("");
          setRecipient("");
          setMemo("");
        },
        onCancel: () => {
          setStatus("idle");
        },
      });

      setStatus("submitting");
    } catch (err: any) {
      setStatus("error");
      setError(err?.message ?? "Transfer failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Send USDC</h2>
        {!address ? (
          <button
            onClick={authenticate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-all shadow"
          >
            <Wallet size={18} /> Connect
          </button>
        ) : (
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (USDC)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 25"
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Recipient (Stacks address)</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="ST..."
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Memo (optional)</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Up to 34 bytes"
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={status === "signing" || status === "submitting"}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold shadow hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {status === "signing" || status === "submitting" ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Send size={16} />
            )}
            {status === "signing" ? "Waiting for signature" : status === "submitting" ? "Submitting" : "Send"}
          </button>
          {status === "success" && (
            <span className="text-green-600 flex items-center gap-2 text-sm">
              <CheckCircle2 size={16} /> Sent! {txId && (
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                  href={`https://explorer.hiro.so/txid/${txId}?chain=testnet`}
                >
                  View tx
                </a>
              )}
            </span>
          )}
          {status === "error" && (
            <span className="text-red-600 flex items-center gap-2 text-sm">
              <AlertCircle size={16} /> {error}
            </span>
          )}
        </div>
      </form>

      <p className="text-xs text-gray-500 mt-4">
        Using contract: <span className="font-mono">{USDC_CONTRACT}</span>
      </p>
    </div>
  );
}
