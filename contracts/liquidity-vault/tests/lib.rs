#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env, String};
use liquidity_vault::LiquidityVault;

#[test]
fn test_initialize() {
    let env = Env::default();
    let admin = Address::generate(&env);

    env.mock_all_auths();

    LiquidityVault::initialize(env.clone(), admin);
}

#[test]
fn test_create_pool() {
    let env = Env::default();
    let admin = Address::generate(&env);

    env.mock_all_auths();

    LiquidityVault::initialize(env.clone(), admin.clone());

    let pool_id = LiquidityVault::create_pool(
        env.clone(),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor A"),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor C"),
        30,
    );

    assert_eq!(pool_id, 0);

    let pool = LiquidityVault::get_pool(env, pool_id);
    assert_eq!(pool.asset_a, String::from_str(&env, "USDC"));
    assert_eq!(pool.anchor_a, String::from_str(&env, "Anchor A"));
    assert_eq!(pool.fee_bps, 30);
}

#[test]
fn test_add_liquidity() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let provider = Address::generate(&env);

    env.mock_all_auths();

    LiquidityVault::initialize(env.clone(), admin);

    let pool_id = LiquidityVault::create_pool(
        env.clone(),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor A"),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor C"),
        30,
    );

    let shares = LiquidityVault::add_liquidity(
        env.clone(),
        provider,
        pool_id,
        10000,
        9800,
    );

    assert!(shares > 0);

    let pool = LiquidityVault::get_pool(env.clone(), pool_id);
    assert_eq!(pool.reserve_a, 10000);
    assert_eq!(pool.reserve_b, 9800);
}

#[test]
fn test_swap() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let provider = Address::generate(&env);
    let trader = Address::generate(&env);

    env.mock_all_auths();

    LiquidityVault::initialize(env.clone(), admin);

    let pool_id = LiquidityVault::create_pool(
        env.clone(),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor A"),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor C"),
        30,
    );

    LiquidityVault::add_liquidity(
        env.clone(),
        provider,
        pool_id,
        50000,
        48500,
    );

    let result = LiquidityVault::swap(
        env.clone(),
        trader,
        pool_id,
        1000,
        900,
        true,
    );

    assert!(result.amount_out > 0);
    assert!(result.fee > 0);

    let pool = LiquidityVault::get_pool(env, pool_id);
    assert_eq!(pool.reserve_a, 51000);
    assert!(pool.reserve_b < 48500);
}

#[test]
fn test_remove_liquidity() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let provider = Address::generate(&env);

    env.mock_all_auths();

    LiquidityVault::initialize(env.clone(), admin);

    let pool_id = LiquidityVault::create_pool(
        env.clone(),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor A"),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor C"),
        30,
    );

    let shares = LiquidityVault::add_liquidity(
        env.clone(),
        provider.clone(),
        pool_id,
        10000,
        9800,
    );

    let (amount_a, amount_b) = LiquidityVault::remove_liquidity(
        env.clone(),
        provider,
        pool_id,
        shares,
    );

    assert!(amount_a > 0);
    assert!(amount_b > 0);
}

#[test]
fn test_calculate_swap_output() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let provider = Address::generate(&env);

    env.mock_all_auths();

    LiquidityVault::initialize(env.clone(), admin);

    let pool_id = LiquidityVault::create_pool(
        env.clone(),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor A"),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor C"),
        30,
    );

    LiquidityVault::add_liquidity(
        env.clone(),
        provider,
        pool_id,
        50000,
        48500,
    );

    let result = LiquidityVault::calculate_swap_output(
        env,
        pool_id,
        1000,
        true,
    );

    assert!(result.amount_out > 0);
    assert!(result.fee > 0);
    assert!(result.price_impact_bps > 0);
}

#[test]
fn test_get_all_pools() {
    let env = Env::default();
    let admin = Address::generate(&env);

    env.mock_all_auths();

    LiquidityVault::initialize(env.clone(), admin.clone());

    LiquidityVault::create_pool(
        env.clone(),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor A"),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor C"),
        30,
    );

    LiquidityVault::create_pool(
        env.clone(),
        String::from_str(&env, "USDT"),
        String::from_str(&env, "Anchor B"),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor C"),
        30,
    );

    let pools = LiquidityVault::get_all_pools(env);
    assert_eq!(pools.len(), 2);
}

#[test]
fn test_toggle_pool() {
    let env = Env::default();
    let admin = Address::generate(&env);

    env.mock_all_auths();

    LiquidityVault::initialize(env.clone(), admin.clone());

    let pool_id = LiquidityVault::create_pool(
        env.clone(),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor A"),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor C"),
        30,
    );

    let is_active = LiquidityVault::toggle_pool(env.clone(), pool_id);
    assert!(!is_active);

    let is_active = LiquidityVault::toggle_pool(env, pool_id);
    assert!(is_active);
}
