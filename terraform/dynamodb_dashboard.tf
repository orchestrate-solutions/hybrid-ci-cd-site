# DynamoDB table for job tracking
resource "aws_dynamodb_table" "hybrid_ci_cd_jobs" {
  name           = "hybrid-ci-cd-jobs"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "job_id"
  
  attribute {
    name = "job_id"
    type = "S"
  }
  
  attribute {
    name = "job_status"
    type = "S"
  }
  
  attribute {
    name = "created_at"
    type = "N"
  }
  
  attribute {
    name = "agent_id"
    type = "S"
  }
  
  # Global Secondary Index for querying by status and creation time
  global_secondary_index {
    name            = "status-created_at-index"
    hash_key        = "job_status"
    range_key       = "created_at"
    projection_type = "ALL"
  }
  
  # Global Secondary Index for querying by agent_id
  global_secondary_index {
    name            = "agent_id-created_at-index"
    hash_key        = "agent_id"
    range_key       = "created_at"
    projection_type = "ALL"
  }
  
  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }
  
  tags = {
    Name        = "hybrid-ci-cd-jobs"
    Environment = var.environment
    Service     = "dashboard"
  }
}

# DynamoDB table for deployment tracking
resource "aws_dynamodb_table" "hybrid_ci_cd_deployments" {
  name           = "hybrid-ci-cd-deployments"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "deployment_id"
  
  attribute {
    name = "deployment_id"
    type = "S"
  }
  
  attribute {
    name = "service_name"
    type = "S"
  }
  
  attribute {
    name = "created_at"
    type = "N"
  }
  
  attribute {
    name = "deployment_status"
    type = "S"
  }
  
  # Global Secondary Index for querying by service_name and creation time
  global_secondary_index {
    name            = "service_name-created_at-index"
    hash_key        = "service_name"
    range_key       = "created_at"
    projection_type = "ALL"
  }
  
  # Global Secondary Index for querying by status
  global_secondary_index {
    name            = "deployment_status-created_at-index"
    hash_key        = "deployment_status"
    range_key       = "created_at"
    projection_type = "ALL"
  }
  
  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }
  
  tags = {
    Name        = "hybrid-ci-cd-deployments"
    Environment = var.environment
    Service     = "dashboard"
  }
}

# Outputs
output "jobs_table_name" {
  description = "DynamoDB table name for jobs"
  value       = aws_dynamodb_table.hybrid_ci_cd_jobs.name
}

output "jobs_table_arn" {
  description = "DynamoDB table ARN for jobs"
  value       = aws_dynamodb_table.hybrid_ci_cd_jobs.arn
}

output "deployments_table_name" {
  description = "DynamoDB table name for deployments"
  value       = aws_dynamodb_table.hybrid_ci_cd_deployments.name
}

output "deployments_table_arn" {
  description = "DynamoDB table ARN for deployments"
  value       = aws_dynamodb_table.hybrid_ci_cd_deployments.arn
}
