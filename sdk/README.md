# OmniSettler Merchant SDK

The OmniSettler SDK enables seamless integration with the OmniSettler settlement layer for Stellar anchors.

## Installation

```bash
npm install @omnisettler/sdk
```

## Quick Start

```typescript
import { OmniSettler } from '@omnisettler/sdk';

// Initialize the SDK
const settler = new OmniSettler({
  apiKey: 'your-api-key',
  network: 'testnet' // or 'mainnet'
});

// Set your settlement preferences
await settler.setPreferences({
  targetAsset: 'USDC',
  targetAnchor: 'Anchor C',
  maxSlippageBps: 50,
  autoAccept: true
});

// Initiate a settlement
const result = await settler.initiateSettlement({
  customer: 'GABC...XYZ',
  merchant: 'GDEF...UVW',
  sourceAsset: 'USDC',
  sourceAnchor: 'Anchor A',
  amount: '1000'
});

console.log(result.settlementId); // Settlement ID
console.log(result.finalAmount);  // Amount after swap
```

## API Reference

### Constructor

```typescript
new OmniSettler(config: OmniSettlerConfig)
```

**Config Options:**
- `apiKey` (string, required): Your API key
- `network` ('testnet' | 'mainnet', required): Stellar network
- `baseUrl` (string, optional): Custom API base URL
- `timeout` (number, optional): Request timeout in ms (default: 30000)

### Methods

#### `setPreferences(preferences: SettlementPreferences)`

Configure how you want to receive payments.

**Preferences:**
- `targetAsset` (string): Asset code to receive (e.g., 'USDC')
- `targetAnchor` (string): Preferred anchor (e.g., 'Anchor C')
- `maxSlippageBps` (number): Maximum slippage in basis points
- `autoAccept` (boolean): Auto-accept incoming settlements

#### `getPreferences(): Promise<SettlementPreferences | null>`

Get current settlement preferences.

#### `findSwapPath(request: PathRequest): Promise<PathResponse>`

Find the optimal swap path for a cross-anchor transfer.

**Request:**
- `sourceAsset`: Source asset code
- `sourceAnchor`: Source anchor
- `targetAsset`: Target asset code
- `targetAnchor`: Target anchor
- `amount`: Amount to swap

#### `initiateSettlement(request: SettlementRequest): Promise<SettlementResponse>`

Start a new settlement transaction.

**Request:**
- `customer`: Customer's Stellar public key
- `merchant`: Merchant's Stellar public key
- `sourceAsset`: Source asset code
- `sourceAnchor`: Source anchor
- `amount`: Amount to settle

#### `getSettlement(settlementId: string): Promise<any>`

Get details of a specific settlement.

#### `getSettlementHistory(params?: HistoryParams): Promise<any>`

Get settlement history with optional filters.

**Params:**
- `page` (number): Page number
- `limit` (number): Results per page
- `status` (string): Filter by status
- `startDate` (string): Start date filter
- `endDate` (string): End date filter

#### `getAccountBalance(publicKey: string, assetCode: string): Promise<string>`

Get the balance of a specific asset for an account.

#### `getAvailablePools(): Promise<any[]>`

Get all available liquidity pools.

#### `calculateSwapOutput(poolId: number, amountIn: string, aToB: boolean): Promise<SwapOutput | null>`

Calculate expected output for a swap without executing it.

## Error Handling

All methods return objects with a `success` field. Check this before accessing results:

```typescript
const result = await settler.initiateSettlement(request);

if (result.success) {
  console.log('Settlement ID:', result.settlementId);
} else {
  console.error('Error:', result.error);
}
```

## Examples

### Accept Any Stablecoin

```typescript
// Configure to always receive USDC via Anchor C
await settler.setPreferences({
  targetAsset: 'USDC',
  targetAnchor: 'Anchor C',
  maxSlippageBps: 100,
  autoAccept: true
});

// Now any incoming payment (USDC from any anchor, USDT, etc.)
// will be automatically swapped to USDC-Anchor C
```

### Find Best Route

```typescript
const path = await settler.findSwapPath({
  sourceAsset: 'USDT',
  sourceAnchor: 'Anchor B',
  targetAsset: 'USDC',
  targetAnchor: 'Anchor C',
  amount: '5000'
});

if (path.success) {
  console.log('Estimated output:', path.path.estimatedOutput);
  console.log('Price impact:', path.path.priceImpactBps, 'bps');
  console.log('Total fee:', path.path.totalFee);
}
```

### Check Pool Rates

```typescript
const pools = await settler.getAvailablePools();

for (const pool of pools) {
  const output = await settler.calculateSwapOutput(pool.id, '1000', true);
  console.log(`${pool.assetA}/${pool.assetB}: ${output?.amountOut}`);
}
```

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions. Import types as needed:

```typescript
import { 
  OmniSettler, 
  SettlementPreferences, 
  SettlementRequest,
  PathRequest,
  SwapPath 
} from '@omnisettler/sdk';
```

## License

MIT
