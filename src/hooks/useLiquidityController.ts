/**
 * Hook for interacting with LiquidityController
 */
import { usePublicClient, useReadContract, useWriteContract } from 'wagmi';
import { parseEther, parseGwei } from 'viem';
import { contractAddresses } from '@/config/contracts-v2';
import LiquidityControllerABI from '@/config/abis/LiquidityController.json';

const MIN_PRIORITY_FEE_WEI = parseGwei('25');
const MIN_MAX_FEE_WEI = parseGwei('60');

const getEip1559FeeOverrides = async (publicClient: ReturnType<typeof usePublicClient>) => {
  let maxPriorityFeePerGas = MIN_PRIORITY_FEE_WEI;
  let maxFeePerGas = MIN_MAX_FEE_WEI;

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
      // Keep floor values when fee estimation is unavailable.
    }
  }

  if (maxFeePerGas < maxPriorityFeePerGas) {
    maxFeePerGas = maxPriorityFeePerGas * 2n;
  }

  return {
    maxPriorityFeePerGas,
    maxFeePerGas,
  };
};

export function useLockLiquidity() {
  const { writeContractAsync, isPending, data } = useWriteContract();
  const publicClient = usePublicClient();

  const lockLiquidity = async (
    tokenAddress: string,
    lpTokenAddress: string,
    amount: string,
    durationDays: number
  ) => {
    const durationSeconds = durationDays * 24 * 60 * 60;
    const percentage = 100; // Lock 100% of the specified amount
    const feeOverrides = await getEip1559FeeOverrides(publicClient);

    return writeContractAsync({
      address: contractAddresses.liquidityController as `0x${string}`,
      abi: LiquidityControllerABI,
      functionName: 'lockLiquidity',
      args: [
        tokenAddress,
        lpTokenAddress,
        parseEther(amount),
        durationSeconds,
        percentage
      ],
      ...feeOverrides,
    });
  };

  return {
    lockLiquidity,
    isLoading: isPending,
    txHash: data,
  };
}

export function useGetLockInfo(lockId: bigint | number | undefined) {
  const parsedLockId = BigInt(lockId ?? 0);
  const { data: lockInfo, isLoading } = useReadContract({
    address: contractAddresses.liquidityController as `0x${string}`,
    abi: LiquidityControllerABI,
    functionName: 'locks',
    args: [parsedLockId],
    query: {
      enabled: lockId !== undefined,
    },
  });

  return {
    lockInfo,
    isLoading,
  };
}

export function useGetUserLocks(userAddress: string) {
  const { data: lockIds, isLoading } = useReadContract({
    address: contractAddresses.liquidityController as `0x${string}`,
    abi: LiquidityControllerABI,
    functionName: 'getUserLocks',
    args: [userAddress],
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    lockIds: lockIds as bigint[] | undefined,
    isLoading,
  };
}

export function useGetUserRewards(userAddress: string) {
  const { data: rewards, isLoading } = useReadContract({
    address: contractAddresses.liquidityController as `0x${string}`,
    abi: LiquidityControllerABI,
    functionName: 'getUserRewards',
    args: [userAddress],
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    rewards: rewards as bigint | undefined,
    isLoading,
  };
}

export function useUnlockLiquidity() {
  const { writeContractAsync, isPending, data } = useWriteContract();
  const publicClient = usePublicClient();

  const unlockLiquidity = async (lockId: bigint | number) => {
    const feeOverrides = await getEip1559FeeOverrides(publicClient);
    return writeContractAsync({
      address: contractAddresses.liquidityController as `0x${string}`,
      abi: LiquidityControllerABI,
      functionName: 'unlockLiquidity',
      args: [BigInt(lockId)],
      ...feeOverrides,
    });
  };

  return {
    unlockLiquidity,
    isLoading: isPending,
    txHash: data,
  };
}

export function useClaimRewards() {
  const { writeContractAsync, isPending, data } = useWriteContract();
  const publicClient = usePublicClient();

  const claimRewards = async (lockId: bigint | number) => {
    const feeOverrides = await getEip1559FeeOverrides(publicClient);
    return writeContractAsync({
      address: contractAddresses.liquidityController as `0x${string}`,
      abi: LiquidityControllerABI,
      functionName: 'claimRewards',
      args: [BigInt(lockId)],
      ...feeOverrides,
    });
  };

  return {
    claimRewards,
    isLoading: isPending,
    txHash: data,
  };
}

export default {
  useLockLiquidity,
  useGetLockInfo,
  useGetUserLocks,
  useGetUserRewards,
  useUnlockLiquidity,
  useClaimRewards,
};
