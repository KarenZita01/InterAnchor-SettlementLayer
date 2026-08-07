'use client'

import { useState, useEffect, useCallback } from 'react'
import * as StellarSdk from '@stellar/stellar-sdk'

const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org'

export interface StellarAccount {
  publicKey: string
  balances: AccountBalance[]
}

export interface AccountBalance {
  asset: string
  balance: string
  assetType: string
  issuer?: string
}

export interface SettlementRequest {
  customer: string
  merchant: string
  sourceAsset: string
  sourceAnchor: string
  amount: string
}

export function useStellar() {
  const [account, setAccount] = useState<StellarAccount | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const server = new StellarSdk.Horizon.Server(HORIZON_URL)

  const connectWallet = useCallback(async () => {
    setIsConnecting(true)
    setError(null)

    try {
      if (typeof window !== 'undefined' && (window as any).freighter) {
        const freighter = (window as any).freighter
        const publicKey = await freighter.getPublicKey()
        
        const accountData = await server.loadAccount(publicKey)
        const balances: AccountBalance[] = accountData.balances.map((b: any) => ({
          asset: b.asset_type === 'native' ? 'XLM' : b.asset_code,
          balance: b.balance,
          assetType: b.asset_type,
          issuer: b.asset_issuer,
        }))

        setAccount({ publicKey, balances })
        setIsConnected(true)
      } else {
        throw new Error('Freighter wallet not found. Please install the Freighter extension.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }, [server])

  const disconnectWallet = useCallback(() => {
    setAccount(null)
    setIsConnected(false)
  }, [])

  const getAccountBalance = useCallback(async (publicKey: string, assetCode: string): Promise<string> => {
    try {
      const accountData = await server.loadAccount(publicKey)
      const balance = accountData.balances.find((b: any) => 
        b.asset_type === 'native' ? assetCode === 'XLM' : b.asset_code === assetCode
      )
      return balance ? balance.balance : '0'
    } catch {
      return '0'
    }
  }, [server])

  const createPayment = useCallback(async (
    sourceSecret: string,
    destination: string,
    assetCode: string,
    amount: string,
    memo?: string
  ) => {
    try {
      const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret)
      const sourceAccount = await server.loadAccount(sourceKeypair.publicKey())

      let asset: StellarSdk.Asset
      if (assetCode === 'XLM') {
        asset = StellarSdk.Asset.native()
      } else {
        asset = new StellarSdk.Asset(assetCode, process.env.NEXT_PUBLIC_ISSUER_ADDRESS || '')
      }

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: await server.fetchBaseFee(),
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(StellarSdk.Operation.payment({
          destination,
          asset,
          amount,
        }))
        .addMemo(memo ? StellarSdk.Memo.text(memo) : StellarSdk.Memo.none())
        .setTimeout(30)
        .build()

      transaction.sign(sourceKeypair)

      const result = await server.submitTransaction(transaction)
      return { success: true, hash: result.hash }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Transaction failed' 
      }
    }
  }, [server])

  const findSwapPath = useCallback(async (
    sourceAsset: string,
    sourceAnchor: string,
    targetAsset: string,
    targetAnchor: string,
    amount: string
  ) => {
    try {
      const response = await fetch('/api/find-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceAsset,
          sourceAnchor,
          targetAsset,
          targetAnchor,
          amount,
        }),
      })
      return await response.json()
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Path finding failed' }
    }
  }, [])

  const initiateSettlement = useCallback(async (request: SettlementRequest) => {
    try {
      const response = await fetch('/api/settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      return await response.json()
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Settlement failed' }
    }
  }, [])

  return {
    account,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    getAccountBalance,
    createPayment,
    findSwapPath,
    initiateSettlement,
  }
}
