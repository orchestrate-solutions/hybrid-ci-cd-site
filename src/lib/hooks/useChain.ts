/**
 * useChain - Base hook for running CodeUChain chains
 * 
 * Pattern: Run chain, manage loading/error/data states
 * Returns: {data, loading, error, refetch}
 * 
 * IMPORTANT: Custom chains (JobsChain, AgentsChain, etc.) have their own 
 * .run(initialData) method that takes a plain object and returns a plain object
 * (they handle Context creation and toObject() internally).
 */

import { useEffect, useState, useCallback, useMemo } from 'react';

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
 * Serialize chainInput to stable string for dependency comparison
 * This prevents infinite loops when chainInput is recreated with same data
 */
function serializeInput(input: Record<string, any>): string {
  try {
    return JSON.stringify(input);
  } catch {
    // Fallback for circular references or non-serializable objects
    return 'unstable';
  }
}

/**
 * Base hook for running CodeUChain chains
 * 
 * Usage:
 *   const jobsChain = new JobsChain();
 *   const { data, loading, error } = useChain(jobsChain, {filters: {...}});
 *   
 * Note: Chains must have a .run(initialData) method that returns Promise<T>
 * 
 * Fix for infinite loop (maximum update depth exceeded):
 * - Memoize chainInput with serialization (not reference equality)
 * - This prevents execute() from changing on every render just because
 *   the object reference changed but content stayed the same
 * - execute now depends on stable serialized input, not the raw object
 */
export function useChain<T = any>(
  chain: { run: (initialData?: Record<string, any>) => Promise<T> },
  chainInput: Record<string, any> = {},
  options: UseChainOptions = {}
): UseChainResult<T> {
  const { autoRun = true, initialData = null } = options;
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Memoize chainInput based on serialized content, not reference
  // This prevents execute() callback from changing when input content is identical
  const inputKey = useMemo(() => serializeInput(chainInput), [chainInput]);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Custom chains have .run(initialData) that returns a plain object
      // (they create Context internally and call toObject())
      const chainData = await chain.run(chainInput);
      setData(chainData as T);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('useChain error:', error);
    } finally {
      setLoading(false);
    }
  }, [chain, inputKey]); // Depend on inputKey, not chainInput directly

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
