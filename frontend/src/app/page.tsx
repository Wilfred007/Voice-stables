'use client';

import dynamic from 'next/dynamic';

// Dynamically import ManualTransfer, no SSR
const ManualTransfer = dynamic(() => import('@/components/ManualTransfer"), {
  ssr: false,
});

// Dynamically import Vault, no SSR
const Vault = dynamic(() => import('@/components/Vault"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-6">
        <ManualTransfer />
        <Vault />
      </div>
    </main>
  );
}
