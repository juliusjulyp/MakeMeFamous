import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const tokenName = searchParams.get('name') || 'MakeMeFamous';
  const tokenSymbol = searchParams.get('symbol') || 'FAME';
  const tokenImage = searchParams.get('image') || '';
  const price = searchParams.get('price') || '0';
  const volume = searchParams.get('volume') || '0';
  const holders = searchParams.get('holders') || '0';
  const change = searchParams.get('change') || '0';

  const formatNumber = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const changeNum = parseFloat(change);
  const isPositive = changeNum >= 0;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0a',
          padding: '40px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              borderRadius: '8px',
              marginRight: '12px',
            }}
          >
            <span style={{ color: 'white', fontSize: '20px' }}>✨</span>
          </div>
          <span style={{ color: '#a855f7', fontSize: '24px', fontWeight: 600 }}>
            MakeMeFamous
          </span>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
          {/* Token Image */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '200px',
              height: '200px',
              borderRadius: '100px',
              background: tokenImage ? 'transparent' : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              marginRight: '40px',
              overflow: 'hidden',
            }}
          >
            {tokenImage ? (
              <img
                src={tokenImage}
                alt=""
                width={200}
                height={200}
                style={{ objectFit: 'cover', borderRadius: '100px' }}
              />
            ) : (
              <span style={{ color: 'white', fontSize: '64px', fontWeight: 700 }}>
                {tokenSymbol.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          {/* Token Info */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
              <span style={{ color: 'white', fontSize: '48px', fontWeight: 700, marginRight: '16px' }}>
                {tokenName}
              </span>
              <span style={{ color: '#9ca3af', fontSize: '32px' }}>
                ${tokenSymbol}
              </span>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ color: 'white', fontSize: '36px', fontWeight: 600, marginRight: '16px' }}>
                {formatNumber(price)} MATIC
              </span>
              <span
                style={{
                  color: isPositive ? '#22c55e' : '#ef4444',
                  fontSize: '24px',
                  fontWeight: 600,
                }}
              >
                {isPositive ? '+' : ''}{changeNum.toFixed(2)}%
              </span>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#9ca3af', fontSize: '18px', marginBottom: '4px' }}>Volume</span>
                <span style={{ color: 'white', fontSize: '24px', fontWeight: 600 }}>
                  {formatNumber(volume)} MATIC
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#9ca3af', fontSize: '18px', marginBottom: '4px' }}>Holders</span>
                <span style={{ color: 'white', fontSize: '24px', fontWeight: 600 }}>
                  {holders}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <span style={{ color: '#6b7280', fontSize: '16px' }}>
            Trade social tokens on Polygon
          </span>
          <span style={{ color: '#a855f7', fontSize: '16px' }}>
            makemefamous.xyz
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
