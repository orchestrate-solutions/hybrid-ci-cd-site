# Solution: Zero-Knowledge Hybrid Architecture

A modern platform that separates orchestration logic from data execution through **control plane and data plane isolation**, fortified with state-of-the-art authentication.

## Control Plane (Managed SaaS)

- Dashboard UI and workflow orchestration
- Job scheduling and pipeline coordination
- Agent registration and health monitoring
- Centralized, stateful session management for user access

**Hosted by provider. Contains zero secrets or customer data**[1][4].

## Data Plane (Your Infrastructure)

- CI/CD job execution on self-hosted agents
- Secret storage in your existing vault (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
- Source code, build artifacts, and production credentials
- Authentication via cloud-native Workload Identity Federation

**Runs in your cloud. Provider has no access**[3][1][4].

## Communication Model

Agents in your infrastructure use short-lived, auto-rotated credentials from your cloud provider (e.g., AWS IAM) to initiate outbound-only HTTPS connections. The provider can only send instructions—never read your secrets or data[3][1].

## Citations

[1] Hybrid Control Plane Architecture: Cloud Orchestration | Airbyte https://airbyte.com/data-engineering-resources/hybrid-control-plane-architecture-cloud-orchestration

[3] Data Plane Isolation: Keeping Credentials and Buffers Local - Airbyte https://airbyte.com/data-engineering-resources/data-plane-isolation-enterprise-credentials-local

[4] Control Plane in Cloud Security: Control vs. Data Plane | CrowdStrike https://www.crowdstrike.com/en-us/cybersecurity-101/cloud-security/control-plane/
