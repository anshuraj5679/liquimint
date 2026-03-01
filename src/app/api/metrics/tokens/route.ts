import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import BondingCurveFactoryV3ABI from '@/config/abis/BondingCurveFactoryV3.json';
import { contractAddresses, networkConfig } from '@/config/contracts-v2';

const CACHE_TTL_MS = 30_000;

type CachedPayload = {
  expiresAt: number;
  payload: Record<string, unknown>;
};

let cache: CachedPayload | null = null;

function asAddress(value: string): `0x${string}` {
  return value as `0x${string}`;
}

function getRpcUrl(): string {
  return process.env.AMOY_RPC_URL || process.env.RPC_URL || networkConfig.rpcUrl;
}

function getFactoryAddress(): `0x${string}` {
  const raw = process.env.NEXT_PUBLIC_BONDING_FACTORY || contractAddresses.bondingCurveFactory;
  return asAddress(raw);
}

export async function GET() {
  const now = Date.now();
  if (cache && now < cache.expiresAt) {
    return NextResponse.json({
      ...cache.payload,
      cached: true,
      cacheExpiresAt: cache.expiresAt,
    });
  }

  try {
    const client = createPublicClient({
      transport: http(getRpcUrl()),
    });
    const factory = getFactoryAddress();

    const total = (await client.readContract({
      address: factory,
      abi: BondingCurveFactoryV3ABI,
      functionName: 'getTotalTokens',
    })) as bigint;

    const tokens: Record<string, unknown>[] = [];
    for (let i = 0; i < Number(total); i++) {
      const tokenAddress = (await client.readContract({
        address: factory,
        abi: BondingCurveFactoryV3ABI,
        functionName: 'allTokens',
        args: [BigInt(i)],
      })) as `0x${string}`;

      const info = (await client.readContract({
        address: factory,
        abi: BondingCurveFactoryV3ABI,
        functionName: 'getTokenInfo',
        args: [tokenAddress],
      })) as any;

      tokens.push({
        address: tokenAddress,
        name: String(info?.name || ''),
        symbol: String(info?.symbol || ''),
        curveType: info?.curveType !== undefined ? Number(info.curveType) : null,
        currentPrice: info?.currentPrice ? (info.currentPrice as bigint).toString() : null,
        tvl: info?.tvl ? (info.tvl as bigint).toString() : null,
        totalVolume: info?.totalVolume ? (info.totalVolume as bigint).toString() : null,
        marketCap: info?.marketCap ? (info.marketCap as bigint).toString() : null,
        graduated: Boolean(info?.graduated),
      });
    }

    const payload = {
      tokens,
      fetchedAt: now,
    };
    cache = {
      payload,
      expiresAt: now + CACHE_TTL_MS,
    };

    return NextResponse.json({
      ...payload,
      cached: false,
      cacheExpiresAt: cache.expiresAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load token list',
      },
      { status: 500 }
    );
  }
}
