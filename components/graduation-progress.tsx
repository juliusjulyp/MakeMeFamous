'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Address, formatEther } from 'viem'
import { SOCIAL_TOKEN_ABI } from '@/lib/contracts'
import { Button } from '@/components/ui/button'
import { CheckCircle2, TrendingUp, Droplet, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { PriceDisplay } from '@/components/ui/price-display'

interface GraduationProgressProps {
  tokenAddress: Address
  className?: string
}

export default function GraduationProgress({ tokenAddress, className = '' }: GraduationProgressProps) {
  const [isGraduating, setIsGraduating] = useState(false)

  // Check if token has graduated
  const { data: hasGraduated } = useReadContract({
    address: tokenAddress,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'hasGraduated',
  })

  // Get graduation progress
  const { data: graduationProgress, refetch: refetchProgress } = useReadContract({
    address: tokenAddress,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'getGraduationProgress',
  })

  // Get QuickSwap pair address (if graduated)
  const { data: liquidityPool } = useReadContract({
    address: tokenAddress,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'liquidityPool',
    query: {
      enabled: !!hasGraduated,
    },
  })

  // Get graduation timestamp (if graduated)
  const { data: graduatedAt } = useReadContract({
    address: tokenAddress,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'graduatedAt',
    query: {
      enabled: !!hasGraduated,
    },
  })

  // Graduation transaction
  const {
    writeContract: graduateToken,
    data: graduateHash,
    isPending: isGraduatePending,
    isError: isGraduateError,
    error: graduateError,
  } = useWriteContract()

  const { isLoading: isGraduateConfirming, isSuccess: isGraduateSuccess } =
    useWaitForTransactionReceipt({
      hash: graduateHash,
    })

  // Refetch progress after successful graduation
  useEffect(() => {
    if (isGraduateSuccess) {
      refetchProgress()
      setIsGraduating(false)
    }
  }, [isGraduateSuccess, refetchProgress])

  const handleGraduate = () => {
    setIsGraduating(true)
    graduateToken({
      address: tokenAddress,
      abi: SOCIAL_TOKEN_ABI,
      functionName: 'graduateToQuickSwap',
    })
  }

  if (!graduationProgress) {
    return null
  }

  const [supplyProgress, liquidityProgress, isReady, tokensRemaining, maticRemaining] =
    graduationProgress

  // Convert from basis points to percentage (10000 = 100%)
  const supplyPercent = Number(supplyProgress) / 100
  const liquidityPercent = Number(liquidityProgress) / 100

  // If already graduated, show success message
  if (hasGraduated) {
    const graduatedDate = graduatedAt
      ? new Date(Number(graduatedAt) * 1000).toLocaleDateString()
      : 'Recently'

    return (
      <div className={`bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-xl p-6 ${className}`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-500/20 rounded-full">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-green-400 mb-2">
              🎉 Token Graduated!
            </h3>
            <p className="text-muted-foreground mb-4">
              This token has successfully graduated to QuickSwap on {graduatedDate}.
              Trading is now live on the DEX with permanent liquidity!
            </p>

            {liquidityPool && liquidityPool !== '0x0000000000000000000000000000000000000000' && (
              <div className="flex gap-3">
                <a
                  href={`https://quickswap.exchange/#/swap?inputCurrency=ETH&outputCurrency=${tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2">
                    Trade on QuickSwap
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
                <a
                  href={`https://polygonscan.com/address/${liquidityPool}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="flex items-center gap-2">
                    View Liquidity Pool
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show progress towards graduation
  return (
    <div className={`bg-surface/50 border border-primary/20 rounded-xl p-6 ${className}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Graduation Progress
          </h3>
          {isReady && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
              Ready to Graduate! 🎉
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Once this token reaches 800,000 supply and 500 MATIC liquidity, it will graduate to QuickSwap DEX
        </p>
      </div>

      {/* Supply Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">Token Supply</span>
          </div>
          <span className="text-sm font-bold text-blue-400">{supplyPercent.toFixed(1)}%</span>
        </div>

        <div className="relative h-3 bg-background rounded-full overflow-hidden mb-2">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${Math.min(supplyPercent, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Current: {formatEther(BigInt(800000) * BigInt(1e18) - tokensRemaining).slice(0, -2)} tokens</span>
          <span>Target: 800,000 tokens</span>
        </div>
        {tokensRemaining > BigInt(0) && (
          <p className="text-xs text-muted-foreground mt-1">
            {formatEther(tokensRemaining).slice(0, -2)} tokens remaining
          </p>
        )}
      </div>

      {/* Liquidity Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium">MATIC Liquidity</span>
          </div>
          <span className="text-sm font-bold text-cyan-400">{liquidityPercent.toFixed(1)}%</span>
        </div>

        <div className="relative h-3 bg-background rounded-full overflow-hidden mb-2">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ width: `${Math.min(liquidityPercent, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Current: <PriceDisplay maticAmount={formatEther(BigInt(500) * BigInt(1e18) - maticRemaining)} size="sm" />
          </span>
          <span>Target: 500 MATIC</span>
        </div>
        {maticRemaining > BigInt(0) && (
          <p className="text-xs text-muted-foreground mt-1">
            <PriceDisplay maticAmount={formatEther(maticRemaining)} size="sm" /> remaining
          </p>
        )}
      </div>

      {/* Graduation Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-semibold mb-2">What happens at graduation?</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>✅ Token migrates to QuickSwap DEX</li>
          <li>✅ 200,000 tokens paired with 100% of MATIC liquidity</li>
          <li>✅ LP tokens permanently burned (no rug pull possible)</li>
          <li>✅ Full decentralized trading begins</li>
          <li>✅ Bonding curve trading ends</li>
        </ul>
      </div>

      {/* Graduate Button */}
      {isReady && (
        <Button
          onClick={handleGraduate}
          disabled={isGraduatePending || isGraduateConfirming || isGraduating}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-bold text-lg py-6"
        >
          {isGraduatePending || isGraduateConfirming || isGraduating
            ? 'Graduating to QuickSwap...'
            : '🚀 Graduate to QuickSwap'}
        </Button>
      )}

      {/* Error Display */}
      {isGraduateError && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">
            {graduateError?.message || 'Failed to graduate token. Please try again.'}
          </p>
        </div>
      )}

      {/* Success Display */}
      {isGraduateSuccess && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Token successfully graduated to QuickSwap! 🎉
          </p>
          {graduateHash && (
            <a
              href={`https://polygonscan.com/tx/${graduateHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
            >
              View transaction
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
