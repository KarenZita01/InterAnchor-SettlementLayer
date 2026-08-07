#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol,
};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Pool(u64),
    TotalPools,
    ProviderPosition(u64, Address),
}

#[derive(Clone)]
#[contracttype]
pub struct LiquidityPool {
    pub id: u64,
    pub asset_a: Symbol,
    pub anchor_a: Symbol,
    pub asset_b: Symbol,
    pub anchor_b: Symbol,
    pub reserve_a: i128,
    pub reserve_b: i128,
    pub total_shares: i128,
    pub fee_bps: u32,
    pub is_active: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct ProviderPosition {
    pub provider: Address,
    pub pool_id: u64,
    pub shares: i128,
    pub deposited_a: i128,
    pub deposited_b: i128,
    pub entry_timestamp: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct SwapResult {
    pub amount_in: i128,
    pub amount_out: i128,
    pub fee: i128,
    pub price_impact_bps: u32,
}

#[contract]
pub struct LiquidityVault;

#[contractimpl]
impl LiquidityVault {
    pub fn initialize(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::TotalPools, &0u64);
    }

    pub fn create_pool(
        env: Env,
        asset_a: Symbol,
        anchor_a: Symbol,
        asset_b: Symbol,
        anchor_b: Symbol,
        fee_bps: u32,
    ) -> u64 {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap();

        admin.require_auth();

        if fee_bps > 1000 {
            panic!("Fee cannot exceed 10%");
        }

        let pool_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::TotalPools)
            .unwrap_or(0);

        let pool = LiquidityPool {
            id: pool_count,
            asset_a: asset_a.clone(),
            anchor_a: anchor_a.clone(),
            asset_b: asset_b.clone(),
            anchor_b: anchor_b.clone(),
            reserve_a: 0,
            reserve_b: 0,
            total_shares: 0,
            fee_bps,
            is_active: true,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Pool(pool_count), &pool);

        env.storage()
            .instance()
            .set(&DataKey::TotalPools, &(pool_count + 1));

        env.events().publish(
            (symbol_short!("POOL_CR"),),
            (pool_count, asset_a, anchor_a, asset_b, anchor_b),
        );

        pool_count
    }

    pub fn add_liquidity(
        env: Env,
        provider: Address,
        pool_id: u64,
        amount_a: i128,
        amount_b: i128,
    ) -> i128 {
        provider.require_auth();

        let mut pool: LiquidityPool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .unwrap_or_else(|| panic!("Pool not found"));

        if !pool.is_active {
            panic!("Pool is not active");
        }

        if amount_a <= 0 || amount_b <= 0 {
            panic!("Amounts must be positive");
        }

        let shares = if pool.total_shares == 0 {
            let initial_shares = 1000000;
            pool.reserve_a = amount_a;
            pool.reserve_b = amount_b;
            pool.total_shares = initial_shares;
            initial_shares
        } else {
            let share_a = (amount_a * pool.total_shares) / pool.reserve_a;
            let share_b = (amount_b * pool.total_shares) / pool.reserve_b;
            let shares = if share_a < share_b { share_a } else { share_b };

            pool.reserve_a += amount_a;
            pool.reserve_b += amount_b;
            pool.total_shares += shares;

            shares
        };

        let position = ProviderPosition {
            provider: provider.clone(),
            pool_id,
            shares,
            deposited_a: amount_a,
            deposited_b: amount_b,
            entry_timestamp: env.ledger().timestamp(),
        };

        env.storage().persistent().set(
            &DataKey::ProviderPosition(pool_id, provider.clone()),
            &position,
        );

        env.storage()
            .persistent()
            .set(&DataKey::Pool(pool_id), &pool);

        env.events().publish(
            (symbol_short!("LIQ_ADD"),),
            (provider, pool_id, amount_a, amount_b, shares),
        );

        shares
    }

    pub fn remove_liquidity(
        env: Env,
        provider: Address,
        pool_id: u64,
        shares: i128,
    ) -> (i128, i128) {
        provider.require_auth();

        let mut pool: LiquidityPool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .unwrap_or_else(|| panic!("Pool not found"));

        let mut position: ProviderPosition = env
            .storage()
            .persistent()
            .get(&DataKey::ProviderPosition(pool_id, provider.clone()))
            .unwrap_or_else(|| panic!("Position not found"));

        if position.shares < shares {
            panic!("Insufficient shares");
        }

        let amount_a = (shares * pool.reserve_a) / pool.total_shares;
        let amount_b = (shares * pool.reserve_b) / pool.total_shares;

        pool.reserve_a -= amount_a;
        pool.reserve_b -= amount_b;
        pool.total_shares -= shares;

        position.shares -= shares;
        position.deposited_a -= amount_a;
        position.deposited_b -= amount_b;

        env.storage()
            .persistent()
            .set(&DataKey::Pool(pool_id), &pool);

        env.storage().persistent().set(
            &DataKey::ProviderPosition(pool_id, provider.clone()),
            &position,
        );

        env.events().publish(
            (symbol_short!("LIQ_REM"),),
            (provider, pool_id, shares, amount_a, amount_b),
        );

        (amount_a, amount_b)
    }

