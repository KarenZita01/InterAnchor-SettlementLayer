# OmniSettler: Step-by-Step Execution Guide

## Overview

This guide provides detailed procedures for completing each task to make OmniSettler ready for the Stellar Startup Track.

---

## Task 1: Deploy Soroban Contracts to Testnet

### Prerequisites

```bash
# 1. Install Rust (if not installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. Add WASM target
rustup target add wasm32-unknown-unknown

# 3. Install Stellar CLI
cargo install --locked stellar-cli

# 4. Verify installation
stellar --version
```

### Step-by-Step Deployment

#### Step 1.1: Generate Keypair

```bash
# Navigate to project
cd C:\Users\USER\OmniSettler\contracts

# Generate a new keypair
stellar keys generate --network testnet admin

# View the public key
stellar keys address admin

# Fund the account with testnet XLM
curl "https://friendbot.stellar.org?addr=$(stellar keys address admin)"
```

**Expected Output:**
```
Successfully created account [YOUR_PUBLIC_KEY]
```

#### Step 1.2: Build Contracts

```bash
# Build Settlement Engine
cd settlement-engine
cargo build --target wasm32-unknown-unknown --release

# Build Liquidity Vault
cd ../liquidity-vault
cargo build --target wasm32-unknown-unknown --release

# Verify WASM files exist
ls -la target/wasm32-unknown-unknown/release/
```

**Expected Files:**
- `settlement_engine.wasm`
- `liquidity_vault.wasm`

#### Step 1.3: Deploy Settlement Engine

```bash
# Deploy to testnet
SETTLEMENT_ENGINE=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/settlement_engine.wasm \
  --source admin \
  --network testnet)

# Output the contract address
echo "Settlement Engine deployed at: $SETTLEMENT_ENGINE"

# Save to file for later use
echo $SETTLEMENT_ENGINE > ../.contract_address
```

**Expected Output:**
```
Settlement Engine deployed at: CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

#### Step 1.4: Initialize Settlement Engine

```bash
# Initialize the contract with admin
stellar contract invoke \
  --id $SETTLEMENT_ENGINE \
  --source admin \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address admin)
```

**Expected Output:**
```
 Contract invoked successfully
```

#### Step 1.5: Deploy Liquidity Vault

```bash
# Deploy to testnet
LIQUIDITY_VAULT=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/liquidity_vault.wasm \
  --source admin \
  --network testnet)

# Output the contract address
echo "Liquidity Vault deployed at: $LIQUIDITY_VAULT"

# Save to file
echo $LIQUIDITY_VAULT >> ../.contract_address
```

#### Step 1.6: Initialize Liquidity Vault

```bash
# Initialize the contract
stellar contract invoke \
  --id $LIQUIDITY_VAULT \
  --source admin \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address admin)
```

#### Step 1.7: Create Initial Liquidity Pool

```bash
# Create USDC (Circle) / USDC (Lobstr) pool
stellar contract invoke \
  --id $LIQUIDITY_VAULT \
  --source admin \
  --network testnet \
  -- create_pool \
  --asset_a USDC \
  --anchor_a Circle \
  --asset_b USDC \
  --anchor_b Lobstr \
  --fee_bps 30
```

#### Step 1.8: Verify Deployment

```bash
# Check Settlement Engine is initialized
stellar contract invoke \
  --id $SETTLEMENT_ENGINE \
  --network testnet \
  -- get_settlement_stats \
  --merchant $(stellar keys address admin)

# Check Liquidity Vault pools
stellar contract invoke \
  --id $LIQUIDITY_VAULT \
  --network testnet \
  -- get_all_pools
```

### Record Contract Addresses

Save these addresses for frontend integration:

```bash
# Create environment file
cat > ../frontend/.env.local << EOF
NEXT_PUBLIC_SETTLEMENT_ENGINE=$SETTLEMENT_ENGINE
NEXT_PUBLIC_LIQUIDITY_VAULT=$LIQUIDITY_VAULT
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_ADMIN_KEY=$(stellar keys address admin)
EOF
```

---

## Task 2: Test the Full Settlement Flow

### Step 2.1: Create Test Accounts

```bash
# Create merchant account
stellar keys generate --network testnet merchant
curl "https://friendbot.stellar.org?addr=$(stellar keys address merchant)"

# Create customer account
stellar keys generate --network testnet customer
curl "https://friendbot.stellar.org?addr=$(stellar keys address customer)"

