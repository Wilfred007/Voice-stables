"use client";

import React, { useEffect, useState } from "react";
import { authenticate, disconnect, getUserAddress } from "@/lib/stacks";
import { Wallet, LogOut } from "lucide-react";

export default function Landing() {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    setAddress(getUserAddress());
  }, []);

  const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

  return (
    <section className="py-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-fuchsia-600 text-white p-10 shadow-xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Voice Stables</h1>
          <p className="mt-3 text-white/90 max-w-2xl">
            Intent-based stablecoin transfers with a secure on-chain vault. Deposit, withdraw, and execute
            signed transfers powered by Stacks smart contracts.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!address ? (
              <button
                onClick={authenticate}
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2 rounded-full font-semibold shadow hover:bg-white/90"
              >
                <Wallet size={18} /> Connect Wallet
              </button>
            ) : (
              <>
                <span className="text-white/90 bg-white/10 px-3 py-1 rounded-full">
                  {short(address)}
                </span>
                <button
                  onClick={disconnect}
                  className="inline-flex items-center gap-2 bg-black/20 hover:bg-black/30 px-5 py-2 rounded-full font-semibold"
                >
                  <LogOut size={18} /> Disconnect
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
