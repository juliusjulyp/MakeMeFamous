import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase';

interface Props {
  params: Promise<{ address: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;

  try {
    const supabase = createServerClient();

    const { data: token } = await supabase
      .from('token_metadata')
      .select('*')
      .eq('token_address', address.toLowerCase())
      .single();

    if (!token) {
      return {
        title: 'Token | MakeMeFamous',
        description: 'Trade social tokens on MakeMeFamous',
      };
    }

    const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://makemefamous.xyz'}/api/og?name=${encodeURIComponent(token.name)}&symbol=${encodeURIComponent(token.symbol)}&image=${encodeURIComponent(token.image_url || '')}`;

    return {
      title: `${token.name} ($${token.symbol}) | MakeMeFamous`,
      description: token.description || `Trade ${token.name} ($${token.symbol}) on MakeMeFamous - the social token platform on Polygon`,
      openGraph: {
        title: `${token.name} ($${token.symbol})`,
        description: token.description || `Trade ${token.name} on MakeMeFamous`,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${token.name} token`,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${token.name} ($${token.symbol})`,
        description: token.description || `Trade ${token.name} on MakeMeFamous`,
        images: [ogImageUrl],
      },
    };
  } catch (error) {
    return {
      title: 'Token | MakeMeFamous',
      description: 'Trade social tokens on MakeMeFamous',
    };
  }
}

export default function TokenLayout({ children }: Props) {
  return <>{children}</>;
}