# Create LP provider account
stellar keys generate --network testnet lp_provider
curl "https://friendbot.stellar.org?addr=$(stellar keys address lp_provider)"
```

### Step 2.2: Set Merchant Preferences

```bash
# Set merchant to receive USDC via Circle
stellar contract invoke \
  --id $SETTLEMENT_ENGINE \
  --source merchant \
  --network testnet \
  -- set_merchant_preferences \
  --merchant $(stellar keys address merchant) \
  --target_asset USDC \
  --target_anchor Circle \
  --max_slippage_bps 50 \
  --auto_accept true
```

### Step 2.3: Add Liquidity to Pool

```bash
# Add liquidity to the pool
stellar contract invoke \
  --id $LIQUIDITY_VAULT \
  --source lp_provider \
  --network testnet \
  -- add_liquidity \
  --provider $(stellar keys address lp_provider) \
  --pool_id 0 \
  --amount_a 50000000000 \
  --amount_b 48500000000
```

### Step 2.4: Initiate Settlement

```bash
# Customer initiates payment
SETTLEMENT_ID=$(stellar contract invoke \
  --id $SETTLEMENT_ENGINE \
  --source customer \
  --network testnet \
  -- initiate_settlement \
  --customer $(stellar keys address customer) \
  --merchant $(stellar keys address merchant) \
  --source_asset USDC \
  --source_anchor Lobstr \
  --amount 1000000000)

echo "Settlement ID: $SETTLEMENT_ID"
```

### Step 2.5: Find Swap Path

```bash
# Find optimal swap path
stellar contract invoke \
  --id $SETTLEMENT_ENGINE \
  --network testnet \
  -- find_swap_path \
  --source_asset USDC \
  --source_anchor Lobstr \
  --target_asset USDC \
  --target_anchor Circle
```

### Step 2.6: Execute Settlement

```bash
# Execute the settlement (admin only)
stellar contract invoke \
  --id $SETTLEMENT_ENGINE \
  --source admin \
  --network testnet \
  -- execute_settlement \
  --settlement_id $SETTLEMENT_ID \
  --swap_path '{"source_asset":"USDC","source_anchor":"Lobstr","target_asset":"USDC","target_anchor":"Circle","estimated_rate":9970,"liquidity_pool_id":0}' \
  --final_amount 997000000
```

### Step 2.7: Verify Settlement

```bash
# Check settlement status
stellar contract invoke \
  --id $SETTLEMENT_ENGINE \
  --network testnet \
  -- get_settlement \
  --settlement_id $SETTLEMENT_ID

# Check merchant's completed settlements
stellar contract invoke \
  --id $SETTLEMENT_ENGINE \
  --network testnet \
  -- get_settlement_stats \
  --merchant $(stellar keys address merchant)
```

### Step 2.8: Test Swap

```bash
# Test swap on liquidity vault
stellar contract invoke \
  --id $LIQUIDITY_VAULT \
  --source customer \
  --network testnet \
  -- swap \
  --trader $(stellar keys address customer) \
  --pool_id 0 \
  --amount_in 100000000 \
  --min_amount_out 95000000 \
  --a_to_b true
```

---

## Task 3: Record Video Demo

### Required Equipment

- Screen recording software (OBS Studio recommended)
- Microphone
- Stellar testnet accounts (from Task 2)

### Video Structure (3-5 minutes)

#### Section 1: Introduction (30 seconds)

```markdown
Script:
"Hi, I'm Karen Zita, and I'm building OmniSettler - an automated 
inter-anchor settlement layer for Stellar. Let me show you how it works."
```

#### Section 2: Problem Demo (45 seconds)

```markdown
Script:
"Currently, if a merchant accepts USDC via Circle but a customer has 
USDC via Lobstr, they need to manually swap. This creates friction 
and limits adoption. OmniSettler solves this."
```

**Show:**
- Current manual swap process
- Multiple anchor accounts needed
- User friction points

#### Section 3: Solution Demo (2 minutes)

```markdown
Script:
"Let me show you how OmniSettler automates this process."
```

**Show:**

1. **Merchant Dashboard**
   - Open `http://localhost:3000`
   - Show settlement preferences configuration
   - Highlight "USDC via Circle" preference

2. **Customer Payment Flow**
   - Connect Freighter wallet
   - Initiate payment from customer account
   - Show source asset (USDC via Lobstr)

3. **Settlement Execution**
   - Show settlement being created
   - Display swap path finding
   - Show atomic execution

4. **Result**
   - Merchant receives USDC via Circle
   - Show settlement confirmation
   - Display fees and slippage

