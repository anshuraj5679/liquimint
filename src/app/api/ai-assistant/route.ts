import { NextRequest, NextResponse } from 'next/server';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;
const requestLog = new Map<string, number[]>();

interface AiAssistantRequest {
    query: string;
    context?: {
        walletAddress?: string;
        balances?: Record<string, number>;
        reputationScore?: number;
        poolData?: any[];
        gasPrice?: string;
    };
}

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

        const body: AiAssistantRequest = await request.json();
        const { query, context = {} } = body;
        const geminiApiKey = resolveGeminiApiKey();

        if (!geminiApiKey) {
            return NextResponse.json(
                {
                    response: 'AI assistant is currently unavailable. Configure GEMINI_API_KEY on the server to enable live responses.',
                    context,
                    timestamp: new Date().toISOString(),
                    unavailable: ['GEMINI_API_KEY is not configured for server-side requests.']
                },
                { status: 200 }
            );
        }

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            );
        }

        // Build context-aware prompt
        const systemPrompt = buildSystemPrompt(context);
        const fullPrompt = `${systemPrompt}\n\nUser Question: ${query}`;

        const modelCandidates = getModelCandidates();
        let response: Response | null = null;
        let errorData = '';
        for (const modelName of modelCandidates) {
            const candidateResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: fullPrompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 1024,
                        },
                        safetySettings: [
                            {
                                category: "HARM_CATEGORY_HARASSMENT",
                                threshold: "BLOCK_MEDIUM_AND_ABOVE"
                            },
                            {
                                category: "HARM_CATEGORY_HATE_SPEECH",
                                threshold: "BLOCK_MEDIUM_AND_ABOVE"
                            }
                        ]
                    }),
                });

            if (candidateResponse.ok) {
                response = candidateResponse;
                break;
            }

            errorData = await candidateResponse.text();
            console.error(`Gemini API error for model ${modelName}:`, errorData);

            // Model not found/retired; continue trying fallback models.
            if (candidateResponse.status === 404) {
                continue;
            }

            response = candidateResponse;
            break;
        }

        if (!response || !response.ok) {
            console.error('Gemini API error:', errorData);
            const statusCode = response?.status ?? 0;
            return NextResponse.json(
                {
                    response: 'AI provider is unavailable right now. Please retry shortly.',
                    context,
                    timestamp: new Date().toISOString(),
                    unavailable: [`Gemini API error (${statusCode}).`]
                },
                { status: 200 }
            );
        }

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

        return NextResponse.json({
            response: aiResponse,
            context: context,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('AI Assistant API error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

function buildSystemPrompt(context: AiAssistantRequest['context']): string {
    let prompt = `You are an expert DeFi trading assistant for LiquiMint on Polygon Amoy testnet.

Your role is to provide:
1. Real-time trading insights and swap suggestions
2. Liquidity pool analysis and yield projections
3. Risk assessment for trades
4. Gas optimization tips
5. Portfolio recommendations

`;

    // Add wallet context
    if (context?.walletAddress) {
        prompt += `\nUser Wallet: ${context.walletAddress}`;
    }

    // Add reputation context
    if (context?.reputationScore !== undefined) {
        const tier = getReputationTier(context.reputationScore);
        const feeRate = getFeeRate(context.reputationScore);
        prompt += `\nReputation Score: ${context.reputationScore} XP (${tier} tier)`;
        prompt += `\nCurrent Fee Rate: ${feeRate}% (${getFeeDiscount(context.reputationScore)} discount)`;
    }

    // Add balance context
    if (context?.balances && Object.keys(context.balances).length > 0) {
        prompt += `\n\nToken Balances:`;
        for (const [token, balance] of Object.entries(context.balances)) {
            prompt += `\n- ${token}: ${balance.toFixed(4)}`;
        }
    }

    // Add pool data context
    if (context?.poolData && context.poolData.length > 0) {
        prompt += `\n\nAvailable Pools:`;
        context.poolData.forEach((pool: any) => {
            prompt += `\n- ${pool.name}: ${pool.reserve0} / ${pool.reserve1} (TVL: $${pool.tvl?.toFixed(2) || '0'})`;
        });
    }

    // Add gas context
    if (context?.gasPrice) {
        prompt += `\n\nCurrent Gas Price: ${context.gasPrice} Gwei`;
    }

    prompt += `\n\nProvide concise, actionable advice. Focus on:
- Optimal swap routes and timing
- Slippage warnings
- Liquidity depth analysis
- Yield opportunities
- Risk factors

Be specific with numbers and recommendations. If suggesting a swap, explain why it's optimal now.`;

    return prompt;
}

function getReputationTier(score: number): string {
    if (score >= 500) return 'Diamond';
    if (score >= 100) return 'Gold';
    if (score >= 50) return 'Silver';
    return 'Bronze';
}

function getFeeRate(score: number): number {
    if (score >= 500) return 0.05;
    if (score >= 100) return 0.10;
    if (score >= 50) return 0.20;
    return 0.30;
}

function getFeeDiscount(score: number): string {
    if (score >= 500) return '83% off';
    if (score >= 100) return '67% off';
    if (score >= 50) return '33% off';
    return 'none';
}

function resolveGeminiApiKey(): string | null {
    const raw = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '').trim();
    if (!raw) return null;
    const normalized = raw.toLowerCase();
    if (normalized.includes('your_gemini_api_key')) return null;
    return raw;
}

function getModelCandidates(): string[] {
    const primary = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
    const fallbacks = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    return [primary, ...fallbacks.filter((m) => m !== primary)];
}
