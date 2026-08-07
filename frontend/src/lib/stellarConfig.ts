export interface AnchorInfo {
  id: string
  name: string
  domain: string
  homeDomain: string
  supportedAssets: AssetInfo[]
  seps: string[]
  country: string
}

export interface AssetInfo {
  code: string
  issuer: string
  displayName: string
  description: string
}

export interface StellarNetwork {
  horizonUrl: string
  sorobanRpcUrl: string
  networkPassphrase: string
}

export const STELLAR_NETWORKS: Record<string, StellarNetwork> = {
  testnet: {
    horizonUrl: 'https://horizon-testnet.stellar.org',
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
  },
  mainnet: {
    horizonUrl: 'https://horizon.stellar.org',
    sorobanRpcUrl: 'https://soroban.stellar.org',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
  },
}

export const ANCHORS: AnchorInfo[] = [
  {
    id: 'circle',
    name: 'Circle (USDC)',
    domain: 'stellar.org',
    homeDomain: 'centre.io',
    supportedAssets: [
      {
        code: 'USDC',
        issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        displayName: 'USD Coin',
        description: 'Circle\'s USDC stablecoin on Stellar',
      },
    ],
    seps: ['SEP-6', 'SEP-24', 'SEP-31'],
    country: 'Global',
  },
  {
    id: 'sdf-test',
    name: 'SDF Test Anchor',
    domain: 'stellar.org',
    homeDomain: 'anchor-sep-server-testanchor.stellar.org',
    supportedAssets: [
      {
        code: 'SRT',
        issuer: 'GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B',
        displayName: 'Stellar Reference Token',
        description: 'Official test token for anchor integration testing',
      },
    ],
    seps: ['SEP-6', 'SEP-24'],
    country: 'Global',
  },
  {
    id: 'lobstr',
    name: 'LOBSTR / AnchorUSD',
    domain: 'lobstr.co',
    homeDomain: 'lobstr.co',
    supportedAssets: [
      {
        code: 'USD',
        issuer: 'GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX',
        displayName: 'AnchorUSD',
        description: 'USD stablecoin by Lobstr/AnchorUSD',
      },
    ],
    seps: ['SEP-6', 'SEP-24'],
    country: 'Global',
  },
  {
    id: 'moneygram',
    name: 'MoneyGram',
    domain: 'moneygram.com',
    homeDomain: 'moneygram.com',
    supportedAssets: [
      {
        code: 'USDC',
        issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        displayName: 'USDC (via MoneyGram)',
        description: 'USDC cash-in/cash-out via MoneyGram locations',
      },
    ],
    seps: ['SEP-24'],
    country: 'Global (170+ countries)',
  },
]

export const SUPPORTED_ASSETS = [
  {
    code: 'USDC',
    displayName: 'USD Coin',
    anchors: ['circle', 'moneygram'],
    description: 'Circle\'s USDC stablecoin',
  },
  {
    code: 'USD',
    displayName: 'AnchorUSD',
    anchors: ['lobstr'],
    description: 'Lobstr/AnchorUSD stablecoin',
  },
  {
    code: 'SRT',
    displayName: 'Stellar Reference Token',
    anchors: ['sdf-test'],
    description: 'Test token for development',
  },
]

export const DEFAULT_SLIPPAGE_BPS = 50
export const MAX_SLIPPAGE_BPS = 500

export const SETTLEMENT_FEE_BPS = 30
export const MIN_SETTLEMENT_AMOUNT = '0.1'
export const MAX_SETTLEMENT_AMOUNT = '1000000'
