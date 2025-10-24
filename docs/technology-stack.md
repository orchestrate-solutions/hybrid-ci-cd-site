# Technology Stack

Updated for security best practices with stateful sessions and workload identity federation.

## Frontend Layer

- **Framework**: Next.js with Static Site Generation (SSG)
- **Hosting**: GitHub Pages / Cloudflare Pages / Vercel

## API Layer

- **Compute**: AWS Lambda / Cloudflare Workers
- **Authentication**: **Stateful Session Management** using DynamoDB or Redis
- **User Identity**: OAuth 2.0 with enterprise SSO providers
- **Cookies**: `httpOnly`, `secure`, `SameSite=Strict` session cookies

## Agent Layer

- **Runtime**: Docker containers on ECS/EKS or Kubernetes
- **Authentication**: **Workload Identity Federation** (AWS IAM Roles, GCP Workload Identity, Azure Managed Identities)
- **Communication**: Outbound-only HTTPS with signed requests (e.g., AWS Signature V4)

## Configuration Layer

- **Format**: YAML/JSON schemas with validation
- **Storage**: Git repository as single source of truth
