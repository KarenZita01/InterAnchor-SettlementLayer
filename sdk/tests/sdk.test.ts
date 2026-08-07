import { OmniSettler, OmniSettlerConfig } from '../src'

describe('OmniSettler SDK', () => {
  let settler: OmniSettler

  beforeEach(() => {
    const config: OmniSettlerConfig = {
      apiKey: 'test_api_key',
      network: 'testnet',
    }
    settler = new OmniSettler(config)
  })

  describe('Initialization', () => {
    it('should create an instance with valid config', () => {
      expect(settler).toBeInstanceOf(OmniSettler)
    })

    it('should have correct base URL for testnet', () => {
      expect(settler['config'].network).toBe('testnet')
    })
  })

  describe('Path Finding', () => {
    it('should find a swap path', async () => {
      const result = await settler.findSwapPath({
        sourceAsset: 'USDC',
        sourceAnchor: 'Anchor A',
        targetAsset: 'USDC',
        targetAnchor: 'Anchor C',
        amount: '1000',
      })

      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
    })
  })

  describe('Settlement', () => {
    it('should initiate a settlement', async () => {
      const result = await settler.initiateSettlement({
        customer: 'GABC123XYZ',
        merchant: 'GDEF456UVW',
        sourceAsset: 'USDC',
        sourceAnchor: 'Anchor A',
        amount: '100',
      })

      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
    })
  })

  describe('Preferences', () => {
    it('should set preferences', async () => {
      const result = await settler.setPreferences({
        targetAsset: 'USDC',
        targetAnchor: 'Anchor C',
        maxSlippageBps: 50,
        autoAccept: true,
      })

      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
    })

    it('should get preferences', async () => {
      const result = await settler.getPreferences()
      
      expect(result).toBeDefined()
    })
  })

  describe('Pools', () => {
    it('should get available pools', async () => {
      const pools = await settler.getAvailablePools()
      
      expect(Array.isArray(pools)).toBe(true)
    })

    it('should calculate swap output', async () => {
      const result = await settler.calculateSwapOutput(1, '1000', true)
      
      expect(result).toBeDefined()
    })
  })

  describe('Account Balance', () => {
    it('should get account balance', async () => {
      const balance = await settler.getAccountBalance('GABC123XYZ', 'USDC')
      
      expect(typeof balance).toBe('string')
    })
  })
})
