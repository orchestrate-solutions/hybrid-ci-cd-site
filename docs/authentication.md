# Authentication Systems

## 1. User Authentication: Stateful Sessions (Not JWTs)

The platform rejects outdated stateless JWTs in favor of a secure, stateful session model:

1. **OAuth Login**: User authenticates via your SSO provider (Okta, Google, Azure AD).

2. **Session Creation**: A serverless function creates a session record in a dedicated database (like DynamoDB or Redis) with a short Time-To-Live (TTL).

3. **Secure Cookie**: A cryptographically secure, random session ID is returned to the user in an `httpOnly`, `secure`, `SameSite=Strict` cookie.

4. **Validation**: On every API call, the control plane validates the session ID against the database. This allows for **instant session revocation** by simply deleting the session record.

This model provides robust protection against XSS and CSRF attacks and ensures compromised sessions can be terminated immediately.

## 2. Agent Authentication: Workload Identity Federation

Agents do not use long-lived static credentials. Instead, they leverage your cloud's native IAM capabilities:

1. **Assume Role**: The agent, running as a workload in your cloud (e.g., an ECS task or Kubernetes pod), assumes an IAM role with tightly scoped permissions.

2. **Get Credentials**: It acquires short-lived credentials (15-minute expiry) directly from the cloud provider's metadata service.

3. **Signed Requests**: The agent uses these credentials to sign its API requests to the control plane (e.g., using AWS Signature V4).

4. **Auto-Rotation**: Credentials are automatically rotated by the cloud provider, eliminating the need to manage secrets for the agents themselves.
