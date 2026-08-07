import axios, { AxiosInstance } from 'axios'
import * as StellarSdk from '@stellar/stellar-sdk'

export interface OmniSettlerConfig {
  apiKey: string
  network: 'testnet' | 'mainnet'
  baseUrl?: string
  timeout?: number
}

export interface SettlementPreferences {
  targetAsset: string
  targetAnchor: string
  maxSlippageBps: number
  autoAccept: boolean
}

export interface SwapPath {
  hops: SwapHop[]
  estimatedRate: number
  totalFee: number
  priceImpactBps: number
}

export interface SwapHop {
  assetIn: string
  anchorIn: string
  assetOut: string
  anchorOut: string
  estimatedRate: number
  fee: number
}

export interface SettlementRequest {
  customer: string
  merchant: string
  sourceAsset: string
  sourceAnchor: string
  amount: string
}

export interface SettlementResponse {
  success: boolean
  settlementId?: string
  swapPath?: SwapPath
  finalAmount?: string
  fee?: string
  error?: string
}

export interface PathRequest {
  sourceAsset: string
  sourceAnchor: string
  targetAsset: string
  targetAnchor: string
  amount: string
}

export interface PathResponse {
  success: boolean
  path?: SwapPath & { estimatedOutput: string }
  error?: string
}

export class OmniSettler {
  private config: OmniSettlerConfig
  private client: AxiosInstance
  private server: StellarSdk.Horizon.Server

  constructor(config: OmniSettlerConfig) {
    this.config = config
    this.client = axios.create({
      baseURL: config.baseUrl || this.getBaseUrl(),
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    const horizonUrl = config.network === 'mainnet'
      ? 'https://horizon.stellar.org'
      : 'https://horizon-testnet.stellar.org'
    
    this.server = new StellarSdk.Horizon.Server(horizonUrl)
  }

  private getBaseUrl(): string {
    return this.config.network === 'mainnet'
      ? 'https://api.omnisettler.com'
      : 'https://testnet-api.omnisettler.com'
  }

  async setPreferences(preferences: SettlementPreferences): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.client.post('/preferences', preferences)
      return response.data
    } catch (error) {
      return { success: false, error: this.handleError(error) }
    }
  }

  async getPreferences(): Promise<SettlementPreferences | null> {
    try {
      const response = await this.client.get('/preferences')
      return response.data
    } catch (error) {
      return null
    }
  }

  async findSwapPath(request: PathRequest): Promise<PathResponse> {
    try {
      const response = await this.client.post('/find-path', request)
      return response.data
    } catch (error) {
      return { success: false, error: this.handleError(error) }
    }
  }

  async initiateSettlement(request: SettlementRequest): Promise<SettlementResponse> {
    try {
      const response = await this.client.post('/settlement', request)
      return response.data
    } catch (error) {
      return { success: false, error: this.handleError(error) }
    }
  }

  async getSettlement(settlementId: string): Promise<any> {
    try {
      const response = await this.client.get(`/settlement/${settlementId}`)
      return response.data
    } catch (error) {
      return { error: this.handleError(error) }
    }
  }

  async getSettlementHistory(params?: {
    page?: number
    limit?: number
    status?: string
    startDate?: string
    endDate?: string
  }): Promise<any> {
    try {
      const response = await this.client.get('/settlements', { params })
      return response.data
    } catch (error) {
      return { error: this.handleError(error) }
    }
  }

  async getAccountBalance(publicKey: string, assetCode: string): Promise<string> {
    try {
      const account = await this.server.loadAccount(publicKey)
      const balance = account.balances.find((b: any) => 
        b.asset_type === 'native' ? assetCode === 'XLM' : b.asset_code === assetCode
      )
      return balance ? balance.balance : '0'
    } catch (error) {
      return '0'
    }
  }

  async getAvailablePools(): Promise<any[]> {
    try {
      const response = await this.client.get('/pools')
      return response.data.pools || []
    } catch (error) {
      return []
    }
  }

  async calculateSwapOutput(
    poolId: number,
    amountIn: string,
    aToB: boolean
  ): Promise<{ amountOut: string; fee: string; priceImpactBps: number } | null> {
    try {
      const response = await this.client.post('/pools/calculate', {
        poolId,
        amountIn,
        aToB,
      })
      return response.data
    } catch (error) {
      return null
    }
  }

  generatePaymentTransaction(
    sourceKeypair: StellarSdk.Keypair,
    destination: string,
    assetCode: string,
    amount: string,
    memo?: string
  ): StellarSdk.Transaction {
    const asset = assetCode === 'XLM'
      ? StellarSdk.Asset.native()
      : new StellarSdk.Asset(assetCode, process.env.ISSUER_ADDRESS || '')

    const transaction = new StellarSdk.TransactionBuilder(
      new StellarSdk.Account(sourceKeypair.publicKey(), '0'),
      {
        fee: '100',
        networkPassphrase: this.config.network === 'mainnet'
          ? StellarSdk.Networks.PUBLIC
          : StellarSdk.Networks.TESTNET,
      }
    )
      .addOperation(StellarSdk.Operation.payment({
        destination,
        asset,
        amount,
      }))
      .addMemo(memo ? StellarSdk.Memo.text(memo) : StellarSdk.Memo.none())
      .setTimeout(300)
      .build()

    return transaction
  }

  private handleError(error: any): string {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.error || error.message
    }
    return error instanceof Error ? error.message : 'Unknown error'
  }
}

export default OmniSettler
