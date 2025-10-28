environment = "staging"
aws_region = "us-east-1"
lambda_memory_mb = 512
lambda_timeout_seconds = 30
dynamodb_billing_mode = "PAY_PER_REQUEST"
cors_origins = [
  "http://localhost:3000",
  "https://staging.example.com"
]
log_retention_days = 7
