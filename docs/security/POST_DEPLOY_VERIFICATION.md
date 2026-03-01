# Post-Deploy Verification (Reproducible)

## Preconditions
- `.env` configured for Amoy (`AMOY_RPC_URL`, `PRIVATE_KEY`, `DEX_ROUTER`).
- Deployment addresses present in `deployment-amoy.json`.
- Wallet funded for check transactions.

## Steps
1. Compile contracts:
```bash
npm run compile
```

2. Run test suite:
```bash
npm test
```

3. Execute live deployment checks:
```bash
npm run verify:postdeploy
```

## Expected checks from `verify:postdeploy`
- Contract code exists at factory and liquidity controller addresses.
- Token creation succeeds.
- Buy flow succeeds.
- Sell flow succeeds.
- LP lock flow succeeds.
- Unlock flow succeeds.
- Graduation succeeds when wallet balance and threshold requirements are met.

## Artifacts to archive
- Console JSON output from `verify:postdeploy`.
- Current `deployment-amoy.json`.
- Commit hash of code revision used for verification.

## Governance verification
For grant/judging packets, include:
- Deployed owner address for `BondingCurveFactoryV3` and `LiquidityController`.
- Evidence that owner is multisig/timelock (`GOVERNANCE_OWNER`) and not a single EOA.
