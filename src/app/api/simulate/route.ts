import { NextRequest, NextResponse } from 'next/server';

interface AssetChange {
  type: 'SEND' | 'RECEIVE';
  symbol: string;
  amount: string;
  usdValue: number | null;
}

interface SimulationResponse {
  assetChanges: AssetChange[];
  gasFeeNative: string | null;
  gasFeeUSD: number | null;
  warnings: string[];
  unavailable: string[];
}

interface TenderlySimulationRequest {
  unsignedTx: {
    from?: string;
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  };
  chainId: number;
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const requestLog = new Map<string, number[]>();
const CHAIN_ID_AMOY = 80002;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();
    const recent = (requestLog.get(ip) || []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
    if (recent.length >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again in a minute.' },
        { status: 429 }
      );
    }
    recent.push(now);
    requestLog.set(ip, recent);

    const { unsignedTx, chainId }: TenderlySimulationRequest = await request.json();

    if (!unsignedTx || !chainId) {
      return NextResponse.json(
        { error: 'Missing required fields: unsignedTx and chainId' },
        { status: 400 }
      );
    }

    if (!unsignedTx.from || !unsignedTx.to || !unsignedTx.gas || unsignedTx.data === undefined || unsignedTx.value === undefined) {
      return NextResponse.json(
        { error: 'unsignedTx must include from, to, gas, data, and value' },
        { status: 400 }
      );
    }

    // Polygon Amoy only for this project.
    if (chainId !== CHAIN_ID_AMOY) {
      return NextResponse.json(
        { error: `Unsupported chain ID: ${chainId}. Expected ${CHAIN_ID_AMOY}.` },
        { status: 400 }
      );
    }

    const tenderlyApiKey = process.env.TENDERLY_API_KEY;
    if (!tenderlyApiKey) {
      const fallback = buildFallbackSimulation(unsignedTx, 'TENDERLY_API_KEY is not configured. Returning metadata-only safety hints.');
      return NextResponse.json(fallback, { status: 200 });
    }

    const simulationUrl = resolveTenderlySimulationUrl();
    const tenderlyRequest = {
      network_id: String(CHAIN_ID_AMOY),
      from: unsignedTx.from,
      to: unsignedTx.to,
      input: unsignedTx.data,
      gas: parseInt(unsignedTx.gas, 16),
      gas_price: unsignedTx.gasPrice ? parseInt(unsignedTx.gasPrice, 16).toString() : '0',
      value: unsignedTx.value,
      save: false,
      save_if_fails: false,
    };

    const tenderlyResponse = await fetch(simulationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': tenderlyApiKey,
      },
      body: JSON.stringify(tenderlyRequest),
    });

    if (!tenderlyResponse.ok) {
      const errorText = await tenderlyResponse.text();
      console.error('Tenderly simulation request failed:', tenderlyResponse.status, errorText);
      const fallback = buildFallbackSimulation(unsignedTx, `Tenderly request failed (${tenderlyResponse.status}). Returning metadata-only safety hints.`);
      return NextResponse.json(
        fallback,
        { status: 200 }
      );
    }

    const tenderlyData: any = await tenderlyResponse.json();
    const response: SimulationResponse = {
      assetChanges: [],
      gasFeeNative: null,
      gasFeeUSD: null,
      warnings: [],
      unavailable: [],
    };

    const assetChanges = tenderlyData?.transaction?.asset_changes;
    if (Array.isArray(assetChanges)) {
      response.assetChanges = assetChanges
        .map((change: any): AssetChange | null => {
          const amount = change?.amount ?? change?.raw_amount;
          if (!amount || !change?.symbol || !change?.type) return null;
          const normalizedType = String(change.type).toUpperCase();
          if (normalizedType !== 'SEND' && normalizedType !== 'RECEIVE') return null;
          return {
            type: normalizedType as 'SEND' | 'RECEIVE',
            symbol: String(change.symbol),
            amount: String(amount),
            usdValue: typeof change?.usd_value === 'number' ? change.usd_value : null,
          };
        })
        .filter((change: AssetChange | null): change is AssetChange => change !== null);
    } else {
      response.unavailable.push('Asset-level simulation data unavailable from provider response.');
    }

    const gasUsedHex = tenderlyData?.transaction?.gas_used;
    const gasPriceHex = unsignedTx.gasPrice;
    if (gasUsedHex && gasPriceHex) {
      const gasUsed = BigInt(gasUsedHex);
      const gasPrice = BigInt(gasPriceHex);
      const gasFeeWei = gasUsed * gasPrice;
      response.gasFeeNative = gasFeeWei.toString();
    } else {
      response.unavailable.push('Gas fee breakdown unavailable.');
    }

    if (unsignedTx.data && unsignedTx.data !== '0x') {
      if (unsignedTx.data.startsWith('0x095ea7b3')) {
        response.warnings.push('Transaction includes an ERC20 approval.');
      }
      if (unsignedTx.data.startsWith('0xa9059cbb')) {
        response.warnings.push('Transaction includes an ERC20 transfer.');
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { error: 'Simulation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function buildFallbackSimulation(unsignedTx: TenderlySimulationRequest['unsignedTx'], reason: string): SimulationResponse {
  const response: SimulationResponse = {
    assetChanges: [],
    gasFeeNative: null,
    gasFeeUSD: null,
    warnings: [],
    unavailable: [reason],
  };

  if (unsignedTx.data && unsignedTx.data !== '0x') {
    if (unsignedTx.data.startsWith('0x095ea7b3')) {
      response.warnings.push('Transaction includes an ERC20 approval.');
    }
    if (unsignedTx.data.startsWith('0xa9059cbb')) {
      response.warnings.push('Transaction includes an ERC20 transfer.');
    }
  }

  const gasLimit = safeToBigInt(unsignedTx.gas);
  const gasPrice = safeToBigInt(unsignedTx.gasPrice || unsignedTx.maxFeePerGas);
  if (gasLimit !== null && gasPrice !== null) {
    // Fallback uses gas limit * gas price (upper bound), not real gas used.
    response.gasFeeNative = (gasLimit * gasPrice).toString();
  } else {
    response.unavailable.push('Gas fee estimate unavailable without parseable gas and gasPrice/maxFeePerGas.');
  }

  return response;
}

function safeToBigInt(value?: string): bigint | null {
  if (!value) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

function resolveTenderlySimulationUrl(): string {
  const accountSlug = (process.env.TENDERLY_ACCOUNT_SLUG || '').trim();
  const projectSlug = (process.env.TENDERLY_PROJECT_SLUG || '').trim();
  if (accountSlug && projectSlug) {
    return `https://api.tenderly.co/api/v1/account/${accountSlug}/project/${projectSlug}/simulate`;
  }
  return 'https://api.tenderly.co/api/v1/simulate';
}
