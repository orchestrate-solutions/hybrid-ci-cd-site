/**
 * useChain - Base hook for running CodeUChain chains
 * 
 * Pattern: Run chain, manage loading/error/data states
 * Returns: {data, loading, error, refetch}
 */

import { useEffect, useState, useCallback } from 'react';
import { Context, Chain } from 'codeuchain';

export interface UseChainOptions {
  autoRun?: boolean;
  initialData?: any;
}

export interface UseChainResult<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Base hook for running CodeUChain chains
 */
export function useChain<T = any>(
  chain: Chain,
  chainInput: Record<string, any> = {},
  options: UseChainOptions = {}
): UseChainResult<T> {
  const { autoRun = true, initialData = null } = options;
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const ctx = new Context(chainInput);
      const result = await chain.run(ctx);
      
      // Extract meaningful data from chain result
      const chainData = result.to_dict() as T;
      setData(chainData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('useChain error:', error);
    } finally {
      setLoading(false);
    }
  }, [chain, chainInput]);

  useEffect(() => {
    if (autoRun) {
      execute();
    }
  }, [autoRun, execute]);

  return {
    data,
    loading,
    error,
    refetch: execute,
  };
}
