# Task 8: AWS Lambda & DynamoDB Integration — Deployment Guide

## Overview

This guide walks through deploying the hybrid CI/CD backend to AWS using Lambda + DynamoDB + API Gateway.

## Architecture Decisions Made

### Session Model: Hybrid (Option C)
- **Primary Key**: `session_id` (HASH)
- **Sort Key**: `user_id` (in GSI)
- **Benefit**: Can track both individual sessions AND query all sessions for a user
- **Use Case**: List "active devices" or force logout across all devices

### DynamoDB Billing: Pay-Per-Request (Staging)
- **Staging**: On-demand billing (variable load, cost-conscious)
- **Production**: Provisioned with auto-scaling (predictable load)
- **Change**: Update `terraform/environments/production/terraform.tfvars`

### Token Storage: Browser-based (MVP)
- OAuth refresh tokens stored in browser localStorage (not server)
- Reduces backend complexity, but increases client security responsibility
- **Future**: Move to DynamoDB for enhanced security

## Step 1: Prerequisites

```bash
# Verify AWS CLI is installed
aws --version

# Verify Terraform is installed
terraform version

# Configure AWS credentials
aws configure

# Verify you can access AWS
aws sts get-caller-identity
```

## Step 2: Build Lambda Deployment Package

```bash
cd backend/

# Create deployment package
make build

# Result: terraform/lambda_function.zip created
ls -lh terraform/lambda_function.zip
```

## Step 3: Deploy to Staging

```bash
cd backend/terraform/environments/staging

# Initialize Terraform (first time only)
terraform init

# Review planned changes
terraform plan

# Apply infrastructure
terraform apply

# Save outputs
terraform output > outputs.json
```

Expected outputs:
```
api_endpoint = "https://xxxxx.lambda-url.us-east-1.on.aws/staging"
dynamodb_sessions_table = "hybrid-ci-cd-sessions-staging"
dynamodb_jobs_table = "hybrid-ci-cd-jobs-staging"
dynamodb_agents_table = "hybrid-ci-cd-agents-staging"
lambda_function_name = "hybrid-ci-cd-staging"
```

## Step 4: Verify Deployment

```bash
# Get API endpoint from outputs
API_ENDPOINT=$(terraform output -raw api_endpoint)

# Test health check
curl $API_ENDPOINT/health

# Expected response:
# {"status":"healthy","version":"0.1.0"}
```

## Step 5: Create Session (End-to-End Test)

```bash
API_ENDPOINT=$(terraform output -raw api_endpoint)

# Create session
curl -X POST $API_ENDPOINT/auth/session \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "provider": "google",
    "oauth_tokens": {"access_token": "test_token"},
    "user_info": {"email": "user@example.com"}
  }'

# Extract session_id from response
SESSION_ID="<session_id_from_response>"

# Validate session
curl -X POST $API_ENDPOINT/auth/validate \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\"}"

# Expected: {"valid":true,"user_id":"user123",...}
```

## Step 6: Monitor Deployment

```bash
# View Lambda logs
aws logs tail /aws/lambda/hybrid-ci-cd-staging --follow

# View DynamoDB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=hybrid-ci-cd-sessions-staging \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# Query sessions table
aws dynamodb scan \
  --table-name hybrid-ci-cd-sessions-staging \
  --region us-east-1
```

## Step 7: Deploy to Production

Same process, different directory:

```bash
cd backend/terraform/environments/production

terraform init
terraform plan

# Review carefully! Production is real.
terraform apply
```

Production settings:
- Lambda memory: 1024 MB (vs 512 in staging)
- Reserved concurrency: 100 executions
- DynamoDB: Provisioned with auto-scaling
- Log retention: 30 days (vs 7 in staging)

## Step 8: Configure GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Lambda package
        run: |
          cd backend
          make build
      
      - name: Deploy to Staging
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          cd backend/terraform/environments/staging
          terraform init -backend-config="key=hybrid-ci-cd-staging/terraform.tfstate"
          terraform apply -auto-approve
      
      - name: Run smoke tests
        run: |
          API_ENDPOINT=$(terraform output -raw api_endpoint)
          curl $API_ENDPOINT/health
```

## Rollback Procedure

If something goes wrong:

```bash
cd backend/terraform/environments/staging

# View previous state
terraform state list

# Rollback to previous Lambda version
aws lambda update-alias \
  --function-name hybrid-ci-cd-staging \
  --name live \
  --function-version <previous-version>

# Or destroy and re-deploy
terraform destroy
terraform apply
```

## Troubleshooting

### Lambda Cold Starts Too Slow

**Symptom**: First request takes 5+ seconds

**Solution**:
```bash
# Add provisioned concurrency
terraform apply -var="lambda_reserved_concurrency=10"

# Or use Lambda layers to reduce package size
```

### DynamoDB Throttling

**Symptom**: "Request rate exceeded" errors

**Solution**:
```bash
# Switch to provisioned billing
terraform apply \
  -var="dynamodb_billing_mode=PROVISIONED" \
  -var="dynamodb_read_capacity=20" \
  -var="dynamodb_write_capacity=20"
```

### Sessions Not Persisting

**Symptom**: Session valid immediately after creation, but expires instantly

**Solution**:
```bash
# Check TTL is set correctly
aws dynamodb describe-table \
  --table-name hybrid-ci-cd-sessions-staging \
  --query 'Table.TimeToLiveDescription'

# Verify expires_at is future timestamp
aws dynamodb get-item \
  --table-name hybrid-ci-cd-sessions-staging \
  --key '{"session_id":{"S":"<id>"}}'
```

### API Gateway CORS Issues

**Symptom**: Browser blocks requests with CORS error

**Solution**:
```bash
# Update CORS origins in Terraform
terraform apply \
  -var='cors_origins=["https://yourdomain.com"]'
```

## Cost Estimation

**Staging (on-demand)**:
- Lambda: $0.20 per 1M requests (1M requests = $0.20)
- DynamoDB on-demand: $1.25 per 1M read units, $6.25 per 1M write units
- Data transfer: $0.09 per GB out
- Estimated: $10-30/month (light usage)

**Production (provisioned)**:
- Lambda: Same as staging + reserved concurrency cost
- DynamoDB: $0.925 per read unit/hour + $4.625 per write unit/hour
- With 20 RCU + 20 WCU: ~$150/month
- Data transfer: $0.09 per GB out
- Estimated: $200-500/month

## Next Steps

1. ✅ Deploy to staging and run smoke tests
2. ✅ Configure GitHub Actions for automated deployment
3. ⬜ Add API Gateway logging to CloudWatch
4. ⬜ Set up CloudWatch alarms for errors/throttles
5. ⬜ Implement blue-green deployment
6. ⬜ Deploy to production

## Support

For issues, check:
1. CloudWatch Logs: `/aws/lambda/hybrid-ci-cd-*`
2. Terraform State: `terraform state list`
3. AWS Console: Lambda, DynamoDB, API Gateway
