"use client";

import React, { useEffect, useState } from "react";
import { authenticate, disconnect, getUserAddress } from "@/lib/stacks";
import {
  Wallet,
  LogOut,
  ShieldCheck,
  Mic,
  Rocket,
  Waves,
  ArrowRight,
} from "lucide-react";

export default function Landing() {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    setAddress(getUserAddress());
  }, []);

  const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] bg-gradient-to-br from-blue-600/40 via-indigo-600/40 to-fuchsia-600/40 rounded-full blur-3xl animate-pulse-slow" />
        <div className="pointer-events-none absolute -bottom-40 -right-20 h-[28rem] w-[28rem] bg-gradient-to-tr from-teal-400/40 via-sky-500/40 to-purple-500/40 rounded-full blur-3xl animate-pulse-slow delay-300" />
      </div>

      {/* Floating orbs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-12 h-24 w-24 rounded-full bg-white/5 blur-xl animate-float" />
        <div className="absolute right-16 top-28 h-12 w-12 rounded-full bg-white/10 blur-lg animate-float [animation-delay:250ms]" />
        <div className="absolute right-1/3 bottom-12 h-20 w-20 rounded-full bg-white/5 blur-xl animate-float [animation-delay:500ms]" />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Hero card */}
        <div className="relative rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900/90 to-gray-900/80 text-white p-10 md:p-14 shadow-2xl ring-1 ring-white/10 overflow-hidden">
          {/* grid overlay removed to avoid parser issues with complex arbitrary values */}

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs md:text-sm backdrop-blur animate-fade-in">
              <Waves size={14} /> Intent-based transfers and secure vault
            </div>

            <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight gradient-text animate-fade-in [animation-delay:120ms]">
              Voice Stables
            </h1>

            <p className="mt-4 text-white/80 text-base md:text-lg max-w-2xl animate-fade-in [animation-delay:220ms]">
              Send stablecoins with natural language and bridge funds to a secure
              on-chain vault. Powered by Stacks smart contracts and a smooth UX.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 animate-fade-in [animation-delay:320ms]">
              {!address ? (
                <button
                  onClick={authenticate}
                  className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2 rounded-full font-semibold shadow hover:bg-white/90 transition-colors"
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
                    className="inline-flex items-center gap-2 bg-black/30 hover:bg-black/40 px-5 py-2 rounded-full font-semibold transition-colors"
                  >
                    <LogOut size={18} /> Disconnect
                  </button>
                </>
              )}

              <a
                href="#features"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 hover:border-white/40 text-white/90 transition-all hover:translate-x-0.5"
              >
                Learn more <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-14 grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Mic className="text-pink-400" size={22} />}
            title="Voice intents"
            desc='Say "send 10 USDC to Alice memo dinner". We parse and prepare the transaction for your signature.'
            delay="0ms"
          />
          <FeatureCard
            icon={<ShieldCheck className="text-emerald-400" size={22} />}
            title="Secure vault"
            desc="Deposit and withdraw via audited smart contracts. Strong guarantees on-chain."
            delay="100ms"
          />
          <FeatureCard
            icon={<Rocket className="text-indigo-400" size={22} />}
            title="Cross-chain bridge"
            desc="Bridge USDC from Ethereum Sepolia to Stacks with a streamlined approval + deposit flow."
            delay="200ms"
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  delay = "0ms",
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay?: string;
}) {
  return (
    <div
      className="group relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur hover:bg-white/10 transition-all shadow-lg overflow-hidden"
      style={{ animation: "fade-in 600ms ease forwards", animationDelay: delay }}
    >
      <div className="absolute -top-20 -right-16 h-40 w-40 rounded-full bg-gradient-to-tr from-white/10 to-white/0 blur-2xl group-hover:translate-x-2 group-hover:-translate-y-1 transition-transform" />
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-black/40 grid place-items-center shadow-inner">
          {icon}
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-white/80">{desc}</p>
    </div>
  );
}
