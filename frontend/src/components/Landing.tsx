"use client";

import React from "react";
import { ArrowRight, Wallet, LogOut, Shield, Zap, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
};

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  index,
}) => {
  return (
    <div
      className={cn(
        "group relative p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm",
        "transition-all duration-500 ease-out",
        "hover:bg-card hover:border-muted-foreground/30 hover:-translate-y-1",
        "opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]"
      )}
      style={{ animationDelay: `${800 + index * 150}ms` }}
    >
      <div className="mb-4 p-3 w-fit rounded-xl bg-secondary text-foreground transition-colors duration-300 group-hover:bg-muted-foreground/20">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
};

type HeroProps = {
  authenticate: () => void;
  disconnect: () => void;
  isAuthenticated: boolean;
};

const Hero: React.FC<HeroProps> = ({
  authenticate,
  disconnect,
  isAuthenticated,
}) => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {/* Animated gradient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-1/2 -left-1/4 h-[800px] w-[800px] rounded-full opacity-30 blur-3xl animate-[pulse_8s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full opacity-20 blur-3xl animate-[pulse_10s_ease-in-out_infinite_1s]"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32 lg:py-40">
        {/* Badge */}
        <div
          className="mb-8 opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]"
          style={{ animationDelay: "100ms" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Now in public beta
          </span>
        </div>

        {/* Main heading */}
        <h1
          className="mb-6 text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards] text-balance"
          style={{ animationDelay: "200ms" }}
        >
          The complete
          <br />
          <span className="text-muted-foreground">platform to</span>
          <br />
          build Web3.
        </h1>

        {/* Description */}
        <p
          className="mb-10 max-w-xl text-lg text-muted-foreground leading-relaxed opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]"
          style={{ animationDelay: "350ms" }}
        >
          Connect your wallet and start interacting with the next generation of
          decentralized applications. Secure, fast, and built for scale.
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-wrap items-center gap-4 mb-20 opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]"
          style={{ animationDelay: "500ms" }}
        >
          {!isAuthenticated ? (
            <button
              onClick={authenticate}
              className={cn(
                "group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3",
                "font-semibold text-background transition-all duration-300",
                "hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              <Wallet size={18} />
              Connect Wallet
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </button>
          ) : (
            <button
              onClick={disconnect}
              className={cn(
                "group inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3",
                "font-semibold text-foreground transition-all duration-300",
                "hover:bg-muted hover:scale-105",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              <LogOut size={18} />
              Disconnect
            </button>
          )}

          <a
            href="#features"
            className={cn(
              "group inline-flex items-center gap-2 rounded-full border border-border px-6 py-3",
              "text-muted-foreground transition-all duration-300",
              "hover:border-muted-foreground/50 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
            )}
          >
            Explore the Product
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </a>
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20 opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]"
          style={{ animationDelay: "650ms" }}
        >
          {[
            { value: "10M+", label: "Transactions" },
            { value: "99.9%", label: "Uptime" },
            { value: "150+", label: "Integrations" },
            { value: "<1s", label: "Response time" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "p-4 rounded-xl border border-border bg-card/30 backdrop-blur-sm",
                i < 3 && "md:border-r-0"
              )}
            >
              <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div id="features" className="scroll-mt-20">
          <div
            className="mb-8 opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]"
            style={{ animationDelay: "750ms" }}
          >
            <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Why choose us
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard
              title="Secure by default"
              description="Non-custodial authentication with modern security standards and end-to-end encryption."
              icon={<Shield size={24} />}
              index={0}
            />
            <FeatureCard
              title="Lightning fast"
              description="Optimized performance with sub-second response times and instant confirmations."
              icon={<Zap size={24} />}
              index={1}
            />
            <FeatureCard
              title="Built for scale"
              description="Enterprise-grade infrastructure designed to handle millions of transactions."
              icon={<Layers size={24} />}
              index={2}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;
