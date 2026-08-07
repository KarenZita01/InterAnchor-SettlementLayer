# OmniSettler Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              OMNISETTLER ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│   CUSTOMER       │     │   MERCHANT       │     │   LIQUIDITY      │
│   (Anchor A)     │     │   (Anchor C)     │     │   PROVIDER       │
│                  │     │                  │     │                  │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         │ 1. Sends Payment       │                        │ 3. Deposits Liquidity
         │    (USDC via Anchor A) │                        │    (USDC-A + USDC-C)
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          STELLAR BLOCKCHAIN                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │   │
│  │  │ SETTLEMENT      │    │ LIQUIDITY       │    │ PATH FINDER     │     │   │
│  │  │ ENGINE          │◄──►│ VAULT           │◄──►│ ALGORITHM       │     │   │
│  │  │ (Soroban)       │    │ (Soroban)       │    │ (Off-chain)     │     │   │
│  │  │                 │    │                 │    │                 │     │   │
│  │  │ • Preferences   │    │ • Pool Mgmt     │    │ • Graph Search  │     │   │
│  │  │ • Settlements   │    │ • Swaps         │    │ • Rate Calc     │     │   │
│  │  │ • Path Calc     │    │ • LP Shares     │    │ • Optimization  │     │   │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘     │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
         │                        │                        │
         │ 2. Atomic Swap         │ 4. Receives USDC       │ 5. LP Rewards
         │    Execution           │    via Anchor C        │    (Fees)
         ▼                        ▼                        ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│   OMNISETTLER    │     │   MERCHANT       │     │   LP POOL        │
│   CONTRACT       │     │   RECEIVES       │     │   BALANCE        │
│                  │     │                  │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

## Data Flow

### 1. Settlement Flow

```
Customer (USDC-Anchor A)                    Merchant (wants USDC-Anchor C)
         │                                          ▲
         │ 1. Pay $100 USDC                        │
         │    (via SEP-24)                          │
         ▼                                          │
┌─────────────────────────────────────────────────────────────────────┐
│                     OMNISETTLER SETTLEMENT ENGINE                   │
│                                                                     │
│  Step 1: Receive incoming payment                                   │
│          - Source: USDC (Anchor A)                                  │
│          - Amount: $100                                             │
│          - Customer: GABC...XYZ                                     │
│                                                                     │
│  Step 2: Load merchant preferences                                 │
│          - Target: USDC (Anchor C)                                  │
│          - Max slippage: 50 bps                                     │
│          - Auto-accept: true                                        │
│                                                                     │
│  Step 3: Find optimal swap path                                     │
│          ┌─────────────────────────────────────────────────────┐    │
│          │ Path: USDC(A) → Pool → USDC(C)                      │    │
│          │ Rate: 0.997 (0.3% fee)                               │    │
│          │ Output: $99.70                                       │    │
│          └─────────────────────────────────────────────────────┘    │
│                                                                     │
│  Step 4: Execute atomic swap                                        │
│          - Deposit: 100 USDC (Anchor A)                             │
│          - Withdraw: 99.70 USDC (Anchor C)                          │
│          - Fee: 0.30 USDC                                           │
│                                                                     │
│  Step 5: Transfer to merchant                                       │
│          - Recipient: GDEF...UVW                                    │
│          - Asset: USDC (Anchor C)                                   │
│          - Amount: 99.70                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
         │                                          ▲
         │ 2. Settlement Complete                   │ 3. Receive USDC
         │    (Status: DONE)                        │    (Anchor C)
         ▼                                          │
```

