import React from "react";
import { ArrowRight, Wallet, LogOut } from "lucide-react";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  delay?: number;
};

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  delay = 0,
}) => {
  return (
    <div
      className="group relative p-6 rounded-2xl ring-1 ring-white/10 bg-white/5 backdrop-blur
                 shadow-lg transition-all duration-300
                 hover:bg-white/10 hover:shadow-xl hover:-translate-y-0.5 hover:ring-white/20
                 opacity-0 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 text-white">{icon}</div>
      <h3 className="mb-1 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-white/70">{description}</p>
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
    <section className="relative overflow-hidden py-24 md:py-28">
      {/* Gradient blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full
                        bg-gradient-to-br from-blue-600/40 via-indigo-600/40 to-fuchsia-600/40
                        blur-3xl opacity-70 animate-pulse-slow" />
        <div className="absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full
                        bg-gradient-to-tr from-teal-400/40 via-sky-500/40 to-purple-500/40
                        blur-3xl opacity-70 animate-pulse-slow delay-300" />
      </div>

      {/* Floating orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-12 h-24 w-24 rounded-full bg-white/5 blur-xl animate-float opacity-80" />
        <div className="absolute right-16 top-28 h-12 w-12 rounded-full bg-white/10 blur-lg animate-float opacity-80 [animation-delay:250ms]" />
        <div className="absolute right-1/3 bottom-12 h-20 w-20 rounded-full bg-white/5 blur-xl animate-float opacity-80 [animation-delay:500ms]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Hero card */}
        <div className="relative rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900/90 to-gray-900/80
                        p-8 md:p-14 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur">
          <div className="max-w-2xl">
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Web3 made simple
            </h1>

            <p className="mb-8 text-lg text-white/70">
              Connect your wallet and start interacting with the next generation
              of decentralized applications.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              {!isAuthenticated ? (
                <button
                  onClick={authenticate}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2
                             font-semibold text-gray-900 shadow-lg transition-colors
                             hover:bg-white/90 focus-visible:outline-none
                             focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <Wallet size={18} />
                  Connect Wallet
                </button>
              ) : (
                <button
                  onClick={disconnect}
                  className="inline-flex items-center gap-2 rounded-full bg-black/30 px-5 py-2
                             font-semibold text-white transition-colors
                             hover:bg-black/40 focus-visible:outline-none
                             focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  <LogOut size={18} />
                  Disconnect
                </button>
              )}

              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-white/20
                           px-5 py-2 text-white/90 transition-all
                           hover:border-white/40 hover:translate-x-0.5
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                Learn more <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Features */}
      
        <div
  className="group relative p-6 rounded-2xl
             bg-gray-800 ring-1 ring-white/10 backdrop-blur
             shadow-lg transition-all duration-300
             hover:bg-gray-700 hover:shadow-xl
             hover:-translate-y-0.5 hover:ring-white/20
             opacity-0 animate-fade-in"
>

          <FeatureCard
            title="Secure by default"
            description="Non-custodial authentication with modern security standards."
            icon={<Wallet size={24} />}
            delay={0}
          />
          <FeatureCard
            title="Fast onboarding"
            description="Connect and start using the app in seconds."
            icon={<ArrowRight size={24} />}
            delay={100}
          />
          <FeatureCard
            title="Built for scale"
            description="Optimized UI and architecture for production dApps."
            icon={<ArrowRight size={24} />}
            delay={200}
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
