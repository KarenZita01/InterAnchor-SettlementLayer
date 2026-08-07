#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env, String};
use settlement_engine::SettlementEngine;

#[test]
fn test_initialize() {
    let env = Env::default();
    let admin = Address::generate(&env);

    env.mock_all_auths();

    SettlementEngine::initialize(env.clone(), admin);
}

#[test]
fn test_set_merchant_preferences() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let merchant = Address::generate(&env);

    env.mock_all_auths();

    SettlementEngine::initialize(env.clone(), admin);

    SettlementEngine::set_merchant_preferences(
        env.clone(),
        merchant.clone(),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor C"),
        50,
        true,
    );

    let prefs = SettlementEngine::get_merchant_preferences(env.clone(), merchant);
    assert_eq!(prefs.target_asset, String::from_str(&env, "USDC"));
    assert_eq!(prefs.target_anchor, String::from_str(&env, "Anchor C"));
    assert_eq!(prefs.max_slippage_bps, 50);
    assert!(prefs.auto_accept);
}

#[test]
fn test_initiate_settlement() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let merchant = Address::generate(&env);
    let customer = Address::generate(&env);

    env.mock_all_auths();

    SettlementEngine::initialize(env.clone(), admin);

    SettlementEngine::set_merchant_preferences(
        env.clone(),
        merchant.clone(),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor C"),
        50,
        true,
    );

    let settlement_id = SettlementEngine::initiate_settlement(
        env.clone(),
        customer,
        merchant,
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor A"),
        1000,
    );

    assert_eq!(settlement_id, 0);
}

#[test]
fn test_find_swap_path_same_asset() {
    let env = Env::default();
    let admin = Address::generate(&env);

    SettlementEngine::initialize(env.clone(), admin);

    let path = SettlementEngine::find_swap_path(
        env.clone(),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor A"),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor A"),
    );

    assert_eq!(path.estimated_rate, 10000);
    assert!(path.path.is_empty());
}

#[test]
fn test_find_swap_path_different_anchor_same_asset() {
    let env = Env::default();
    let admin = Address::generate(&env);

    SettlementEngine::initialize(env.clone(), admin);

    let path = SettlementEngine::find_swap_path(
        env.clone(),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor A"),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor C"),
    );

    assert!(!path.path.is_empty());
}

#[test]
fn test_get_pending_settlements() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let merchant = Address::generate(&env);
    let customer = Address::generate(&env);

    env.mock_all_auths();

    SettlementEngine::initialize(env.clone(), admin);

    SettlementEngine::set_merchant_preferences(
        env.clone(),
        merchant.clone(),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor C"),
        50,
        true,
    );

    SettlementEngine::initiate_settlement(
        env.clone(),
        customer,
        merchant.clone(),
        String::from_str(&env, "USDC"),
        String::from_str(&env, "Anchor A"),
        1000,
    );

    let settlements = SettlementEngine::get_pending_settlements(env, merchant);
    assert_eq!(settlements.len(), 1);
}
