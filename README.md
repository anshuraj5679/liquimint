# LiquiMint (Polygon Amoy)

Bonding-curve token launch + trading stack with LP graduation and LP locking.

## Implemented Core Flows
- Create token (`BondingCurveFactoryV3.createToken`)
- Buy token (`BondingCurveToken.buy`)
- Sell token (`BondingCurveToken.sell`)
- Graduate token to DEX LP (`BondingCurveFactoryV3.manualGraduate` / threshold path)
- Lock LP (`LiquidityController.lockLiquidity`)
- Unlock LP (`LiquidityController.unlockLiquidity`)

## Tech Stack
- Next.js 16 + React 19 + TypeScript
- Wagmi + Viem
- Solidity 0.8.20 + Hardhat

## Contracts in Repo
- `contracts/bonding/BondingCurveFactoryV3.sol`
- `contracts/bonding/BondingCurveToken.sol`
- `contracts/security/LiquidityController.sol`
- Test mocks under `contracts/mocks/`

## Local Setup
```bash
npm install
cp .env.example .env
```

Required env keys:
- `AMOY_RPC_URL` (or `RPC_URL` legacy fallback)
- `PRIVATE_KEY`
- `DEX_ROUTER`
- `GOVERNANCE_OWNER` (recommended multisig/timelock owner for new deployments)
- `GOVERNANCE_PROPOSER` + `GOVERNANCE_EXECUTOR` (for timelock deployment)

Optional server APIs:
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (default: `gemini-2.5-flash`)
- `TENDERLY_API_KEY`
- `TENDERLY_ACCOUNT_SLUG` + `TENDERLY_PROJECT_SLUG` (for project-scoped Tenderly simulate endpoint)

## Validate
```bash
npm run lint
npm run typecheck
npm test
```

## Compile
```bash
npm run compile
```

## Deploy (Amoy)
```bash
npm run deploy:governance
npm run deploy:complete
```

This deploys:
1. `TimelockController` (when `deploy:governance` is run)
2. `LiquidityController` (unless `LIQUIDITY_CONTROLLER` is provided)
3. `BondingCurveFactoryV3`
4. Syncs frontend addresses + ABIs via `scripts/sync-frontend.js`

Deployment output is written to `deployment-amoy.json`.

## Vercel Deployment
Build command:
```bash
npm run build
```

Minimum recommended env vars on Vercel:
- `NEXT_PUBLIC_BONDING_FACTORY`
- `NEXT_PUBLIC_LIQUIDITY_CONTROLLER`
- `AMOY_RPC_URL` (or `RPC_URL`)

Optional runtime APIs:
- `GEMINI_API_KEY` and `GEMINI_MODEL`
- `TENDERLY_API_KEY` (+ optional `TENDERLY_ACCOUNT_SLUG`, `TENDERLY_PROJECT_SLUG`)

## Important Behavior
- No hardcoded API keys or private keys in source.
- No mock/fabricated "live" metrics in primary trading/analytics pages.
- If data is unavailable from RPC/API, UI/API returns explicit unavailable/error state.
- Graduation LP add uses non-zero slippage bounds via `graduationSlippageBps`.
- Trade events now attribute `trader` from token-call context, not `tx.origin`.
