import { NextRequest, NextResponse } from 'next/server'

interface PathRequest {
  sourceAsset: string
  sourceAnchor: string
  targetAsset: string
  targetAnchor: string
  amount: string
}

interface SwapHop {
  poolId: number
  assetIn: string
  anchorIn: string
  assetOut: string
  anchorOut: string
  estimatedRate: number
  fee: number
}

interface SwapPathResult {
  hops: SwapHop[]
  estimatedRate: number
  totalFee: number
  priceImpactBps: number
}

interface PathResponse {
  success: boolean
  path?: SwapPathResult & { estimatedOutput: string }
  error?: string
}

const MOCK_POOLS = [
  { id: 1, assetA: 'USDC', anchorA: 'Circle', assetB: 'USDC', anchorB: 'Lobstr', reserveA: 50000, reserveB: 48500, feeBps: 30, isActive: true },
  { id: 2, assetA: 'USD', anchorA: 'Lobstr', assetB: 'USDC', anchorB: 'Circle', reserveA: 25000, reserveB: 24200, feeBps: 30, isActive: true },
  { id: 3, assetA: 'USDC', anchorA: 'Circle', assetB: 'USD', anchorB: 'Lobstr', reserveA: 75000, reserveB: 73500, feeBps: 30, isActive: true },
]

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: PathRequest = await request.json()

    if (!body.sourceAsset || !body.sourceAnchor || !body.targetAsset || !body.targetAnchor || !body.amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const path = calculateOptimalPath(
      body.sourceAsset,
      body.sourceAnchor,
      body.targetAsset,
      body.targetAnchor,
      parseFloat(body.amount)
    )

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'No viable path found' },
        { status: 404 }
      )
    }

    const amountIn = parseFloat(body.amount)
    const estimatedOutput = amountIn * path.estimatedRate

    return NextResponse.json({
      success: true,
      path: {
        ...path,
        estimatedOutput: estimatedOutput.toFixed(7),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateOptimalPath(
  sourceAsset: string,
  sourceAnchor: string,
  targetAsset: string,
  targetAnchor: string,
  amount: number
): SwapPathResult | null {
  if (sourceAsset === targetAsset && sourceAnchor === targetAnchor) {
    return {
      hops: [],
      estimatedRate: 1,
      totalFee: 0,
      priceImpactBps: 0,
    }
  }

  const directPool = MOCK_POOLS.find(
    p => p.isActive &&
    ((p.assetA === sourceAsset && p.anchorA === sourceAnchor && p.assetB === targetAsset && p.anchorB === targetAnchor) ||
     (p.assetA === targetAsset && p.anchorA === targetAnchor && p.assetB === sourceAsset && p.anchorB === sourceAnchor))
  )

  if (directPool) {
    const fee = amount * (directPool.feeBps / 10000)
    const amountAfterFee = amount - fee
    const rate = directPool.reserveB / (directPool.reserveA + amountAfterFee)
    const amountOut = amountAfterFee * rate

    return {
      hops: [{
        poolId: directPool.id,
        assetIn: sourceAsset,
        anchorIn: sourceAnchor,
        assetOut: targetAsset,
        anchorOut: targetAnchor,
        estimatedRate: rate,
        fee,
      }],
      estimatedRate: amountOut / amount,
      totalFee: fee,
      priceImpactBps: Math.round((1 - amountOut / amount) * 10000),
    }
  }

  if (sourceAsset === targetAsset) {
    const intermediateAnchor = sourceAnchor === 'Circle' ? 'Lobstr' : 'Circle'
    
    const pool1 = MOCK_POOLS.find(
      p => p.isActive &&
      ((p.assetA === sourceAsset && p.anchorA === sourceAnchor && p.assetB === targetAsset && p.anchorB === intermediateAnchor) ||
       (p.assetA === targetAsset && p.anchorA === intermediateAnchor && p.assetB === sourceAsset && p.anchorB === sourceAnchor))
    )

    const pool2 = MOCK_POOLS.find(
      p => p.isActive &&
      ((p.assetA === sourceAsset && p.anchorA === intermediateAnchor && p.assetB === targetAsset && p.anchorB === targetAnchor) ||
       (p.assetA === targetAsset && p.anchorA === targetAnchor && p.assetB === sourceAsset && p.anchorB === intermediateAnchor))
    )

    if (pool1 && pool2) {
      const fee1 = amount * (pool1.feeBps / 10000)
      const amountAfterFee1 = amount - fee1
      const rate1 = pool1.reserveB / (pool1.reserveA + amountAfterFee1)
      const amountOut1 = amountAfterFee1 * rate1

      const fee2 = amountOut1 * (pool2.feeBps / 10000)
      const amountAfterFee2 = amountOut1 - fee2
      const rate2 = pool2.reserveB / (pool2.reserveA + amountAfterFee2)
      const amountOut2 = amountAfterFee2 * rate2

      return {
        hops: [
          {
            poolId: pool1.id,
            assetIn: sourceAsset,
            anchorIn: sourceAnchor,
            assetOut: targetAsset,
            anchorOut: intermediateAnchor,
            estimatedRate: rate1,
            fee: fee1,
          },
          {
            poolId: pool2.id,
            assetIn: sourceAsset,
            anchorIn: intermediateAnchor,
            assetOut: targetAsset,
            anchorOut: targetAnchor,
            estimatedRate: rate2,
            fee: fee2,
          },
        ],
        estimatedRate: amountOut2 / amount,
        totalFee: fee1 + fee2,
        priceImpactBps: Math.round((1 - amountOut2 / amount) * 10000),
      }
    }
  }

  return null
}
