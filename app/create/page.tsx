// app/create/page.tsx
'use client';

import { TokenCreator } from '@/components/token-creator';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateTokenPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 relative">
          <button
            onClick={() => router.back()}
            className="absolute right-0 top-0 p-2 hover:bg-surface rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6 text-foreground/50 hover:text-foreground" />
          </button>
          <h1 className="text-4xl font-bold mb-4">Create Your Token</h1>
          <p className="text-xl text-foreground/70">
            Launch a token that brings your community together
          </p>
        </div>

        <TokenCreator />
      </div>
    </div>
  );
}