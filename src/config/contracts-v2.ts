/**
 * LiquiMint contract and network configuration used by active app surfaces.
 */

// Core contract addresses used by hooks/pages in this repository.
export const contractAddresses = {
  bondingCurveFactory: '0xd768F643168eeb0D10b16e7C6DfbC99bEbd68937',
  liquidityController: '0xCC09B43EBA500383B92cc1231Fb3139B41cCf7F2',
  // Kept for deploy script compatibility when syncing frontend config.
  liquidityControllerV3: '0xCC09B43EBA500383B92cc1231Fb3139B41cCf7F2',
  dexRouter: '0xBA5D1f39a0EE67C4DBaA33b739Fc53eBA5DEeb41',
} as const;

export const networkConfig = {
  chainId: 80002,
  name: 'Polygon Amoy Testnet',
  rpcUrl: 'https://rpc-amoy.polygon.technology/',
  blockExplorer: 'https://amoy.polygonscan.com/',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
};

export enum CurveType {
  LINEAR = 0,
  EXPONENTIAL = 1,
  SIGMOID = 2,
}

export const curveTypeInfo = {
  [CurveType.LINEAR]: {
    name: 'Linear',
    description: 'Price increases linearly with supply',
    formula: 'price = initialPrice + (supply x slope)',
    bestFor: 'Stable, predictable growth',
  },
  [CurveType.EXPONENTIAL]: {
    name: 'Exponential',
    description: 'Price grows with increasing slope as supply expands',
    formula: 'price ~= initialPrice * (1.001 ^ supply)',
    bestFor: 'Rapid price appreciation',
  },
  [CurveType.SIGMOID]: {
    name: 'Sigmoid',
    description: 'S-curve with saturation at higher supply',
    formula: 'price = initialPrice / (1 + e^(-k * (supply - midpoint)))',
    bestFor: 'Controlled growth with ceiling',
  },
};

export const contractConfig = {
  bondingCurve: {
    minCreationFee: '0.01',
    maxCreatorRoyalty: 5,
    minBuy: '0.01',
    maxBuy: '10',
    cooldownPeriod: 30,
    graduationThreshold: '100',
  },
  liquidityLock: {
    minDuration: 30,
    maxDuration: 1095,
  },
};

export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default {
  contractAddresses,
  networkConfig,
  contractConfig,
  CurveType,
  curveTypeInfo,
  formatAddress,
};
