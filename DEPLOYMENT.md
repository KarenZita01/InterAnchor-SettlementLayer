# OmniSettler Deployment Guide

This guide covers deploying OmniSettler to Stellar testnet and mainnet.

## Prerequisites

1. **Rust & Soroban CLI**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install --locked soroban-cli
```

2. **Stellar CLI**
```bash
brew install stellar-cli
```

3. **Node.js 18+**
```bash
nvm install 18
```

4. **Freighter Wallet**
Install the Freighter browser extension for transaction signing.

## Testnet Deployment

### 1. Fund Testnet Account

```bash
# Create a new keypair
stellar keys generate --network testnet admin

# Fund the account
curl "https://friendbot.stellar.org?addr=$(stellar keys address admin)"
```

### 2. Build Contracts

```bash
cd contracts

# Install stellar-sdk contract dependencies
stellar contract build settlement-engine
stellar contract build liquidity-vault
```

### 3. Deploy Settlement Engine

```bash
# Deploy
SETTLEMENT_ENGINE=$(stellar contract deploy \
  --wasm settlement-engine/target/wasm32-unknown-unknown/release/settlement_engine.wasm \
  --source admin \
  --network testnet)

echo "Settlement Engine: $SETTLEMENT_ENGINE"

# Initialize
stellar contract invoke \
  --id $SETTLEMENT_ENGINE \
  --source admin \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address admin)
```

### 4. Deploy Liquidity Vault

```bash
# Deploy
LIQUIDITY_VAULT=$(stellar contract deploy \
  --wasm liquidity-vault/target/wasm32-unknown-unknown/release/liquidity_vault.wasm \
  --source admin \
  --network testnet)

echo "Liquidity Vault: $LIQUIDITY_VAULT"

# Initialize
stellar contract invoke \
  --id $LIQUIDITY_VAULT \
  --source admin \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address admin)
```

### 5. Create Initial Liquidity Pool

```bash
# Create USDC (Anchor A) / USDC (Anchor C) pool
stellar contract invoke \
  --id $LIQUIDITY_VAULT \
  --source admin \
  --network testnet \
  -- create_pool \
  --asset_a USDC \
  --anchor_a "Anchor A" \
  --asset_b USDC \
  --anchor_b "Anchor C" \
  --fee_bps 30
```

### 6. Deploy Frontend

```bash
cd frontend

# Set environment variables
cat > .env.local << EOF
NEXT_PUBLIC_SETTLEMENT_ENGINE=$SETTLEMENT_ENGINE
NEXT_PUBLIC_LIQUIDITY_VAULT=$LIQUIDITY_VAULT
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_STELLAR_NETWORK=testnet
EOF

# Build and deploy
npm run build
# Deploy to Vercel, Netlify, or your preferred hosting
```

### 7. Deploy SDK

```bash
cd sdk

# Build
npm run build

# Publish to npm
npm publish --access public
```

## Mainnet Deployment

### 1. Fund Mainnet Account

```bash
# Generate a secure keypair
stellar keys generate --network mainnet admin

# Fund using Friendbot (if available) or exchange
```

### 2. Security Considerations

Before mainnet deployment:

1. **Audit all smart contracts**
2. **Use a hardware wallet or secure key management**
3. **Set up multi-sig for admin operations**
4. **Implement rate limiting**
5. **Set up monitoring and alerting**

### 3. Deploy with Production Settings

```bash
# Deploy Settlement Engine
SETTLEMENT_ENGINE=$(stellar contract deploy \
  --wasm settlement-engine/target/wasm32-unknown-unknown/release/settlement_engine.wasm \
  --source admin \
  --network mainnet)

# Deploy Liquidity Vault
LIQUIDITY_VAULT=$(stellar contract deploy \
  --wasm liquidity-vault/target/wasm32-unknown-unknown/release/liquidity_vault.wasm \
  --source admin \
  --network mainnet)
```

### 4. Environment Variables

```bash
cat > .env.production << EOF
NEXT_PUBLIC_SETTLEMENT_ENGINE=$SETTLEMENT_ENGINE
NEXT_PUBLIC_LIQUIDITY_VAULT=$LIQUIDITY_VAULT
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_STELLAR_NETWORK=public
NEXT_PUBLIC_HORIZON_URL=https://horizon.stellar.org
NEXT_PUBLIC_SOROBAN_URL=https://soroban.stellar.org
EOF
```

## Post-Deployment

### 1. Verify Contracts

```bash
# Check Settlement Engine
stellar contract invoke \
  --id $SETTLEMENT_ENGINE \
  --network testnet \
  -- get_settlement_stats \
  --merchant $(stellar keys address admin)

# Check Liquidity Vault
stellar contract invoke \
  --id $LIQUIDITY_VAULT \
  --network testnet \
  -- get_all_pools
```

### 2. Add Initial Liquidity

```bash
# Fund a liquidity provider account
curl "https://friendbot.stellar.org?addr=$(stellar keys address lp)"

# Add liquidity to the pool
stellar contract invoke \
  --id $LIQUIDITY_VAULT \
  --source lp \
  --network testnet \
  -- add_liquidity \
  --provider $(stellar keys address lp) \
  --pool_id 0 \
  --amount_a 50000 \
  --amount_b 48500
```

### 3. Test Settlement Flow

```typescript
import { OmniSettler } from '@omnisettler/sdk';

const settler = new OmniSettler({
  apiKey: 'test-key',
  network: 'testnet'
});

// Set preferences
await settler.setPreferences({
  targetAsset: 'USDC',
  targetAnchor: 'Anchor C',
  maxSlippageBps: 50,
  autoAccept: true
});

// Initiate test settlement
const result = await settler.initiateSettlement({
  customer: 'GABC...XYZ',
  merchant: 'GDEF...UVW',
  sourceAsset: 'USDC',
  sourceAnchor: 'Anchor A',
  amount: '100'
});

console.log(result);
```

## Monitoring

### Set Up Event Monitoring

```javascript
// Listen for settlement events
const settlementEngine = new stellarSdk.Contract(settlementEngineAddress);

// Subscribe to contract events
const events = await server
  .operations()
  .forContract(settlementEngineAddress)
  .call();

console.log('Recent operations:', events);
```

### Metrics to Track

1. **Settlement Volume**: Total value settled per day/week/month
2. **Settlement Count**: Number of settlements processed
3. **Average Slippage**: Actual vs. expected slippage
4. **Pool Utilization**: How much of available liquidity is being used
5. **Fee Revenue**: Total fees collected

## Troubleshooting

### Common Issues

1. **"Insufficient funds"**
   - Ensure source account has enough balance
   - Check for minimum balance requirements

2. **"Transaction timeout"**
   - Increase timeout in SDK config
   - Check network congestion

3. **"Slippage exceeded"**
   - Increase max_slippage_bps in preferences
   - Check pool liquidity

4. **"Contract not found"**
   - Verify contract ID is correct
   - Ensure you're on the right network

## Support

For deployment issues, open an issue on GitHub or contact the team.
