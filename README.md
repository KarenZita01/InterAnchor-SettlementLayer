# OmniSettler: Automated Inter-Anchor Settlement Layer

[![Stellar Startup Track](https://img.shields.io/badge/Stellar-Startup%20Track-blue)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contracts-green)](https://soroban.stellar.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **The first automated settlement layer that enables seamless cross-anchor payments on Stellar.**

---

## Problem

Stellar's Anchor model has created a **fragmented stablecoin landscape**:

- A merchant accepts "USDC via Circle" (Anchor A)
- A customer holds "USDC via Lobstr" (Anchor B)
- Currently requires **manual swaps** or **multiple anchor relationships**

**This creates friction, increases costs, and limits adoption.**

## Solution

OmniSettler provides **automated, atomic settlement** across different anchor-issued assets:

```
Customer (USDC-Anchor A) → [OmniSettler] → Merchant (USDC-Anchor C)
```

### Key Features

| Feature | Description |
|---------|-------------|
| **Automated Settlement** | No manual swaps needed |
| **Atomic Execution** | All-or-nothing transactions |
| **Real-time Path Finding** | Optimal routing across pools |
| **Merchant SDK** | 3-line integration |
| **Liquidity Pools** | Earn fees by providing liquidity |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OMNISETTLER ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐│
│  │ Settlement      │  │ Liquidity       │  │ Merchant    ││
│  │ Engine          │  │ Vault           │  │ Dashboard   ││
│  │ (Soroban)       │  │ (Soroban)       │  │ (Next.js)   ││
│  └─────────────────┘  └─────────────────┘  └─────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Stellar Blockchain                          ││
│  │  • SEP-24 Deposits/Withdrawals                          ││
│  │  • SEP-6 Anchor Communication                           ││
│  │  • SEP-31 Cross-border Payments                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**[View Full Architecture →](docs/ARCHITECTURE.md)**

---

## Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/KarenZita01/InterAnchor-SettlementLayer.git
cd InterAnchor-SettlementLayer

# Install dependencies
cd contracts && cargo build
cd ../frontend && npm install
cd ../sdk && npm install
```

### Deploy to Testnet

```bash
# Deploy Settlement Engine
cd contracts
stellar contract deploy \
  --wasm settlement-engine/target/wasm32-unknown-unknown/release/settlement_engine.wasm \
  --source admin \
  --network testnet

# Deploy Liquidity Vault
stellar contract deploy \
  --wasm liquidity-vault/target/wasm32-unknown-unknown/release/liquidity_vault.wasm \
  --source admin \
  --network testnet
```

### Run Frontend

```bash
cd frontend
npm run dev
```

---

## SDK Integration

```typescript
import { OmniSettler } from '@omnisettler/sdk';

// Initialize
const settler = new OmniSettler({
  apiKey: 'your-api-key',
  network: 'testnet'
});

// Set preferences (merchant receives USDC via Circle)
await settler.setPreferences({
  targetAsset: 'USDC',
  targetAnchor: 'Circle',
  maxSlippageBps: 50,
  autoAccept: true
});

// Customer initiates payment
const result = await settler.initiateSettlement({
  customer: 'GABC...XYZ',
  merchant: 'GDEF...UVW',
  sourceAsset: 'USDC',
  sourceAnchor: 'Lobstr',
  amount: '100'
});

console.log(result.settlementId); // Settlement ID
console.log(result.finalAmount);  // Amount received
```

**[View SDK Documentation →](sdk/README.md)**

---

## Supported Anchors (MVP)

| Anchor | Asset | Testnet Issuer |
|--------|-------|----------------|
| **Circle** | USDC | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |
| **Lobstr** | USD | `GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX` |
| **SDF Test** | SRT | `GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B` |

---

## Smart Contracts

### Settlement Engine

```rust
// Initialize
fn initialize(env: Env, admin: Address);

// Set merchant preferences
fn set_merchant_preferences(
    env: Env,
    merchant: Address,
    target_asset: Symbol,
    target_anchor: Symbol,
    max_slippage_bps: u32,
    auto_accept: bool,
);

// Initiate settlement
fn initiate_settlement(
    env: Env,
    customer: Address,
    merchant: Address,
    source_asset: Symbol,
    source_anchor: Symbol,
    amount: i128,
) -> u64;

// Execute settlement (admin only)
fn execute_settlement(
    env: Env,
    settlement_id: u64,
    swap_path: SwapPath,
    final_amount: i128,
) -> bool;
```

### Liquidity Vault

```rust
// Create pool
fn create_pool(
    env: Env,
    asset_a: Symbol,
    anchor_a: Symbol,
    asset_b: Symbol,
    anchor_b: Symbol,
    fee_bps: u32,
) -> u64;

// Add liquidity
fn add_liquidity(
    env: Env,
    provider: Address,
    pool_id: u64,
    amount_a: i128,
    amount_b: i128,
) -> i128;

// Swap
fn swap(
    env: Env,
    trader: Address,
    pool_id: u64,
    amount_in: i128,
    min_amount_out: i128,
    a_to_b: bool,
) -> SwapResult;
```

---

## Target Users

| User | Benefit |
|------|---------|
| **B2B Merchants** | Accept any stablecoin, receive preferred asset |
| **Payment Gateways** | Route payments from any anchor to single settlement |
| **Anchors** | Increase asset velocity, earn fees |
| **Liquidity Providers** | Earn fees from cross-anchor swaps |

---

## Roadmap

### Phase 1: MVP (Current)
- [x] Settlement Engine contract
- [x] Liquidity Vault contract
- [x] Merchant Dashboard
- [ ] SDK (In Progress)
- [ ] Testnet deployment

### Phase 2: Testnet Launch
- [ ] SDK published to npm
- [ ] Path-finding algorithm
- [ ] 10+ test merchants
- [ ] Integration testing

### Phase 3: Mainnet
- [ ] Security audit
- [ ] Mainnet deployment
- [ ] 50+ merchants
- [ ] $1M+ settlement volume

---

## Budget (SCF Submission)

| Tranche | Deliverable | Amount |
|---------|-------------|--------|
| **Tranche 1** | MVP Completion | $50,000 |
| **Tranche 2** | Testnet Launch | $50,000 |
| **Tranche 3** | Mainnet Launch | $50,000 |
| **Total** | | **$150,000** |

**[View Full SCF Submission →](docs/SCF_SUBMISSION.md)**

---

## Development

### Prerequisites

- [Rust](https://rustup.rs/) v1.84+
- [Stellar CLI](https://soroban.stellar.org/docs/getting-started/setup)
- [Node.js](https://nodejs.org/) v18+

### Build Contracts

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

### Run Tests

```bash
# Contract tests
cd contracts && cargo test

# SDK tests
cd sdk && npm test
```

### Frontend Development

```bash
cd frontend
npm run dev
```

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and data flow
- [API Reference](docs/API.md) - Smart contract interfaces
- [SDK Guide](sdk/README.md) - Integration documentation
- [Deployment](DEPLOYMENT.md) - Testnet/mainnet deployment
- [SCF Submission](docs/SCF_SUBMISSION.md) - Budget and milestones

---

## License

MIT License - see [LICENSE](LICENSE)

---

## Contact

**Karen Zita** - karenzitaagbo@gmail.com

**GitHub**: https://github.com/KarenZita01/InterAnchor-SettlementLayer

---

Built for the [Stellar Startup Track](https://stellar.org)
