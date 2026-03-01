# LiquiMint

Liquidity bootstrapping for new tokens usually fails at launch: teams need upfront capital, price discovery is opaque, and trust drops when liquidity is unlocked or unmanaged. LiquiMint addresses this with a bonding-curve launch flow, automated graduation into DEX liquidity, and on-chain LP lock controls.

## Problem
Most early token launches face three structural issues:
- **Capital barrier**: creators need initial liquidity before users can trade.
- **Weak price discovery**: thin markets and manual listing create unstable pricing.
- **Trust risk**: liquidity can be removed or managed opaquely after launch.

## Solution
LiquiMint is a Polygon Amoy dApp that combines:
- **Bonding-curve token launch** (`BondingCurveFactoryV3` + `BondingCurveToken`)
- **Direct buy/sell from the curve** before DEX listing
- **Graduation to DEX LP** once TVL threshold is met
- **LP locking via LiquidityController** to improve post-graduation trust

This keeps launch friction low while enforcing transparent on-chain liquidity controls.

## Core Product Flows
1. **Create token**
- `BondingCurveFactoryV3.createToken`

2. **Trade on bonding curve**
- `BondingCurveToken.buy`
- `BondingCurveToken.sell`

3. **Graduate to DEX liquidity**
- Auto via threshold or owner-triggered `manualGraduate`
- Graduation uses slippage-bounded LP add

4. **Lock / unlock LP**
- `LiquidityController.lockLiquidity`
- `LiquidityController.unlockLiquidity`
- Emergency unlock path with penalty

## Architecture Breakdown
### 1) On-Chain Layer
Contracts:
- `contracts/bonding/BondingCurveFactoryV3.sol`
- `contracts/bonding/BondingCurveToken.sol`
- `contracts/security/LiquidityController.sol`
- DEX interfaces in `contracts/interfaces/`

Design highlights:
- Factory tracks token lifecycle and trading stats
- Trader attribution is explicit (no `tx.origin` trade attribution)
- Graduation mints curve-quoted liquidity, not arbitrary token amounts
- LP add on graduation uses configurable slippage bounds (`graduationSlippageBps`)
- Token and LP transfers use `SafeERC20` in critical paths

### 2) Frontend Layer (Next.js App Router)
Pages:
- `/` landing
- `/creator` token creation
- `/trade` bonding-curve market UI
- `/liquidity` LP lock/reward operations
- `/analytics` platform analytics
- `/token/[address]` token detail view

Stack:
- Next.js 16, React 19, TypeScript
- Wagmi + Viem for wallet/chain interactions
- Tailwind + component primitives under `src/design-system`

### 3) API / Service Layer (Next.js API routes)
Endpoints:
- `/api/ai-assistant` and `/api/copilot` for AI guidance
- `/api/simulate` for transaction simulation insights
- `/api/metrics/platform` cached platform metrics
- `/api/metrics/tokens` cached token list metrics

Notes:
- APIs degrade gracefully when external keys/providers are unavailable
- Metrics are server-cached to avoid heavy client-side RPC scans

### 4) DevOps / Deployment Layer
- Hardhat for compile/test/deploy
- Scripted deployments in `scripts/`
- Frontend ABI/address sync via `scripts/sync-frontend.js`
- Post-deploy verification script: `scripts/post-deploy-checks.js`

## Repository Structure
```text
contracts/
  bonding/
  interfaces/
  mocks/
  security/
scripts/
src/
  app/
  components/
  config/
  design-system/
  hooks/
  providers/
test/
```

## Security & Governance Notes
- No private keys or secrets committed in source
- LP graduation uses non-zero slippage safeguards
- Liquidity lock operations are covered with negative-path tests
- Deployment supports governance owner separation:
  - `GOVERNANCE_OWNER`
  - optional timelock deployment via `deploy:governance`

## Local Setup
```bash
npm install
cp .env.example .env
```

Minimum env values:
- `AMOY_RPC_URL` (or `RPC_URL` fallback)
- `PRIVATE_KEY`
- `DEX_ROUTER`
- `GOVERNANCE_OWNER`
- `GOVERNANCE_PROPOSER`
- `GOVERNANCE_EXECUTOR`

Optional APIs:
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (default: `gemini-2.5-flash`)
- `TENDERLY_API_KEY`
- `TENDERLY_ACCOUNT_SLUG`
- `TENDERLY_PROJECT_SLUG`

## Development Commands
```bash
npm run dev
npm run lint
npm run typecheck
npm run compile
npm test
npm run test:coverage
```

## Deployment Commands (Amoy)
```bash
npm run deploy:governance
npm run deploy:complete
npm run verify:postdeploy
```

Outputs:
- Deployment metadata is written to `deployment-amoy.json` (gitignored)
- Frontend contract config/ABIs sync through `npm run sync:frontend`

## Vercel Deployment
Build command:
```bash
npm run build
```

Recommended Vercel env vars:
- `NEXT_PUBLIC_BONDING_FACTORY`
- `NEXT_PUBLIC_LIQUIDITY_CONTROLLER`
- `AMOY_RPC_URL` (or `RPC_URL`)

Optional runtime env vars:
- `GEMINI_API_KEY`, `GEMINI_MODEL`
- `TENDERLY_API_KEY`, `TENDERLY_ACCOUNT_SLUG`, `TENDERLY_PROJECT_SLUG`

## Validation Status (Current)
Project currently passes:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`

This repository is configured for a smooth Vercel deployment and includes both unit/integration contract tests and post-deploy verification scripts for Amoy.
