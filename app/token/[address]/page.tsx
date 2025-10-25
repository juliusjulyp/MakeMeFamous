import { TokenDetails } from '@/components/token-details';

interface TokenPageProps {
  params: Promise<{
    address: string;
  }>;
}

export default async function TokenPage({ params }: TokenPageProps) {
  const { address } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <TokenDetails tokenAddress={address} />
    </div>
  );
}

export function generateStaticParams() {
  // For demo purposes, we'll generate some example token addresses
  return [
    { address: '0x1234567890123456789012345678901234567890' },
    { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' },
  ];
}