    pub fn swap(
        env: Env,
        trader: Address,
        pool_id: u64,
        amount_in: i128,
        min_amount_out: i128,
        a_to_b: bool,
    ) -> SwapResult {
        trader.require_auth();

        let mut pool: LiquidityPool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .unwrap_or_else(|| panic!("Pool not found"));

        if !pool.is_active {
            panic!("Pool is not active");
        }

        if amount_in <= 0 {
            panic!("Amount must be positive");
        }

        let fee = (amount_in * pool.fee_bps as i128) / 10000;
        let amount_in_after_fee = amount_in - fee;

        let (reserve_in, reserve_out) = if a_to_b {
            (pool.reserve_a, pool.reserve_b)
        } else {
            (pool.reserve_b, pool.reserve_a)
        };

        let amount_out = (amount_in_after_fee * reserve_out) / (reserve_in + amount_in_after_fee);

        if amount_out < min_amount_out {
            panic!("Slippage too high");
        }

        let price_impact = ((amount_in_after_fee * 10000) / (reserve_in + amount_in_after_fee)) as u32;

        if a_to_b {
            pool.reserve_a += amount_in;
            pool.reserve_b -= amount_out;
        } else {
            pool.reserve_b += amount_in;
            pool.reserve_a -= amount_out;
        }

        env.storage()
            .persistent()
            .set(&DataKey::Pool(pool_id), &pool);

        env.events().publish(
            (symbol_short!("SWAP"),),
            (trader, pool_id, amount_in, amount_out, a_to_b),
        );

        SwapResult {
            amount_in,
            amount_out,
            fee,
            price_impact_bps: price_impact,
        }
    }

    pub fn get_pool(env: Env, pool_id: u64) -> LiquidityPool {
        env.storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .unwrap_or_else(|| panic!("Pool not found"))
    }

    pub fn get_all_pools(env: Env) -> soroban_sdk::Vec<LiquidityPool> {
        let pool_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::TotalPools)
            .unwrap_or(0);

        let mut pools = soroban_sdk::Vec::new(&env);

        for i in 0..pool_count {
            if let Some(pool) = env
                .storage()
                .persistent()
                .get::<DataKey, LiquidityPool>(&DataKey::Pool(i))
            {
                pools.push_back(pool);
            }
        }

        pools
    }

    pub fn get_provider_position(
        env: Env,
        pool_id: u64,
        provider: Address,
    ) -> ProviderPosition {
        env.storage()
            .persistent()
            .get(&DataKey::ProviderPosition(pool_id, provider))
            .unwrap_or_else(|| panic!("Position not found"))
    }

    pub fn calculate_swap_output(
        env: Env,
        pool_id: u64,
        amount_in: i128,
        a_to_b: bool,
    ) -> SwapResult {
        let pool: LiquidityPool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .unwrap_or_else(|| panic!("Pool not found"));

        let fee = (amount_in * pool.fee_bps as i128) / 10000;
        let amount_in_after_fee = amount_in - fee;

        let (reserve_in, reserve_out) = if a_to_b {
            (pool.reserve_a, pool.reserve_b)
        } else {
            (pool.reserve_b, pool.reserve_a)
        };

        let amount_out = (amount_in_after_fee * reserve_out) / (reserve_in + amount_in_after_fee);
        let price_impact = ((amount_in_after_fee * 10000) / (reserve_in + amount_in_after_fee)) as u32;

        SwapResult {
            amount_in,
            amount_out,
            fee,
            price_impact_bps: price_impact,
        }
    }

    pub fn toggle_pool(env: Env, pool_id: u64) -> bool {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap();

        admin.require_auth();

        let mut pool: LiquidityPool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .unwrap_or_else(|| panic!("Pool not found"));

        pool.is_active = !pool.is_active;

        env.storage()
            .persistent()
            .set(&DataKey::Pool(pool_id), &pool);

        pool.is_active
    }
}
