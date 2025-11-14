// Architecture API client - NET ZERO security model documentation
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface SecurityGuaranteeDetail {
  title: string;
  description: string;
  implementation: string;
  verified: boolean;
  testCases: string[];
}

export interface RiskComparisonRow {
  riskFactor: string;
  githubActions: string;
  jenkinsHosted: string;
  oldModel: string;
  netZero: string;
}

export interface ArchitectureSection {
  title: string;
  description: string;
  components: string[];
  details: string;
}

export interface DataFlowStage {
  name: string;
  description: string;
  dataVisible: boolean;
}

export interface DataFlowInfo {
  stages: DataFlowStage[];
}

export interface NetZeroModel {
  overview: string;
  keyPrinciple: string;
  benefits: string[];
}

export const architectureApi = {
  async getSecurityGuarantees(): Promise<SecurityGuaranteeDetail[]> {
    const res = await fetch(
      `${BASE_URL}/api/architecture/security-guarantees`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch security guarantees`);
    const data = await res.json();
    return data.guarantees || [];
  },

  async getRiskComparison(): Promise<RiskComparisonRow[]> {
    const res = await fetch(`${BASE_URL}/api/architecture/risk-comparison`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch risk comparison`);
    const data = await res.json();
    return data.comparison || [];
  },

  async getArchitectureFlow(): Promise<ArchitectureSection[]> {
    const res = await fetch(`${BASE_URL}/api/architecture/flow`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch architecture flow`);
    const data = await res.json();
    return data.sections || [];
  },

  async getNetZeroModel(): Promise<NetZeroModel> {
    const res = await fetch(`${BASE_URL}/api/architecture/net-zero-model`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch NET ZERO model`);
    return res.json();
  },

  async getDataFlow(): Promise<DataFlowInfo> {
    const res = await fetch(`${BASE_URL}/api/architecture/data-flow`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch data flow`);
    return res.json();
  },
};
