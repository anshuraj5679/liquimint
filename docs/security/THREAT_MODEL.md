# Threat Model

## Assets
- User funds held in `BondingCurveToken` before graduation.
- LP tokens and lock ownership in `LiquidityController`.
- Factory-level admin controls (`setLiquidityController`, fee/slippage settings, fee withdrawals).
- Off-chain API keys (Gemini, Tenderly) used by app routes.

## Trust Boundaries
- User wallets sign transactions in browser.
- Next.js API routes run server-side with environment secrets.
- Smart contracts execute on Polygon Amoy.
- External dependencies: DEX router/factory, RPC provider, Tenderly API.

## Primary Threats
1. Unauthorized admin action or compromised owner key.
2. Liquidity lock bypass or withdrawal via token transfer edge cases.
3. Bad graduation execution due to poor slippage bounds.
4. Incorrect trade attribution from `tx.origin` poisoning.
5. UI deception from unsupported feature claims or unlabeled estimates.
6. RPC/log-index limits causing incorrect analytics assumptions.

## Mitigations in This Revision
- Removed `tx.origin` attribution for trades; explicit trader is passed from token contract.
- Graduation now uses curve-quoted token minting and non-zero slippage controls.
- `SafeERC20` used for lock/transfer paths in `LiquidityController` and factory LP transfer/approvals.
- Unsupported social/game claims removed from landing surfaces.
- Simplified analytics are explicitly labeled as estimates.
- Backend-cached metrics routes reduce client-side log-scan pressure.
- Deploy scripts support `GOVERNANCE_OWNER` for multisig/timelock ownership handoff.

## Residual Risks
- Owner controls are still immediate if governance owner is an EOA.
- No formal invariant proving tool integrated in CI.
- External router behavior is trusted during graduation.

## Recommended Next Steps
1. Deploy with Safe multisig + `TimelockController` as `GOVERNANCE_OWNER`.
2. Add CI step for static analysis and high-coverage invariant fuzzing.
3. Add operational runbooks for key rotation and incident response.