### 2. Liquidity Pool Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         LIQUIDITY POOL MECHANICS                                │
└─────────────────────────────────────────────────────────────────────────────────┘

  Liquidity Provider                     Liquidity Pool                    Traders
         │                                      ▲                              │
         │ 1. Deposit                           │                              │
         │    $50,000 USDC (A)                  │                              │
         │    $48,500 USDC (C)                  │                              │
         ▼                                      │                              │
  ┌──────────────────────────────────────────────────────────────────────────┐   │
  │                                                                          │   │
  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
  │  │                    POOL STATE                                    │   │   │
  │  │                                                                  │   │   │
  │  │  Reserve A: 50,000 USDC (Anchor A)                               │   │   │
  │  │  Reserve B: 48,500 USDC (Anchor C)                               │   │   │
  │  │  Total Shares: 1,000,000                                         │   │   │
  │  │  LP Fee: 0.3% (30 bps)                                          │   │   │
  │  │                                                                  │   │   │
  │  └──────────────────────────────────────────────────────────────────┘   │   │
  │                                                                          │   │
  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
  │  │                    SWAP EXECUTION                                │   │   │
  │  │                                                                  │   │   │
  │  │  Input: 1,000 USDC (Anchor A)                                    │   │   │
  │  │  Fee: 3 USDC (0.3%)                                              │   │   │
  │  │  Net Input: 997 USDC                                             │   │   │
  │  │                                                                  │   │   │
  │  │  Constant Product: x * y = k                                     │   │   │
  │  │  New A: 51,000                                                   │   │   │
  │  │  New B: 48,500 * 50,000 / 51,000 = 47,549.02                    │   │   │
  │  │  Output: 48,500 - 47,549.02 = 950.98 USDC (C)                   │   │   │
  │  │                                                                  │   │   │
  │  └──────────────────────────────────────────────────────────────────┘   │   │
  │                                                                          │   │
  └──────────────────────────────────────────────────────────────────────────┘   │
         │                                      ▲                              │
         │ 2. Receive LP Shares                 │ 3. Swap USDC(A) → USDC(C)   │
         │    (Proportional to deposit)         │                              │
         ▼                                      │                              │
```

## Contract Specifications

### Settlement Engine Contract

```rust
// Contract Address: deployed at initialization
// Admin: Can execute settlements and manage system

pub trait SettlementEngineTrait {
    // Initialize the contract with admin
    fn initialize(env: Env, admin: Address);

    // Set merchant settlement preferences
    fn set_merchant_preferences(
        env: Env,
        merchant: Address,
        target_asset: Symbol,      // e.g., "USDC"
        target_anchor: Symbol,     // e.g., "Circle"
        max_slippage_bps: u32,     // e.g., 50 = 0.5%
        auto_accept: bool,         // Auto-settle incoming payments
    );

    // Get merchant preferences
    fn get_merchant_preferences(env: Env, merchant: Address) -> SettlementPreferences;

    // Initiate a new settlement
    fn initiate_settlement(
        env: Env,
        customer: Address,
        merchant: Address,
        source_asset: Symbol,
        source_anchor: Symbol,
        amount: i128,              // Amount in stroops (1 USDC = 10,000,000 stroops)
    ) -> u64;                     // Returns settlement ID

    // Execute a pending settlement (admin only)
    fn execute_settlement(
        env: Env,
        settlement_id: u64,
        swap_path: SwapPath,
        final_amount: i128,
    ) -> bool;

    // Find optimal swap path
    fn find_swap_path(
        env: Env,
        source_asset: Symbol,
        source_anchor: Symbol,
        target_asset: Symbol,
        target_anchor: Symbol,
    ) -> SwapPath;

    // Get pending settlements for merchant
    fn get_pending_settlements(env: Env, merchant: Address) -> Vec<PendingSettlement>;

    // Get settlement statistics
    fn get_settlement_stats(env: Env, merchant: Address) -> (u64, i128);

    // Get specific settlement
    fn get_settlement(env: Env, settlement_id: u64) -> PendingSettlement;
}
```

### Liquidity Vault Contract

```rust
pub trait LiquidityVaultTrait {
    // Initialize the contract with admin
    fn initialize(env: Env, admin: Address);

    // Create a new liquidity pool
    fn create_pool(
        env: Env,
        asset_a: Symbol,      // e.g., "USDC"
        anchor_a: Symbol,     // e.g., "Circle"
        asset_b: Symbol,      // e.g., "USDC"
        anchor_b: Symbol,     // e.g., "Lobstr"
        fee_bps: u32,         // e.g., 30 = 0.3%
    ) -> u64;                 // Returns pool ID

    // Add liquidity to a pool
    fn add_liquidity(
        env: Env,
        provider: Address,
        pool_id: u64,
        amount_a: i128,       // Amount of asset A
        amount_b: i128,       // Amount of asset B
    ) -> i128;                // Returns LP shares

    // Remove liquidity from a pool
    fn remove_liquidity(
        env: Env,
        provider: Address,
        pool_id: u64,
        shares: i128,         // LP shares to burn
    ) -> (i128, i128);        // Returns (amount_a, amount_b)

    // Execute a swap
    fn swap(
        env: Env,
        trader: Address,
        pool_id: u64,
        amount_in: i128,
        min_amount_out: i128,
        a_to_b: bool,         // Swap direction
    ) -> SwapResult;

