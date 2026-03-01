/**
 * Hook for interacting with LiquidityController
 */
import { useReadContract, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { contractAddresses } from '@/config/contracts-v2';
import LiquidityControllerABI from '@/config/abis/LiquidityController.json';

export function useLockLiquidity() {
  const { writeContractAsync, isPending, data } = useWriteContract();

  const lockLiquidity = async (
    tokenAddress: string,
    lpTokenAddress: string,
    amount: string,
    durationDays: number
  ) => {
    const durationSeconds = durationDays * 24 * 60 * 60;
    const percentage = 100; // Lock 100% of the specified amount

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

  const unlockLiquidity = async (lockId: bigint | number) => {
    return writeContractAsync({
      address: contractAddresses.liquidityController as `0x${string}`,
      abi: LiquidityControllerABI,
      functionName: 'unlockLiquidity',
      args: [BigInt(lockId)],
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

  const claimRewards = async (lockId: bigint | number) => {
    return writeContractAsync({
      address: contractAddresses.liquidityController as `0x${string}`,
      abi: LiquidityControllerABI,
      functionName: 'claimRewards',
      args: [BigInt(lockId)],
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
