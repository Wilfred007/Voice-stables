import { ArrowRight, Wallet, LogOut } from "lucide-react";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  delay?: string;
};

function FeatureCard({ title, description, icon, delay = "0ms" }: FeatureCardProps) {
  return (
    <div
      className="group relative p-6 rounded-2xl ring-1 ring-white/10 bg-white/5 backdrop-blur transition-all shadow-lg hover:shadow-xl hover:bg-white/10 hover:-translate-y-0.5 hover:ring-white/20 overflow-hidden"
      style={{ animation: "fade-in 600ms ease forwards", animationDelay: delay }}
    >
      <div className="mb-4 text-white">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-white/70">{description}</p>
    </div>
  );
}

type HeroProps = {
  authenticate: () => void;
  disconnect: () => void;
  isAuthenticated: boolean;
};

export default function Hero({
  authenticate,
  disconnect,
  isAuthenticated,
}: HeroProps) {
  return (
    <section className="relative py-24 md:py-28 overflow-hidden">
      {/* Gradient blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-blue-600/40 via-indigo-600/40 to-fuchsia-600/40 blur-3xl animate-pulse-slow opacity-70" />
        <div className="pointer-events-none absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-teal-400/40 via-sky-500/40 to-purple-500/40 blur-3xl animate-pulse-slow delay-300 opacity-70" />
      </div>

      {/* Floating orbs */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/4 top-12 h-24 w-24 rounded-full bg-white/5 blur-xl animate-float opacity-80" />
        <div className="absolute right-16 top-28 h-12 w-12 rounded-full bg-white/10 blur-lg animate-float [animation-delay:250ms] opacity-80" />
        <div className="absolute right-1/3 bottom-12 h-20 w-20 rounded-full bg-white/5 blur-xl animate-float [animation-delay:500ms] opacity-80" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Hero card */}
        <div className="relative rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900/90 to-gray-900/80 p-8 md:p-14 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur overflow-hidden">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Web3 made simple
            </h1>

            <p className="text-white/70 text-lg mb-8">
              Connect your wallet and start interacting with the next generation
              of decentralized applications.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              {!isAuthenticated ? (
                <button
                  onClick={authenticate}
                  className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2 rounded-full font-semibold shadow-lg hover:bg-white/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/60"
                >
                  <Wallet size={18} />
                  Connect Wallet
                </button>
              ) : (
                <button
                  onClick={disconnect}
                  className="inline-flex items-center gap-2 bg-black/30 hover:bg-black/40 px-5 py-2 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/30"
                >
                  <LogOut size={18} />
                  Disconnect
                </button>
              )}

              <a
                href="#features"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 text-white/90 hover:border-white/40 transition-all hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/30"
              >
                Learn more <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Features */}
        <div
          id="features"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
        >
          <FeatureCard
            title="Secure by default"
            description="Non-custodial authentication with modern security standards."
            icon={<Wallet size={24} />}
            delay="0ms"
          />
          <FeatureCard
            title="Fast onboarding"
            description="Connect and start using the app in seconds."
            icon={<ArrowRight size={24} />}
            delay="100ms"
          />
          <FeatureCard
            title="Built for scale"
            description="Optimized UI and architecture for production dApps."
            icon={<ArrowRight size={24} />}
            delay="200ms"
          />
        </div>
      </div>
    </section>
  );
}
