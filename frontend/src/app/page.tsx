"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { authenticate, disconnect, getUserAddress } from "@/lib/stacks";

// Dynamically import ManualTransfer, no SSR
const ManualTransfer = dynamic(() => import("@/components/ManualTransfer"), {
  ssr: false,
});

// Dynamically import Vault, no SSR
const Vault = dynamic(() => import("@/components/Vault"), {
  ssr: false,
});

// Dynamically import Landing, no SSR
const Landing = dynamic(() => import("@/components/Landing"), {
  ssr: false,
});

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!getUserAddress());
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6">
        <Landing
          authenticate={authenticate}
          disconnect={disconnect}
          isAuthenticated={isAuthenticated}
        />
        <ManualTransfer />
        <Vault />
      </div>
    </main>
  );
}
