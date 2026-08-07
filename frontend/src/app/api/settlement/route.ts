import { NextRequest, NextResponse } from 'next/server'

interface SettlementRequest {
  customer: string
  merchant: string
  sourceAsset: string
  sourceAnchor: string
  amount: string
}

interface SettlementResponse {
  success: boolean
  settlementId?: string
  swapPath?: any
  finalAmount?: string
  fee?: string
  error?: string
}

const MOCK_SETTLEMENTS = new Map<string, any>()

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: SettlementRequest = await request.json()

    if (!body.customer || !body.merchant || !body.sourceAsset || !body.sourceAnchor || !body.amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const settlementId = `STL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const merchantPrefs = await getMerchantPreferences(body.merchant)
    
    if (!merchantPrefs) {
      return NextResponse.json(
        { success: false, error: 'Merchant preferences not found' },
        { status: 404 }
      )
    }

    const swapPath = await findOptimalPath(
      body.sourceAsset,
      body.sourceAnchor,
      merchantPrefs.targetAsset,
      merchantPrefs.targetAnchor,
      body.amount
    )

    if (!swapPath) {
      return NextResponse.json(
        { success: false, error: 'No viable swap path found' },
        { status: 404 }
      )
    }

    const amountIn = parseFloat(body.amount)
    const amountOut = amountIn * swapPath.estimatedRate
    const fee = amountIn * 0.003

    const settlement = {
      id: settlementId,
      ...body,
      targetAsset: merchantPrefs.targetAsset,
      targetAnchor: merchantPrefs.targetAnchor,
      swapPath,
      finalAmount: amountOut.toFixed(7),
      fee: fee.toFixed(7),
      status: 'completed',
      createdAt: new Date().toISOString(),
    }

    MOCK_SETTLEMENTS.set(settlementId, settlement)

    return NextResponse.json({
      success: true,
      settlementId,
      swapPath,
      finalAmount: settlement.finalAmount,
      fee: settlement.fee,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getMerchantPreferences(merchant: string) {
  return {
    targetAsset: 'USDC',
    targetAnchor: 'Anchor C',
    maxSlippageBps: 50,
    autoAccept: true,
  }
}

async function findOptimalPath(
  sourceAsset: string,
  sourceAnchor: string,
  targetAsset: string,
  targetAnchor: string,
  amount: string
) {
  if (sourceAsset === targetAsset && sourceAnchor === targetAnchor) {
    return {
      hops: [],
      estimatedRate: 1,
      totalFee: 0,
      priceImpactBps: 0,
    }
  }

  return {
    hops: [
      { assetIn: sourceAsset, anchorIn: sourceAnchor, assetOut: targetAsset, anchorOut: targetAnchor }
    ],
    estimatedRate: 0.997,
    totalFee: 0.003,
    priceImpactBps: 30,
  }
}
