# OmniSettler: An Automated Inter-Anchor Settlement Layer

[![Stellar Startup Track](https://img.shields.io/badge/Stellar-Startup%20Track-blue)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contracts-green)](https://soroban.stellar.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

OmniSettler is an automated settlement layer that enables seamless cross-anchor payments on the Stellar network. It solves the fragmented anchor landscape by allowing merchants to accept any stablecoin and receive their preferred asset, regardless of which anchor the customer uses.

### The Problem

Stellar's Anchor model has created a fragmented landscape:
- A merchant may accept "USDC via Anchor A"
- A customer may hold "USDC via Anchor B"
- Currently, this requires manual swaps or multiple anchor relationships

### The Solution

OmniSettler provides:
- **Automated Settlement**: Instant, atomic swaps across different anchor-issued assets
- **Merchant Dashboard**: Configure settlement preferences in one place
- **Path-Finding Algorithm**: Finds the cheapest route between anchor-assets in real-time
- **Liquidity Vaults**: Pools where LPs deposit pairs to facilitate swaps

## Architecture

```
Customer → OmniSettler Contract (Swap) → Merchant's Preferred Asset
```

### Components

1. **Settlement Engine** (`contracts/settlement-engine/`)
   - Monitors incoming payments
   - Executes optimal swap paths
   - Manages merchant preferences
   - Ensures atomic settlement

2. **Liquidity Vault** (`contracts/liquidity-vault/`)
   - Pool creation for anchor-asset pairs
   - Liquidity provision and removal
   - Swap execution with fee calculation
   - Price impact protection

3. **Merchant Dashboard** (`frontend/`)
   - Settlement preferences configuration
   - Transaction history and analytics
   - Liquidity pool management
   - Real-time monitoring

4. **Merchant SDK** (`sdk/`)
   - Easy integration with 3 lines of code
   - TypeScript/JavaScript support
   - Path-finding API
   - Settlement initiation

## Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) (for Soroban contracts)
- [Node.js](https://nodejs.org/) v18+ (for frontend and SDK)
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup) (for contract deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/KarenZita01/InterAnchor-SettlementLayer.git
cd InterAnchor-SettlementLayer

# Install contract dependencies
cd contracts && cargo build

# Install frontend dependencies
cd ../frontend && npm install

# Install SDK dependencies
cd ../sdk && npm install
```

### Deploy Contracts

```bash
# Deploy Settlement Engine
cd contracts
soroban contract deploy --wasm settlement-engine/target/wasm32-unknown-unknown/release/settlement_engine.wasm --source admin

# Deploy Liquidity Vault
soroban contract deploy --wasm liquidity-vault/target/wasm32-unknown-unknown/release/liquidity_vault.wasm --source admin
```

### Run Frontend

```bash
cd frontend
npm run dev
```

### Use SDK

```typescript
import { OmniSettler } from '@omnisettler/sdk';

const settler = new OmniSettler({
  apiKey: 'your-api-key',
  network: 'testnet'
});

// Set preferences
await settler.setPreferences({
  targetAsset: 'USDC',
  targetAnchor: 'Anchor C',
  maxSlippageBps: 50,
  autoAccept: true
});

// Initiate settlement
const result = await settler.initiateSettlement({
  customer: 'GABC...XYZ',
  merchant: 'GDEF...UVW',
  sourceAsset: 'USDC',
  sourceAnchor: 'Anchor A',
  amount: '1000'
});
```

## API Reference

### Settlement Engine Contract

#### `initialize(admin: Address)`
Initialize the contract with an admin address.

#### `set_merchant_preferences(merchant, target_asset, target_anchor, max_slippage_bps, auto_accept)`
Configure how a merchant wants to receive payments.

#### `initiate_settlement(customer, merchant, source_asset, source_anchor, amount)`
Start a new settlement transaction.

#### `execute_settlement(settlement_id, swap_path, final_amount)`
Execute a pending settlement with the calculated swap path.

#### `find_swap_path(source_asset, source_anchor, target_asset, target_anchor)`
Find the optimal path for a cross-anchor swap.

### Liquidity Vault Contract

#### `create_pool(asset_a, anchor_a, asset_b, anchor_b, fee_bps)`
Create a new liquidity pool.

#### `add_liquidity(provider, pool_id, amount_a, amount_b)`
Add liquidity to a pool.

#### `remove_liquidity(provider, pool_id, shares)`
Remove liquidity from a pool.

#### `swap(trader, pool_id, amount_in, min_amount_out, a_to_b)`
Execute a swap on a pool.

## Target Users

1. **B2B Merchants**: Accept any stablecoin without managing multiple anchor accounts
2. **Payment Gateways**: Route payments from various anchors to a single settlement account
3. **Anchors**: Increase asset velocity by making them easily swappable

## Roadmap

### MVP (Current)
- Support for top 3 most used anchors (Anchor A, B, C)
- Single stablecoin support (USDC)
- Basic settlement functionality

### Phase 2
- Merchant SDK for easy integration
- Additional anchor support
- Multi-stablecoin support

### Phase 3
- Mainnet deployment
- Advanced path-finding algorithms
- Liquidity incentive programs

### Mainnet Vision
Become the primary liquidity layer for all Stellar Anchors, effectively turning the fragmented anchor network into a single, unified pool of liquidity.

## Technical Highlights

### Path-Finding Algorithm
- Graph-based path finding
- Multi-hop swap support
- Real-time rate optimization
- Slippage protection

### Atomic Settlement
- All-or-nothing transaction execution
- Price impact limits
- Automatic rollback on failure

### Security
- Admin-only pool management
- Merchant auth verification
- Rate limiting and validation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Stellar Development Foundation](https://stellar.org)
- [Soroban Documentation](https://soroban.stellar.org)
- [Stellar Anchors](https://stellar.org/anchors)

## Contact

For questions and support, please open an issue on GitHub.
