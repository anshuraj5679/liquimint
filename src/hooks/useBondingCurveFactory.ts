/**
 * Hook for interacting with BondingCurveFactoryV3
 */
import { usePublicClient, useReadContract, useWriteContract } from 'wagmi';
import { parseEther, parseGwei } from 'viem';
import { contractAddresses, CurveType } from '@/config/contracts-v2';
import BondingCurveFactoryV3ABI from '@/config/abis/BondingCurveFactoryV3.json';

const MIN_PRIORITY_FEE_WEI = parseGwei('25');
const MIN_MAX_FEE_WEI = parseGwei('60');

export function useBondingCurveFactory() {
  // Read total tokens
  const { data: totalTokens } = useReadContract({
    address: contractAddresses.bondingCurveFactory as `0x${string}`,
    abi: BondingCurveFactoryV3ABI,
    functionName: 'getTotalTokens',
  });

  // Read creation fee
  const { data: creationFee } = useReadContract({
    address: contractAddresses.bondingCurveFactory as `0x${string}`,
    abi: BondingCurveFactoryV3ABI,
    functionName: 'creationFee',
  });

  return {
    totalTokens: totalTokens ? Number(totalTokens) : 0,
    creationFee: creationFee ? creationFee.toString() : '0',
  };
}

export function useGetTokenInfo(tokenAddress: string) {
  const { data: tokenInfo, isLoading } = useReadContract({
    address: contractAddresses.bondingCurveFactory as `0x${string}`,
    abi: BondingCurveFactoryV3ABI,
    functionName: 'getTokenInfo',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });

  return {
    tokenInfo,
    isLoading,
  };
}

export function useGetCreatorTokens(creatorAddress: string) {
  const { data: tokens, isLoading, refetch } = useReadContract({
    address: contractAddresses.bondingCurveFactory as `0x${string}`,
    abi: BondingCurveFactoryV3ABI,
    functionName: 'getCreatorTokens',
    args: [creatorAddress],
    query: {
      enabled: !!creatorAddress,
    },
  });

  return {
    tokens: tokens as string[] | undefined,
    isLoading,
    refetch,
  };
}

export function useCreateToken() {
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  const createToken = async (
    name: string,
    symbol: string,
    curveType: CurveType,
    initialPrice: string,
    creatorRoyalty: number,
    metadata: string,
    creationFee: string
  ) => {
    let maxPriorityFeePerGas = MIN_PRIORITY_FEE_WEI;
    let maxFeePerGas = MIN_MAX_FEE_WEI;

    // Amoy RPC providers can reject low tip caps; enforce a safe fee floor.
    if (publicClient) {
      try {
        const estimated = await publicClient.estimateFeesPerGas({ type: 'eip1559' });
        if (estimated.maxPriorityFeePerGas && estimated.maxPriorityFeePerGas > maxPriorityFeePerGas) {
          maxPriorityFeePerGas = estimated.maxPriorityFeePerGas;
        }
        if (estimated.maxFeePerGas && estimated.maxFeePerGas > maxFeePerGas) {
          maxFeePerGas = estimated.maxFeePerGas;
        }
      } catch {
        // Use fallback floor values when provider fee estimation is unavailable.
      }
    }

    if (maxFeePerGas < maxPriorityFeePerGas) {
      maxFeePerGas = maxPriorityFeePerGas * 2n;
    }

    return writeContractAsync({
      address: contractAddresses.bondingCurveFactory as `0x${string}`,
      abi: BondingCurveFactoryV3ABI,
      functionName: 'createToken',
      args: [name, symbol, curveType, parseEther(initialPrice), creatorRoyalty, metadata],
      value: parseEther(creationFee),
      maxPriorityFeePerGas,
      maxFeePerGas,
    });
  };

  return {
    createToken,
    isLoading: isPending,
  };
}

export default {
  useBondingCurveFactory,
  useGetTokenInfo,
  useGetCreatorTokens,
  useCreateToken,
};