    // Get pool info
    fn get_pool(env: Env, pool_id: u64) -> LiquidityPool;

    // Get all pools
    fn get_all_pools(env: Env) -> Vec<LiquidityPool>;

    // Get provider position
    fn get_provider_position(
        env: Env,
        pool_id: u64,
        provider: Address,
    ) -> ProviderPosition;

    // Calculate swap output (read-only)
    fn calculate_swap_output(
        env: Env,
        pool_id: u64,
        amount_in: i128,
        a_to_b: bool,
    ) -> SwapResult;

    // Toggle pool active status (admin only)
    fn toggle_pool(env: Env, pool_id: u64) -> bool;
}
```

## Integration Points

### SEP-24 Integration

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SEP-24 FLOW                                           │
└─────────────────────────────────────────────────────────────────────────────────┘

  Customer App                    Anchor Server                    Stellar Network
       │                                │                                │
       │ 1. POST /withdraw              │                                │
       │    {asset_code: "USDC",        │                                │
       │     asset_issuer: "GBBD...",   │                                │
       │     amount: "100"}             │                                │
       │ ──────────────────────────────►│                                │
       │                                │                                │
       │ 2. 200 OK                      │                                │
       │    {account_id: "GABC...",     │                                │
       │     memo_type: "text",         │                                │
       │     memo: "omnisettler-123"}   │                                │
       │ ◄──────────────────────────────│                                │
       │                                │                                │
       │ 3. Create Stellar Payment      │                                │
       │    to anchor account           │                                │
       │ ────────────────────────────────────────────────────────────────►│
       │                                │                                │
       │                                │ 4. Anchor processes            │
       │                                │    and credits customer        │
       │                                │ ◄──────────────────────────────│
       │                                │                                │
```

### SDK Integration

```typescript
// 3-Line Integration Example
import { OmniSettler } from '@omnisettler/sdk';

const settler = new OmniSettler({
  apiKey: 'your-api-key',
  network: 'testnet'
});

// Set preferences
await settler.setPreferences({
  targetAsset: 'USDC',
  targetAnchor: 'Circle',
  maxSlippageBps: 50,
  autoAccept: true
});

// Customer pays → Merchant receives preferred asset
const result = await settler.initiateSettlement({
  customer: 'GABC...XYZ',
  merchant: 'GDEF...UVW',
  sourceAsset: 'USDC',
  sourceAnchor: 'Lobstr',
  amount: '100'
});
```

## Security Model

### Authentication

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

  User Action                    Auth Check                    Contract State
       │                              │                              │
       │ 1. initiate_settlement()     │                              │
       │    ─────────────────────────►│                              │
       │                              │                              │
       │                              │ 2. customer.require_auth()   │
       │                              │    - Verifies signature      │
       │                              │    - Checks authorization    │
       │                              │ ────────────────────────────►│
       │                              │                              │
       │                              │ 3. Load merchant prefs       │
       │                              │    - Check slippage limit    │
       │                              │    - Verify auto_accept      │
       │                              │ ────────────────────────────►│
       │                              │                              │
       │ 4. Settlement Created        │                              │
       │ ◄────────────────────────────│                              │
```

### Access Control

| Role | Permissions |
|------|------------|
| **Admin** | Execute settlements, toggle pools, manage system |
| **Merchant** | Set preferences, view settlements |
| **Customer** | Initiate settlements |
| **LP Provider** | Add/remove liquidity |
| **Trader** | Execute swaps |

## Performance Characteristics

### Gas Optimization

- **Storage**: Uses persistent storage for merchant data (survives across calls)
- **Events**: All state changes emit events for off-chain indexing
- **Batch Operations**: Path finding computed off-chain, only result submitted

### Scalability

- **Horizontal**: Multiple settlement engine instances possible
- **Vertical**: Soroban parallel execution per ledger
- **Off-chain**: Path finding, rate calculation done off-chain

## Testing Strategy

### Unit Tests

```bash
# Run contract tests
cd contracts
cargo test

# Run SDK tests
cd sdk
npm test
```

### Integration Tests

```bash
# Deploy to testnet
stellar contract deploy --wasm settlement-engine.wasm --source admin --network testnet

# Run integration tests
npm run test:integration
```

### Load Testing

- Simulate 100+ concurrent settlements
- Measure gas consumption per operation
- Test path finding under load
