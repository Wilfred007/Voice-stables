import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Voice Stables',
  description: 'Manual and voice transfers for USDC on Stacks testnet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">{children}</body>
    </html>
  );
}