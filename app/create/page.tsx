// app/create/page.tsx
'use client';

import { TokenCreator } from '@/components/token-creator';

export default function CreateTokenPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Create Your Social Token</h1>
          <p className="text-xl text-foreground/70">
            Launch a token that brings your community together
          </p>
        </div>
        
        <TokenCreator />
      </div>
    </div>
  );
}