#### Section 4: Technical Architecture (45 seconds)

```markdown
Script:
"Under the hood, OmniSettler uses Soroban smart contracts for 
atomic settlement and liquidity pools for instant swaps."
```

**Show:**
- Architecture diagram
- Contract interactions
- Liquidity pool mechanics

#### Section 5: SDK Integration (30 seconds)

```markdown
Script:
"Integration is simple with our SDK - just 3 lines of code."
```

**Show:**
```typescript
const settler = new OmniSettler({ apiKey, network });
await settler.setPreferences({ targetAsset: 'USDC', targetAnchor: 'Circle' });
const result = await settler.initiateSettlement({ customer, merchant, amount });
```

#### Section 6: Call to Action (30 seconds)

```markdown
Script:
"OmniSettler makes cross-anchor payments seamless on Stellar. 
We're seeking $150,000 from the Stellar Community Fund to bring 
this to mainnet. Thank you!"
```

### Recording Steps

```bash
# 1. Start frontend
cd frontend
npm run dev

# 2. Open browser to http://localhost:3000

# 3. Start OBS Studio
# - Add Display Capture
# - Add Audio Input Capture
# - Configure recording settings

# 4. Record the demo
# - Follow the script above
# - Show actual contract interactions
# - Highlight key features

# 5. Edit video
# - Add title card
# - Add captions
# - Export as MP4

# 6. Upload to YouTube
# - Unlisted or public
# - Add description with project links
```

---

## Task 4: Get Security Audit

### Step 4.1: Prepare Contracts for Audit

```bash
# Create audit-ready version
cd contracts

# Document contract specifications
cat > AUDIT_SPEC.md << 'EOF'
# OmniSettler Smart Contract Audit Specification

## Contracts to Audit

### 1. Settlement Engine
- File: settlement-engine/src/lib.rs
- Purpose: Cross-anchor settlement management
- Key Functions: initialize, set_merchant_preferences, initiate_settlement, execute_settlement

### 2. Liquidity Vault
- File: liquidity-vault/src/lib.rs
- Purpose: Liquidity pool management and swaps
- Key Functions: initialize, create_pool, add_liquidity, remove_liquidity, swap

## Security Requirements

1. No unauthorized access to admin functions
2. Proper authentication checks (require_auth)
3. Integer overflow/underflow protection
4. Reentrancy protection
5. Proper error handling

## Test Cases

- Unit tests in settlement-engine/tests/lib.rs
- Unit tests in liquidity-vault/tests/lib.rs

## Known Limitations

- Maximum 1000 pools
- Maximum 1,000,000 settlements
EOF
```

### Step 4.2: Contact Audit Services

**Option A: Stellar Audit Bank (Free)**

```markdown
Email to: audit@stellar.org

Subject: Smart Contract Audit Request - OmniSettler

Body:
Dear Stellar Security Team,

I am building OmniSettler, an automated inter-anchor settlement layer 
for the Stellar ecosystem. I would like to request a security audit 
of my Soroban smart contracts.

Project: OmniSettler
Repository: https://github.com/KarenZita01/InterAnchor-SettlementLayer
Contracts: 
- Settlement Engine (settlement-engine/src/lib.rs)
- Liquidity Vault (liquidity-vault/src/lib.rs)

The contracts are deployed on testnet and all tests are passing.

Thank you for your consideration.

Best regards,
Karen Zita
```

**Option B: Third-Party Audit Firms**

| Firm | Cost | Timeline |
|------|------|----------|
| OtterSec | $5,000-15,000 | 2-4 weeks |
| Halborn | $10,000-25,000 | 3-6 weeks |
| Trail of Bits | $20,000-50,000 | 4-8 weeks |

### Step 4.3: Address Audit Findings

```bash
# After audit, create issues for each finding
git checkout -b security-audit-fixes

# Fix issues one by one
# Commit each fix with clear message
git commit -m "fix: [AUDIT-001] Add overflow protection in swap function"

# Update tests
cargo test

# Push fixes
git push origin security-audit-fixes

# Create PR
gh pr create --title "Security Audit Fixes" --body "Addresses findings from security audit"
```

---

## Task 5: Onboard 5+ Pilot Merchants

### Step 5.1: Create Merchant Onboarding Guide

