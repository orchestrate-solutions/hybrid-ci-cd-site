# The Problem

Organizations face an impossible choice when selecting CI/CD and secrets management platforms:

**Traditional SaaS Solutions** require uploading secrets to third-party infrastructure, creating compliance risks and increasing the attack surface. A breach at the vendor compromises every customer's credentials[3][1].

**Self-Hosted Solutions** provide security control but burden engineering teams with maintenance, scaling, upgrades, and 24/7 operations—consuming 30-50% of platform engineering capacity[2].

**Legacy Authentication** using stateless tokens (like JWTs) introduces vulnerabilities such as an inability to instantly revoke compromised sessions, exposure to XSS attacks, and token leakage.

## Citations

[1] Hybrid Control Plane Architecture: Cloud Orchestration | Airbyte https://airbyte.com/data-engineering-resources/hybrid-control-plane-architecture-cloud-orchestration

[2] Get to Know EDB's Hybrid Control Plane: Centralized Management ... https://www.enterprisedb.com/blog/get-know-edbs-hybrid-control-plane-centralized-management-and-automation-end-end-observability

[3] Data Plane Isolation: Keeping Credentials and Buffers Local - Airbyte https://airbyte.com/data-engineering-resources/data-plane-isolation-enterprise-credentials-local
