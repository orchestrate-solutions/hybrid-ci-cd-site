import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  architectureApi,
  SecurityGuaranteeDetail,
  RiskComparisonRow,
  ArchitectureSection,
} from '../architecture';

describe('Architecture API', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getSecurityGuarantees', () => {
    it('should fetch security guarantees from API', async () => {
      const mockData: SecurityGuaranteeDetail[] = [
        {
          title: 'No Payload Storage',
          description: 'Webhook events contain no payload data',
          implementation: 'WebhookEvent has no payload field',
          verified: true,
          testCases: ['test_webhook_event_has_no_payload_field'],
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ guarantees: mockData }),
      });

      const result = await architectureApi.getSecurityGuarantees();
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/architecture/security-guarantees')
      );
    });

    it('should handle fetch errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(architectureApi.getSecurityGuarantees()).rejects.toThrow(
        'Failed to fetch security guarantees'
      );
    });

    it('should handle HTTP errors', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(architectureApi.getSecurityGuarantees()).rejects.toThrow(
        '500'
      );
    });
  });

  describe('getRiskComparison', () => {
    it('should fetch risk comparison data', async () => {
      const mockData: RiskComparisonRow[] = [
        {
          riskFactor: 'Webhook Secrets',
          githubActions: 'GitHub stores',
          jenkinsHosted: 'User stores',
          oldModel: 'Provider stores ❌',
          netZero: 'User vault only ✅',
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comparison: mockData }),
      });

      const result = await architectureApi.getRiskComparison();
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/architecture/risk-comparison')
      );
    });

    it('should handle API error responses', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(architectureApi.getRiskComparison()).rejects.toThrow('404');
    });
  });

  describe('getArchitectureFlow', () => {
    it('should fetch architecture flow sections', async () => {
      const mockData: ArchitectureSection[] = [
        {
          title: 'User Infrastructure',
          description: 'Relay receives webhook and sanitizes data',
          components: ['Relay', 'Vault', 'Queue'],
          details: 'Processes webhooks with zero data exposure',
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sections: mockData }),
      });

      const result = await architectureApi.getArchitectureFlow();
      expect(result).toEqual(mockData);
    });

    it('should handle network timeouts', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(
        new Error('Request timeout')
      );

      await expect(architectureApi.getArchitectureFlow()).rejects.toThrow(
        'Failed to fetch architecture flow'
      );
    });
  });

  describe('getNetZeroModel', () => {
    it('should fetch NET ZERO model overview', async () => {
      const mockData = {
        overview: 'Provider has ZERO access to secrets',
        keyPrinciple:
          'Provider sees ONLY metadata (repo name, commit SHA, branch, event type)',
        benefits: [
          'Data custody remains with user',
          'Zero additional risk vs GitHub Actions',
          'Full transparency on data access',
        ],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await architectureApi.getNetZeroModel();
      expect(result).toEqual(mockData);
    });

    it('should include all required fields in model', async () => {
      const mockData = {
        overview: 'Provider has ZERO access to secrets',
        keyPrinciple: 'Provider sees ONLY metadata',
        benefits: ['Benefit 1', 'Benefit 2'],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await architectureApi.getNetZeroModel();
      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('keyPrinciple');
      expect(result).toHaveProperty('benefits');
    });
  });

  describe('getDataFlow', () => {
    it('should fetch detailed data flow information', async () => {
      const mockData = {
        stages: [
          {
            name: 'Webhook Reception',
            description: 'Relay receives webhook from external tool',
            dataVisible: false,
          },
          {
            name: 'Signature Verification',
            description: 'HMAC-SHA256 verification with user vault secret',
            dataVisible: false,
          },
          {
            name: 'Payload Sanitization',
            description: 'Extract metadata only, discard full payload',
            dataVisible: false,
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await architectureApi.getDataFlow();
      expect(result.stages).toHaveLength(3);
      expect(result.stages[0]).toHaveProperty('name');
    });

    it('should handle empty data flow response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stages: [] }),
      });

      const result = await architectureApi.getDataFlow();
      expect(result.stages).toEqual([]);
    });
  });
});