```bash
cat > docs/MERCHANT_ONBOARDING.md << 'EOF'
# OmniSettler Merchant Onboarding Guide

## Welcome!

Thank you for joining OmniSettler. This guide will help you get started.

## Step 1: Create Account

1. Go to https://omnisettler.com/dashboard
2. Click "Connect Wallet"
3. Connect your Freighter wallet
4. Sign the authentication message

## Step 2: Configure Preferences

1. Navigate to Settings
2. Set your preferred asset:
   - Target Asset: USDC
   - Preferred Anchor: Circle (or your choice)
   - Max Slippage: 50 bps (0.5%)
   - Auto-Accept: Enabled

## Step 3: Get API Key

1. Go to Settings → API Keys
2. Copy your API key
3. Keep it secure (never expose in client-side code)

## Step 4: Integrate SDK

```typescript
import { OmniSettler } from '@omnisettler/sdk';

const settler = new OmniSettler({
  apiKey: 'YOUR_API_KEY',
  network: 'mainnet'
});

await settler.setPreferences({
  targetAsset: 'USDC',
  targetAnchor: 'Circle',
  maxSlippageBps: 50,
  autoAccept: true
});
```

## Step 5: Test Payment

1. Go to Dashboard
2. Click "Test Payment"
3. Send a small amount from testnet wallet
4. Verify receipt

## Support

- Email: support@omnisettler.com
- Discord: discord.gg/omnisettler
EOF
```

### Step 5.2: Identify Target Merchants

| Merchant Type | Examples | Outreach Method |
|---------------|----------|-----------------|
| Stellar Wallets | LOBSTR, StellarTerm | Direct email |
| Payment Processors | Wyre, MoonPay | Business development |
| Exchanges | CoinMarketCap, CoinGecko | Partnership |
| E-commerce | Shopify stores | SDK integration |

### Step 5.3: Outreach Template

```markdown
Subject: Partnership Opportunity - Cross-Anchor Payments for [Merchant]

Hi [Name],

I'm building OmniSettler, an automated settlement layer that enables 
merchants to accept any stablecoin and receive their preferred asset.

For [Merchant], this means:
- Accept USDC from any anchor (Circle, Lobstr, etc.)
- Automatically receive USDC via Circle
- No manual swaps or multiple accounts needed

We're launching on Stellar mainnet and looking for pilot partners.

Would you be interested in a 15-minute demo?

Best,
Karen Zita
```

### Step 5.4: Onboard Process

```markdown
Week 1: First Merchant
1. Schedule demo call
2. Share testnet credentials
3. Help with SDK integration
4. Process first settlement
5. Gather feedback

Week 2-3: Second & Third Merchants
1. Apply learnings from first merchant
2. Streamline onboarding
3. Document common issues

Week 4: Fourth & Fifth Merchants
1. Create case studies
2. Publish success stories
3. Build referral program
```

### Step 5.5: Track Metrics

```bash
cat > docs/MERCHANT_METRICS.md << 'EOF'
# Merchant Metrics Dashboard

## Key Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Merchants Onboarded | 5 | 0 |
| Total Settlements | 100 | 0 |
| Total Volume | $50,000 | $0 |
| Avg. Settlement Size | $500 | - |
| Success Rate | 99% | - |

## Tracking

- Dashboard: https://omnisettler.com/analytics
- API: GET /api/v1/merchants
- Reports: Weekly email to team
EOF
```

---

## Task 6: Submit to SCF

### Step 6.1: Prepare Submission

```bash
# Create submission directory
mkdir -p submission

# Copy required files
cp docs/SCF_SUBMISSION.md submission/
cp docs/ARCHITECTURE.md submission/
cp README.md submission/
cp DEPLOYMENT.md submission/

# Create video
# (See Task 3 for recording instructions)

# Upload video to YouTube
# Get unlisted link
```

### Step 6.2: Complete SCF Form

**Required Sections:**

1. **Project Information**
   - Name: OmniSettler
   - Category: Open Track
   - Team: Karen Zita (Lead Developer)

2. **Problem Statement**
   - Use content from `docs/SCF_SUBMISSION.md`

3. **Solution**
   - Technical architecture
   - Stellar integration details

4. **Budget**
   - Tranche 1: $50,000 (MVP)
   - Tranche 2: $50,000 (Testnet)
   - Tranche 3: $50,000 (Mainnet)

5. **Roadmap**
   - Phase 1: Weeks 1-4
   - Phase 2: Weeks 5-8
   - Phase 3: Weeks 9-12

6. **Video Link**
   - YouTube unlisted link

7. **GitHub Repository**
   - https://github.com/KarenZita01/InterAnchor-SettlementLayer

### Step 6.3: Submit

