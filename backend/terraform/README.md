"""Terraform configuration for AWS Lambda and DynamoDB deployment."""

# This directory contains Infrastructure as Code (IaC) for deploying the
# hybrid CI/CD control plane backend to AWS Lambda with DynamoDB storage.
#
# Structure:
#   main.tf            - AWS provider and general configuration
#   dynamodb.tf        - DynamoDB table definitions
#   lambda.tf          - Lambda function and execution role
#   api_gateway.tf     - API Gateway HTTP API routes
#   iam.tf             - IAM roles and policies
#   variables.tf       - Input variables
#   outputs.tf         - Output values
#   environments/      - Environment-specific configurations
#
# Usage:
#   Staging:
#     cd terraform/environments/staging
#     terraform init
#     terraform plan
#     terraform apply
#   
#   Production:
#     cd terraform/environments/production
#     terraform init
#     terraform plan
#     terraform apply
