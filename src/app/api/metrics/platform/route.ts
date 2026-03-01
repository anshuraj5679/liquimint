import { NextResponse } from 'next/server';
import { createPublicClient, formatEther, http, parseAbiItem } from 'viem';
import BondingCurveFactoryV3ABI from '@/config/abis/BondingCurveFactoryV3.json';
import { contractAddresses, networkConfig } from '@/config/contracts-v2';

const LOG_SCAN_WINDOW = 120_000n;
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

    const totalTokens = Number(
      (await client.readContract({
        address: factory,
        abi: BondingCurveFactoryV3ABI,
        functionName: 'getTotalTokens',
      })) as bigint
    );

    let totalTvl = 0n;
    for (let i = 0; i < totalTokens; i++) {
      const tokenAddress = (await client.readContract({
        address: factory,
        abi: BondingCurveFactoryV3ABI,
        functionName: 'allTokens',
        args: [BigInt(i)],
      })) as `0x${string}`;

      const tokenInfo = (await client.readContract({
        address: factory,
        abi: BondingCurveFactoryV3ABI,
        functionName: 'getTokenInfo',
        args: [tokenAddress],
      })) as any;

      totalTvl += (tokenInfo?.tvl as bigint) || 0n;
    }

    let totalVolume = 0n;
    let activeTraders: number | null = null;
    try {
      const latestBlock = await client.getBlockNumber();
      const fromBlock = latestBlock > LOG_SCAN_WINDOW ? latestBlock - LOG_SCAN_WINDOW : 0n;
      const logs = await client.getLogs({
        address: factory,
        event: parseAbiItem(
          'event TokenTraded(address indexed tokenAddress,address indexed trader,bool isBuy,uint256 amount,uint256 price,uint256 volume)'
        ),
        fromBlock,
        toBlock: latestBlock,
      });
      const traderSet = new Set<string>();
      for (const log of logs) {
        totalVolume += (log.args.amount as bigint) || 0n;
        if (log.args.trader) {
          traderSet.add(String(log.args.trader).toLowerCase());
        }
      }
      activeTraders = traderSet.size;
    } catch {
      activeTraders = null;
      totalVolume = 0n;
    }

    const payload = {
      totalTokens,
      totalVolumeMatic: formatEther(totalVolume),
      totalTvlMatic: formatEther(totalTvl),
      activeTraders,
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
        error: error instanceof Error ? error.message : 'Failed to load platform metrics',
      },
      { status: 500 }
    );
  }
}
