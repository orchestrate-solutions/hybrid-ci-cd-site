"""
DynamoDB table definitions for dashboard (jobs and deployments).

These tables are used for production job tracking and deployment history.
In development, the in-memory store is used instead.
"""

# This is a placeholder for Terraform definitions
# Actual Terraform code should be in terraform/dynamodb.tf

# Job Table Structure:
# Primary Key: job_id (String)
# Global Secondary Index 1: status (String) + created_at (String) for status queries
# Global Secondary Index 2: agent_id (String) + created_at (String) for agent job queries
# TTL: 90 days auto-expiration
# Billing: PAY_PER_REQUEST (on-demand)

# Deployment Table Structure:
# Primary Key: deployment_id (String)
# Global Secondary Index 1: service_name (String) + created_at (String) for service history
# Global Secondary Index 2: status (String) + created_at (String) for status queries
# TTL: 180 days auto-expiration
# Billing: PAY_PER_REQUEST (on-demand)

# See: terraform/dynamodb.tf for actual table creation code
