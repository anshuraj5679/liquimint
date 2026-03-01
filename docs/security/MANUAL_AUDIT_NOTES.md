# Manual Audit Notes

Audit date: 2026-03-01  
Reviewer mode: internal pre-judge hardening pass

## Resolved in this revision

1. Trade attribution via `tx.origin`
- Risk: incorrect actor attribution and origin-spoof anti-pattern.
- Fix: factory `updateTokenStats` now accepts explicit `trader` from token call context.

2. Graduation token mint math
- Risk: arbitrary mint (`matic * 1000`) breaks economic consistency.
- Fix: graduation mint uses `quoteGraduationTokenAmount()` based on curve quote logic.

3. Zero-min slippage on graduation LP add
- Risk: unfavorable LP add execution accepted silently.
- Fix: non-zero mins enforced via configurable `graduationSlippageBps`.

4. Unsafe ERC20 operations in lock controller
- Risk: silent failure with non-standard tokens.
- Fix: migrated to `SafeERC20` for `transfer` and `transferFrom` flows.

5. UI/contract mismatch on lock bonus tiers
- Risk: user expectation mismatch and misrepresentation.
- Fix: UI lock options/summary aligned to on-chain tiers `5% / 20% / 60%`.

6. Unsupported product claims on landing
- Risk: overclaiming absent features (games/social/XP).
- Fix: removed unsupported claims from landing ecosystem section.

## Added test coverage
- Emergency unlock penalty behavior.
- Reward exhaustion path.
- Extend-lock max-duration boundary.
- Unauthorized lock operations.
- Failed ERC20 transfer and transferFrom handling.
- Randomized buy/sell sequence invariant checks.
- Double-graduation rejection invariant.

## Residual items
- Governance hardening depends on deploying with multisig/timelock owner (`GOVERNANCE_OWNER`).
- Independent external audit still recommended before production/mainnet rollout.
