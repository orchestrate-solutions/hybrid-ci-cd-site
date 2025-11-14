'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  architectureApi,
  SecurityGuaranteeDetail,
  RiskComparisonRow,
  ArchitectureSection,
  NetZeroModel,
  DataFlowInfo,
} from '@/lib/api/architecture';

interface UseArchitectureReturn {
  securityGuarantees: SecurityGuaranteeDetail[];
  riskComparison: RiskComparisonRow[];
  architectureFlow: ArchitectureSection[];
  netZeroModel: NetZeroModel | null;
  dataFlow: DataFlowInfo | null;
  loading: boolean;
  error: Error | null;
  refreshSecurityGuarantees: () => Promise<void>;
  refreshRiskComparison: () => Promise<void>;
  refreshArchitectureFlow: () => Promise<void>;
  refreshNetZeroModel: () => Promise<void>;
  refreshDataFlow: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export function useArchitecture(): UseArchitectureReturn {
  const [securityGuarantees, setSecurityGuarantees] = useState<
    SecurityGuaranteeDetail[]
  >([]);
  const [riskComparison, setRiskComparison] = useState<RiskComparisonRow[]>([]);
  const [architectureFlow, setArchitectureFlow] = useState<
    ArchitectureSection[]
  >([]);
  const [netZeroModel, setNetZeroModel] = useState<NetZeroModel | null>(null);
  const [dataFlow, setDataFlow] = useState<DataFlowInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshSecurityGuarantees = useCallback(async () => {
    try {
      const data = await architectureApi.getSecurityGuarantees();
      setSecurityGuarantees(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    }
  }, []);

  const refreshRiskComparison = useCallback(async () => {
    try {
      const data = await architectureApi.getRiskComparison();
      setRiskComparison(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    }
  }, []);

  const refreshArchitectureFlow = useCallback(async () => {
    try {
      const data = await architectureApi.getArchitectureFlow();
      setArchitectureFlow(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    }
  }, []);

  const refreshNetZeroModel = useCallback(async () => {
    try {
      const data = await architectureApi.getNetZeroModel();
      setNetZeroModel(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    }
  }, []);

  const refreshDataFlow = useCallback(async () => {
    try {
      const data = await architectureApi.getDataFlow();
      setDataFlow(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshSecurityGuarantees(),
        refreshRiskComparison(),
        refreshArchitectureFlow(),
        refreshNetZeroModel(),
        refreshDataFlow(),
      ]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch all data'));
    } finally {
      setLoading(false);
    }
  }, [
    refreshSecurityGuarantees,
    refreshRiskComparison,
    refreshArchitectureFlow,
    refreshNetZeroModel,
    refreshDataFlow,
  ]);

  useEffect(() => {
    refreshAll();
  }, []);

  return {
    securityGuarantees,
    riskComparison,
    architectureFlow,
    netZeroModel,
    dataFlow,
    loading,
    error,
    refreshSecurityGuarantees,
    refreshRiskComparison,
    refreshArchitectureFlow,
    refreshNetZeroModel,
    refreshDataFlow,
    refreshAll,
  };
}