```bash
# 1. Go to https://communityfund.stellar.org
# 2. Click "Submit Project"
# 3. Fill in all required fields
# 4. Upload video link
# 5. Submit before deadline
```

### Step 6.4: Post-Submission

```markdown
Week 1 After Submission:
- Monitor email for reviewer feedback
- Be ready to answer questions
- Prepare for community vote

Week 2-3:
- Respond to any feedback
- Update submission if needed
- Engage with community

Week 4:
- Vote results announced
- If approved: Begin Tranche 1
- If not: Apply feedback and resubmit
```

---

## Task 7: Mainnet Deployment

### Prerequisites

- [ ] Security audit completed
- [ ] All audit findings addressed
- [ ] 5+ pilot merchants onboarded
- [ ] SCF funding approved

### Step 7.1: Generate Mainnet Keypair

```bash
# Generate mainnet admin keypair
stellar keys generate --network mainnet admin-mainnet

# CRITICAL: Back up the secret key securely
# Store in hardware wallet or secure vault

# DO NOT commit secret key to git
```

### Step 7.2: Deploy to Mainnet

```bash
# Deploy Settlement Engine
MAINNET_SETTLEMENT_ENGINE=$(stellar contract deploy \
  --wasm settlement-engine/target/wasm32-unknown-unknown/release/settlement_engine.wasm \
  --source admin-mainnet \
  --network mainnet)

# Deploy Liquidity Vault
MAINNET_LIQUIDITY_VAULT=$(stellar contract deploy \
  --wasm liquidity-vault/target/wasm32-unknown-unknown/release/liquidity_vault.wasm \
  --source admin-mainnet \
  --network mainnet)

# Initialize contracts
stellar contract invoke \
  --id $MAINNET_SETTLEMENT_ENGINE \
  --source admin-mainnet \
  --network mainnet \
  -- initialize \
  --admin $(stellar keys address admin-mainnet)

stellar contract invoke \
  --id $MAINNET_LIQUIDITY_VAULT \
  --source admin-mainnet \
  --network mainnet \
  -- initialize \
  --admin $(stellar keys address admin-mainnet)
```

### Step 7.3: Update Frontend

```bash
cat > frontend/.env.production << EOF
NEXT_PUBLIC_SETTLEMENT_ENGINE=$MAINNET_SETTLEMENT_ENGINE
NEXT_PUBLIC_LIQUIDITY_VAULT=$MAINNET_LIQUIDITY_VAULT
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_STELLAR_NETWORK=public
NEXT_PUBLIC_HORIZON_URL=https://horizon.stellar.org
NEXT_PUBLIC_SOROBAN_URL=https://soroban.stellar.org
EOF
```

### Step 7.4: Deploy Frontend

```bash
cd frontend

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod
```

### Step 7.5: Verify Mainnet

```bash
# Check contracts
stellar contract invoke \
  --id $MAINNET_SETTLEMENT_ENGINE \
  --network mainnet \
  -- get_settlement_stats \
  --merchant $(stellar keys address admin-mainnet)

# Check pools
stellar contract invoke \
  --id $MAINNET_LIQUIDITY_VAULT \
  --network mainnet \
  -- get_all_pools
```

### Step 7.6: Monitor

```bash
# Set up monitoring
# 1. Create alerting rules
# 2. Monitor settlement volume
# 3. Track error rates
# 4. Set up incident response

# Example: Monitor settlements every 5 minutes
while true; do
  stellar contract invoke \
    --id $MAINNET_SETTLEMENT_ENGINE \
    --network mainnet \
    -- get_settlement_stats \
    --merchant $(stellar keys address admin-mainnet)
  sleep 300
done
```

---

## Task Summary

| Task | Duration | Status |
|------|----------|--------|
| Deploy to Testnet | 1 day | Pending |
| Test Full Flow | 2 days | Pending |
| Record Video | 1 day | Pending |
| Security Audit | 2-4 weeks | Pending |
| Onboard Merchants | 4 weeks | Pending |
| Submit to SCF | 1 day | Pending |
| Mainnet Deploy | 1 day | Pending |
| **Total** | **6-8 weeks** | |

---

## Next Steps

1. **Today**: Deploy contracts to testnet (Task 1)
2. **This Week**: Test full flow and record video (Tasks 2-3)
3. **Next Week**: Submit for security audit (Task 4)
4. **Weeks 3-6**: Onboard pilot merchants (Task 5)
5. **Week 7**: Submit to SCF (Task 6)
6. **Week 8+**: Mainnet deployment (Task 7)
