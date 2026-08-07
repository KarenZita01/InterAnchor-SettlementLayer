#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol,
};

const ADMIN: Symbol = symbol_short!("ADMIN");
const PENDING: Symbol = symbol_short!("PENDING");
const DONE: Symbol = symbol_short!("DONE");

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    MerchantPrefs(Address),
    Settlement(u64),
    SettlementCount,
    CompletedCount,
    MerchantSettlement(Address, u64),
}

#[derive(Clone)]
#[contracttype]
pub struct SettlementPreferences {
    pub merchant: Address,
    pub target_asset: Symbol,
    pub target_anchor: Symbol,
    pub max_slippage_bps: u32,
    pub auto_accept: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct PendingSettlement {
    pub id: u64,
    pub customer: Address,
    pub merchant: Address,
    pub source_asset: Symbol,
    pub source_anchor: Symbol,
    pub amount: i128,
    pub target_asset: Symbol,
    pub target_anchor: Symbol,
    pub status: Symbol,
    pub created_at: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct SwapPath {
    pub source_asset: Symbol,
    pub source_anchor: Symbol,
    pub target_asset: Symbol,
    pub target_anchor: Symbol,
    pub estimated_rate: u32,
    pub liquidity_pool_id: u64,
}

#[contract]
pub struct SettlementEngine;

#[contractimpl]
impl SettlementEngine {
    pub fn initialize(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::SettlementCount, &0u64);
        env.storage()
            .instance()
            .set(&DataKey::CompletedCount, &0u64);
    }

    pub fn set_merchant_preferences(
        env: Env,
        merchant: Address,
        target_asset: Symbol,
        target_anchor: Symbol,
        max_slippage_bps: u32,
        auto_accept: bool,
    ) {
        merchant.require_auth();

        let prefs = SettlementPreferences {
            merchant: merchant.clone(),
            target_asset: target_asset.clone(),
            target_anchor: target_anchor.clone(),
            max_slippage_bps,
            auto_accept,
        };

        env.storage()
            .persistent()
            .set(&DataKey::MerchantPrefs(merchant.clone()), &prefs);

        env.events().publish(
            (symbol_short!("PREF_SET"),),
            (merchant, target_asset, target_anchor),
        );
    }

    pub fn get_merchant_preferences(env: Env, merchant: Address) -> SettlementPreferences {
        env.storage()
            .persistent()
            .get(&DataKey::MerchantPrefs(merchant))
            .unwrap_or_else(|| panic!("Merchant preferences not set"))
    }

    pub fn initiate_settlement(
        env: Env,
        customer: Address,
        merchant: Address,
        source_asset: Symbol,
        source_anchor: Symbol,
        amount: i128,
    ) -> u64 {
        customer.require_auth();

        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::SettlementCount)
            .unwrap_or(0);

        let prefs: SettlementPreferences = env
            .storage()
            .persistent()
            .get(&DataKey::MerchantPrefs(merchant.clone()))
            .unwrap_or_else(|| panic!("Merchant preferences not set"));

        let settlement = PendingSettlement {
            id: count,
            customer: customer.clone(),
            merchant: merchant.clone(),
            source_asset: source_asset.clone(),
            source_anchor: source_anchor.clone(),
            amount,
            target_asset: prefs.target_asset.clone(),
            target_anchor: prefs.target_anchor.clone(),
            status: PENDING,
            created_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Settlement(count), &settlement);

        env.storage()
            .instance()
            .set(&DataKey::SettlementCount, &(count + 1));

        env.events().publish(
            (symbol_short!("SETTLE"),),
            (count, customer, merchant, source_asset, amount),
        );

        count
    }

    pub fn execute_settlement(
        env: Env,
        settlement_id: u64,
        swap_path: SwapPath,
        final_amount: i128,
    ) -> bool {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap();

        admin.require_auth();

        let mut settlement: PendingSettlement = env
            .storage()
            .persistent()
            .get(&DataKey::Settlement(settlement_id))
            .unwrap_or_else(|| panic!("Settlement not found"));

        if settlement.status != PENDING {
            panic!("Settlement already processed");
        }

        let prefs: SettlementPreferences = env
            .storage()
            .persistent()
            .get(&DataKey::MerchantPrefs(settlement.merchant.clone()))
            .unwrap();

        let slippage = ((settlement.amount - final_amount) * 10000) / settlement.amount;
        if slippage > prefs.max_slippage_bps as i128 {
            panic!("Slippage exceeds maximum allowed");
        }

        settlement.status = DONE;

        env.storage()
            .persistent()
            .set(&DataKey::Settlement(settlement_id), &settlement);

        let completed_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::CompletedCount)
            .unwrap_or(0);

        env.storage().persistent().set(
            &DataKey::MerchantSettlement(settlement.merchant.clone(), completed_count),
            &settlement,
        );

        env.storage()
            .instance()
            .set(&DataKey::CompletedCount, &(completed_count + 1));

        env.events().publish(
            (symbol_short!("SETT_DONE"),),
            (settlement_id, final_amount, swap_path.estimated_rate),
        );

        true
    }

    pub fn find_swap_path(
        env: Env,
        source_asset: Symbol,
        source_anchor: Symbol,
        target_asset: Symbol,
        target_anchor: Symbol,
    ) -> SwapPath {
        if source_asset == target_asset && source_anchor == target_anchor {
            return SwapPath {
                source_asset,
                source_anchor,
                target_asset,
                target_anchor,
                estimated_rate: 10000,
                liquidity_pool_id: 0,
            };
        }

        SwapPath {
            source_asset,
            source_anchor,
            target_asset,
            target_anchor,
            estimated_rate: 9970,
            liquidity_pool_id: 1,
        }
    }

    pub fn get_pending_settlements(env: Env, merchant: Address) -> soroban_sdk::Vec<PendingSettlement> {
        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::SettlementCount)
            .unwrap_or(0);

        let mut settlements = soroban_sdk::Vec::new(&env);

        for i in 0..count {
            if let Some(settlement) = env
                .storage()
                .persistent()
                .get::<DataKey, PendingSettlement>(&DataKey::Settlement(i))
            {
                if settlement.merchant == merchant && settlement.status == PENDING {
                    settlements.push_back(settlement);
                }
            }
        }

        settlements
    }

    pub fn get_settlement_stats(env: Env, merchant: Address) -> (u64, i128) {
        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::CompletedCount)
            .unwrap_or(0);

        let mut total_settlements = 0u64;
        let mut total_volume = 0i128;

        for i in 0..count {
            if let Some(settlement) = env
                .storage()
                .persistent()
                .get::<DataKey, PendingSettlement>(&DataKey::MerchantSettlement(merchant.clone(), i))
            {
                total_settlements += 1;
                total_volume += settlement.amount;
            }
        }

        (total_settlements, total_volume)
    }

    pub fn get_settlement(env: Env, settlement_id: u64) -> PendingSettlement {
        env.storage()
            .persistent()
            .get(&DataKey::Settlement(settlement_id))
            .unwrap_or_else(|| panic!("Settlement not found"))
    }
}
