environment = "production"
aws_region = "us-east-1"
lambda_memory_mb = 1024
lambda_timeout_seconds = 30
lambda_reserved_concurrency = 100
dynamodb_billing_mode = "PROVISIONED"
dynamodb_read_capacity = 20
dynamodb_write_capacity = 20
cors_origins = [
  "https://api.example.com",
  "https://dashboard.example.com"
]
log_retention_days = 30
session_ttl_hours = 24
