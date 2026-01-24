'use client';

import dynamic from 'next/dynamic';

const VoiceTransfer = dynamic(() => import('@/components/VoiceTransfer'), {
  ssr: false,
});
+const ManualTransfer = dynamic(() => import('@/components/ManualTransfer'), {
+  ssr: false,
+});

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
-      <VoiceTransfer />
+      <div className="max-w-5xl mx-auto px-6 space-y-10">
+        <ManualTransfer />
+        <VoiceTransfer />
+      </div>
    </main>
  );
}
